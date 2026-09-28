import { prisma } from "../../lib/prisma.js";

export const createCategory = async (name: string) => {
  const existingCategory = await prisma.category.findUnique({
    where: { name },
  });

  if (existingCategory) {
    throw new Error("Category already exists");
  }

  const category = await prisma.category.create({
    data: {
      name,
    },
  });

  return category;
};

export const getCategories = async () => {
  return prisma.category.findMany({
    orderBy: {
      name: "asc",
    },
  });
};