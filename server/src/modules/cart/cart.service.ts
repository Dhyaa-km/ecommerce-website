import { prisma } from "../../lib/prisma.js";

interface AddToCartData {
  productId: number;
  quantity: number;
}

export const getCart = async (userId: number) => {
  let cart = await prisma.cart.findUnique({
    where: {
      userId,
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: {
        userId,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  return cart;
};

export const addToCart = async (userId: number, data: AddToCartData) => {
  const product = await prisma.product.findUnique({
    where: {
      id: data.productId,
    },
  });

  if (!product || !product.isActive) {
    throw new Error("Product not found");
  }

  if (data.quantity > product.stock) {
    throw new Error("Insufficient stock");
  }

  const cart = await prisma.cart.upsert({
    where: {
      userId,
    },
    create: {
      userId,
    },
    update: {},
  });

  const existingItem = await prisma.cartItem.findUnique({
    where: {
      cartId_productId: {
        cartId: cart.id,
        productId: data.productId,
      },
    },
  });

  if (existingItem) {
    const newQuantity = existingItem.quantity + data.quantity;

    if (newQuantity > product.stock) {
      throw new Error("Insufficient stock");
    }

    return prisma.cartItem.update({
      where: {
        id: existingItem.id,
      },
      data: {
        quantity: newQuantity,
      },
      include: {
        product: true,
      },
    });
  }

  return prisma.cartItem.create({
    data: {
      cartId: cart.id,
      productId: data.productId,
      quantity: data.quantity,
    },
    include: {
      product: true,
    },
  });
};

export const updateCartItem = async (
  userId: number,
  itemId: number,
  quantity: number
) => {
  const cart = await prisma.cart.findUnique({
    where: {
      userId,
    },
  });

  if (!cart) {
    throw new Error("Cart not found");
  }

  const cartItem = await prisma.cartItem.findFirst({
    where: {
      id: itemId,
      cartId: cart.id,
    },
    include: {
      product: true,
    },
  });

  if (!cartItem) {
    throw new Error("Cart item not found");
  }

  if (!cartItem.product.isActive) {
    throw new Error("Product not found");
  }

  if (quantity > cartItem.product.stock) {
    throw new Error("Insufficient stock");
  }

  return prisma.cartItem.update({
    where: {
      id: cartItem.id,
    },
    data: {
      quantity,
    },
    include: {
      product: true,
    },
  });
};

export const removeCartItem = async (
  userId: number,
  itemId: number
) => {
  const cart = await prisma.cart.findUnique({
    where: {
      userId,
    },
  });

  if (!cart) {
    throw new Error("Cart not found");
  }

  const cartItem = await prisma.cartItem.findFirst({
    where: {
      id: itemId,
      cartId: cart.id,
    },
  });

  if (!cartItem) {
    throw new Error("Cart item not found");
  }

  return prisma.cartItem.delete({
    where: {
      id: cartItem.id,
    },
  });
};