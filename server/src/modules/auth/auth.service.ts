import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import { prisma } from "../../lib/prisma.js";
import { env } from "../../config/env.js";

const accessSecret = env.JWT_ACCESS_SECRET;
const refreshSecret = env.JWT_REFRESH_SECRET;

const accessExpiresIn =
  env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"];

const refreshExpiresIn =
  env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"];


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

  const user = await prisma.user.create({
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

  return user;
};

export const loginUser = async (
  email: string,
  password: string
) => {
  const user = await prisma.user.findUnique({
    where: { email },
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

  const accessToken = generateAccessToken(
    user.id,
    user.role
  );

  const refreshToken = generateRefreshToken(user.id);

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
};

const generateAccessToken = (userId: number, role: string) => {
  return jwt.sign(
    { userId, role },
    accessSecret,
    { expiresIn: accessExpiresIn }
  );
};

const generateRefreshToken = (userId: number) => {
  return jwt.sign(
    { userId },
    refreshSecret,
    { expiresIn: refreshExpiresIn }
  );
};

export const refreshAccessToken = async (refreshToken: string) => {
  try {
    const decoded = jwt.verify(
      refreshToken,
      refreshSecret
    ) as { userId: number };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (!user.isActive) {
      throw new Error("Account is deactivated");
    }

    const accessToken = generateAccessToken(
      user.id,
      user.role
    );

    return {
      user,
      accessToken,
    };
  } catch(error) {
    if (error instanceof Error && error.message === "Account is deactivated") {
      throw error;
    }
    throw new Error("Invalid refresh token");
  }
};
