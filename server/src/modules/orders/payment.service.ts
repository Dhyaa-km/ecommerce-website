import { prisma } from "../../lib/prisma.js";
import { MockPaymentProvider } from "./mock-payment.provider.js";


const paymentProvider = new MockPaymentProvider();

export const createCheckoutSession = async (
  orderId: number,
  userId: number
) => {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
      status: "PENDING",
      paymentStatus: "UNPAID",
    },
    include: {
      items: true,
    },
  });

  if (!order) {
    throw new Error("Order not found or not payable");
  }

  const amount = order.items.reduce(
    (total, item) =>
      total + Math.round(Number(item.unitPrice) * 100) * item.quantity,
    0
  );

  if (amount <= 0) {
    throw new Error("Invalid order amount");
  }

  const session = await paymentProvider.createCheckoutSession({
    orderId: order.id,
    amount,
    currency: "usd",
    successUrl: `${process.env.CLIENT_URL}/checkout/success`,
    cancelUrl: `${process.env.CLIENT_URL}/checkout/cancel`,
  });

  await prisma.order.update({
    where: {
      id: order.id,
    },
    data: {
      paymentSessionId: session.id,
    },
  });

  return {
    checkoutUrl: session.url,
  };
};

export const completeMockPayment = async (
  sessionId: string,
  userId: number
) => {
  return prisma.$transaction(async (tx) => {
    const lockedOrders = await tx.$queryRaw<{ id: number }[]>`
      SELECT "id"
      FROM "Order"
      WHERE "paymentSessionId" = ${sessionId}
        AND "userId" = ${userId}
      FOR UPDATE
    `;

    if (!lockedOrders[0]) {
      throw new Error("Payment session not found");
    }

    const order = await tx.order.findUniqueOrThrow({
      where: { id: lockedOrders[0].id },
    });

    // Make repeated confirmation requests safe.
    if (order.paymentStatus === "PAID") {
      return order;
    }

    if (
      order.status !== "PENDING" ||
      order.paymentStatus !== "UNPAID"
    ) {
      throw new Error("Order is not payable");
    }

    return tx.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "PAID",
        status: "CONFIRMED",
      },
    });
  });
};

export const cancelMockPayment = async (
  sessionId: string,
  userId: number
) => {
  return prisma.$transaction(async (tx) => {
    const lockedOrders = await tx.$queryRaw<{ id: number }[]>`
      SELECT "id"
      FROM "Order"
      WHERE "paymentSessionId" = ${sessionId}
        AND "userId" = ${userId}
      FOR UPDATE
    `;

    if (!lockedOrders[0]) {
      throw new Error("Payment session not found");
    }

    const order = await tx.order.findUniqueOrThrow({
      where: { id: lockedOrders[0].id },
      include: {
        items: true,
      },
    });

    // Repeated cancellation requests are safe.
    if (order.status === "CANCELLED") {
      return order;
    }

    if (
      order.status !== "PENDING" ||
      order.paymentStatus !== "UNPAID"
    ) {
      throw new Error("Order is not cancellable");
    }

    // Restore reserved stock.
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

    return tx.order.update({
      where: { id: order.id },
      data: {
        status: "CANCELLED",
      },
    });
  });
};