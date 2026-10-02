import bcrypt from "bcrypt";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import jwt from "jsonwebtoken";
import { prisma } from "../../lib/prisma.js";
import { Prisma } from "../../generated/client.js";
import { env, refreshTokenLifetimeMs } from "../../config/env.js";

const accessSecret = env.JWT_ACCESS_SECRET;

const accessExpiresIn =
  env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"];

type RefreshTokenParts = {
  sessionId: string;
  secret: string;
};

const parseRefreshToken = (token: string): RefreshTokenParts | null => {
  const [sessionId, secret, ...rest] = token.split(".");

  if (!sessionId || !secret || rest.length > 0) {
    return null;
  }

  return { sessionId, secret };
};

const hashRefreshSecret = (secret: string) =>
  createHash("sha256").update(secret).digest("hex");

const refreshSecretMatches = (secret: string, tokenHash: string) => {
  const presentedHash = hashRefreshSecret(secret);

  return (
    presentedHash.length === tokenHash.length &&
    timingSafeEqual(Buffer.from(presentedHash), Buffer.from(tokenHash))
  );
};

const createRefreshSession = async (
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  userId: number
) => {
  const secret = randomBytes(32).toString("base64url");
  const session = await tx.refreshSession.create({
    data: {
      userId,
      tokenHash: hashRefreshSecret(secret),
      expiresAt: new Date(Date.now() + refreshTokenLifetimeMs),
    },
  });

  return `${session.id}.${secret}`;
};


export const registerUser = async (
  name: string,
  email: string,
  password: string
) => {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("Email already registered");
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  let user;

  try {
    user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("Email already registered");
    }

    throw error;
  }

  return user;
};

export const loginUser = async (
  email: string,
  password: string
) => {
  return prisma.$transaction(async (tx) => {
    const lockedUsers = await tx.$queryRaw<{ id: number }[]>`
      SELECT "id"
      FROM "User"
      WHERE "email" = ${email}
      FOR UPDATE
    `;

    if (!lockedUsers[0]) {
      throw new Error("Invalid email or password");
    }

    const user = await tx.user.findUnique({
      where: { id: lockedUsers[0].id },
    });

    if (!user) {
      throw new Error("Invalid email or password");
    }

    if (!user.isActive) {
      throw new Error("Account is deactivated");
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      throw new Error("Invalid email or password");
    }

    const refreshToken = await createRefreshSession(tx, user.id);
    const accessToken = generateAccessToken(
      user.id,
      user.role,
      user.authVersion
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  });
};

const generateAccessToken = (
  userId: number,
  role: string,
  authVersion: number
) => {
  return jwt.sign(
    { userId, role, authVersion },
    accessSecret,
    { expiresIn: accessExpiresIn }
  );
};

export const refreshAccessToken = async (refreshToken: string) => {
  const tokenParts = parseRefreshToken(refreshToken);

  if (!tokenParts) {
    throw new Error("Invalid refresh token");
  }

  const result = await prisma.$transaction(async (tx) => {
    const sessionReference = await tx.refreshSession.findUnique({
      where: { id: tokenParts.sessionId },
      select: { userId: true },
    });

    if (!sessionReference) {
      throw new Error("Invalid refresh token");
    }

    const lockedUsers = await tx.$queryRaw<{ id: number }[]>`
      SELECT "id"
      FROM "User"
      WHERE "id" = ${sessionReference.userId}
      FOR UPDATE
    `;

    if (!lockedUsers[0]) {
      throw new Error("Invalid refresh token");
    }

    await tx.$queryRaw<{ id: string }[]>`
      SELECT "id"
      FROM "RefreshSession"
      WHERE "id" = ${tokenParts.sessionId}
      FOR UPDATE
    `;

    const session = await tx.refreshSession.findUnique({
      where: { id: tokenParts.sessionId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            authVersion: true,
          },
        },
      },
    });

    if (!session || !refreshSecretMatches(tokenParts.secret, session.tokenHash)) {
      throw new Error("Invalid refresh token");
    }

    if (session.revokedAt) {
      await tx.user.update({
        where: { id: session.userId },
        data: {
          authVersion: {
            increment: 1,
          },
        },
      });

      await tx.refreshSession.updateMany({
        where: {
          userId: session.userId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });

      return { reuseDetected: true as const };
    }

    if (session.expiresAt <= new Date()) {
      throw new Error("Invalid refresh token");
    }

    if (!session.user.isActive) {
      throw new Error("Account is deactivated");
    }

    await tx.refreshSession.update({
      where: { id: session.id },
      data: {
        revokedAt: new Date(),
        lastUsedAt: new Date(),
      },
    });

    const nextRefreshToken = await createRefreshSession(tx, session.userId);
    const accessToken = generateAccessToken(
      session.user.id,
      session.user.role,
      session.user.authVersion
    );

    return {
      reuseDetected: false as const,
      refreshToken: nextRefreshToken,
      accessToken,
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        isActive: session.user.isActive,
      },
    };
  });

  if (result.reuseDetected) {
    throw new Error("Invalid refresh token");
  }

  return result;
};

export const revokeRefreshSession = async (refreshToken: string) => {
  const tokenParts = parseRefreshToken(refreshToken);

  if (!tokenParts) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    const lockedSessions = await tx.$queryRaw<{ id: string }[]>`
      SELECT "id"
      FROM "RefreshSession"
      WHERE "id" = ${tokenParts.sessionId}
      FOR UPDATE
    `;

    if (!lockedSessions[0]) {
      return;
    }

    const session = await tx.refreshSession.findUnique({
      where: { id: tokenParts.sessionId },
      select: {
        id: true,
        tokenHash: true,
        revokedAt: true,
      },
    });

    if (
      !session ||
      session.revokedAt ||
      !refreshSecretMatches(tokenParts.secret, session.tokenHash)
    ) {
      return;
    }

    await tx.refreshSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });
  });
};
