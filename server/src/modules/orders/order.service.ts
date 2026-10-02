import { prisma } from "../../lib/prisma.js";

type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

const validTransitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export const createOrder = async (userId: number) => {
  return prisma.$transaction(async (tx) => {
    const lockedCarts = await tx.$queryRaw<{ id: number }[]>`
      SELECT "id"
      FROM "Cart"
      WHERE "userId" = ${userId}
      FOR UPDATE
    `;

    const lockedCart = lockedCarts[0];

    if (!lockedCart) {
      throw new Error("Cart not found");
    }

    const cart = await tx.cart.findUnique({
      where: {
        id: lockedCart.id,
      },
      include: {
        items: {
          include: {
            product: true,
          },
          orderBy: {
            productId: "asc",
          },
        },
      },
    });

    if (!cart) {
      throw new Error("Cart not found");
    }

    if (cart.items.length === 0) {
      throw new Error("Cart is empty");
    }

    for (const item of cart.items) {
      const reservation = await tx.product.updateMany({
        where: {
          id: item.productId,
          isActive: true,
          stock: {
            gte: item.quantity,
          },
        },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });

      if (reservation.count !== 1) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { isActive: true, name: true },
        });

        if (!product || !product.isActive) {
          throw new Error(
            `Product "${item.product.name}" is no longer available`
          );
        }

        throw new Error(
          `Insufficient stock for "${product.name}"`
        );
      }
    }

    const order = await tx.order.create({
      data: {
        userId,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.product.price,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    await tx.cartItem.deleteMany({
      where: {
        cartId: cart.id,
      },
    });

    return order;
  });
};

export const getOrders = async (userId: number) => {
  return prisma.order.findMany({
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
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getOrderById = async (
  userId: number,
  orderId: number
) => {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
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

  if (!order) {
    throw new Error("Order not found");
  }

  return order;
};

export const updateOrderStatus = async (
  orderId: number,
  status: string
) => {
  return prisma.$transaction(async (tx) => {
    // Serialize status changes so concurrent cancellation requests cannot
    // both restore the same order's stock.
    const lockedOrders = await tx.$queryRaw<{ id: number }[]>`
      SELECT "id"
      FROM "Order"
      WHERE "id" = ${orderId}
      FOR UPDATE
    `;

    if (!lockedOrders[0]) {
      throw new Error("Order not found");
    }

    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    const nextStatus = status as OrderStatus;
    const currentStatus = order.status as OrderStatus;

    // Cancellation is idempotent: it returns the existing cancelled order
    // without restoring stock a second time.
    if (currentStatus === "CANCELLED" && nextStatus === "CANCELLED") {
      return tx.order.findUniqueOrThrow({
        where: { id: order.id },
      });
    }

    if (!validTransitions[currentStatus].includes(nextStatus)) {
      throw new Error("Invalid order status transition");
    }

    if (nextStatus === "CANCELLED") {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      }
    }

    return tx.order.update({
      where: { id: order.id },
      data: { status: nextStatus },
    });
  });
};

// admin
export const getAllOrders = async () => {
  return prisma.order.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      items: {
        include: {
          product: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};
