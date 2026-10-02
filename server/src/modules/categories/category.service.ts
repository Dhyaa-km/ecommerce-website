import { prisma } from "../../lib/prisma.js";
import { Prisma } from "../../generated/client.js";

export const createCategory = async (name: string) => {
  const existingCategory = await prisma.category.findUnique({
    where: { name },
  });

  if (existingCategory) {
    throw new Error("Category already exists");
  }

  let category;

  try {
    category = await prisma.category.create({
      data: {
        name,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("Category already exists");
    }

    throw error;
  }

  return category;
};

export const getCategories = async () => {
  return prisma.category.findMany({
    orderBy: {
      name: "asc",
    },
  });
};
