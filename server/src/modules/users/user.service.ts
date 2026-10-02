import { prisma } from "../../lib/prisma.js";
import bcrypt from "bcrypt";
import { Prisma } from "../../generated/client.js";
interface UpdateUserProfileData {
  name?: string;
  email?: string;
}

export const getUserProfile = async (userId: number) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

export const updateUserProfile = async (
  userId: number,
  data: UpdateUserProfileData
) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (data.email && data.email !== user.email) {
    const existingUser = await prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });

    if (existingUser) {
      throw new Error("Email already registered");
    }
  }

  try {
    return await prisma.user.update({
      where: {
        id: userId,
      },
      data,
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
};

export const updateUserPassword = async (
  userId: number,
  currentPassword: string,
  newPassword: string
) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const passwordMatches = await bcrypt.compare(
    currentPassword,
    user.password
  );

  if (!passwordMatches) {
    throw new Error("Current password is incorrect");
  }

  const hashedPassword = await bcrypt.hash(
    newPassword,
    12
  );

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: {
        id: userId,
      },
      data: {
        password: hashedPassword,
        authVersion: {
          increment: 1,
        },
      },
    });

    await tx.refreshSession.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  });
};

export const getAllUsers = async () => {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const updateUserStatus = async (
  userId: number,
  isActive: boolean
) => {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const updatedUser = await tx.user.update({
      where: {
        id: userId,
      },
      data: {
        isActive,
        ...(!isActive
          ? {
              authVersion: {
                increment: 1,
              },
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!isActive) {
      await tx.refreshSession.updateMany({
        where: {
          userId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    }

    return updatedUser;
  });
};
