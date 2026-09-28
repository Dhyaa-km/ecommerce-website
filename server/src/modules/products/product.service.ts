import { prisma } from "../../lib/prisma.js";

interface CreateProductData {
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl?: string;
  categoryId: number;
}
interface UpdateProductData {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  imageUrl?: string;
  categoryId?: number;
  isActive?: boolean;
}


export const createProduct = async (data: CreateProductData) => {
  const category = await prisma.category.findUnique({
    where: {
      id: data.categoryId,
    },
  });

  if (!category) {
    throw new Error("Category not found");
  }

  const product = await prisma.product.create({
    data: {
      name: data.name,
      description: data.description,
      price: data.price,
      stock: data.stock,
      imageUrl: data.imageUrl,
      categoryId: data.categoryId,
    },
  });

  return product;
};

export const getProducts = async () => {
  const products = await prisma.product.findMany(
    {
      where: {
      isActive: true,
    },
      include: {
      category: true,
    },
      orderBy: {
      createdAt: "desc",
    },
  });

  return products;
};

export const getProductById = async (id: number) => {
  const product = await prisma.product.findFirst({
    where: {
      id,
      isActive: true,
    },
    include: {
      category: true,
    },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  return product;
};

export const updateProduct = async ( id: number, data: UpdateProductData) => {
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  if (data.categoryId !== undefined) {
    const category = await prisma.category.findUnique({
      where: {
        id: data.categoryId,
      },
    });

    if (!category) {
      throw new Error("Category not found");
    }
  }

  return prisma.product.update({
    where: { id },
    data,
  });
};

export const deleteProduct = async (id: number) => {
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  return prisma.product.update({
    where: { id },
    data: {
      isActive: false,
    },
  });
};