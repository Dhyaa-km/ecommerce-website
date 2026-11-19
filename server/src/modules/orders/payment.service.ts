import { prisma } from "../../lib/prisma.js";
import { MockPaymentProvider } from "./mock-payment.provider.js";
import { env } from "../../config/env.js";


const paymentProvider = new MockPaymentProvider();



export const createCheckoutSession = async (
  orderId: number,
  userId: number
) => {
  return prisma.$transaction(async (tx) => {
    // Lock the order so simultaneous checkout requests
    // cannot create multiple sessions.
    const lockedOrders = await tx.$queryRaw<{ id: number }[]>`
      SELECT "id"
      FROM "Order"
      WHERE "id" = ${orderId}
        AND "userId" = ${userId}
      FOR UPDATE
    `;

    if (!lockedOrders[0]) {
      throw new Error("Order not found or not payable");
    }

    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (
      !order ||
      order.status !== "PENDING" ||
      order.paymentStatus !== "UNPAID" ||
      !order.paymentExpiresAt ||
      order.paymentExpiresAt <= new Date()
    ) {
      throw new Error("Order not found or not payable");
    }

    if (order.paymentSessionId) {
      throw new Error("Checkout session already exists");
    }

    const amount = order.items.reduce(
      (total, item) =>
        total +
        Math.round(Number(item.unitPrice) * 100) * item.quantity,
      0
    );

    if (amount <= 0) {
      throw new Error("Invalid order amount");
    }

    const session = await paymentProvider.createCheckoutSession({
      orderId: order.id,
      amount,
      currency: "usd",
      successUrl: `${env.CLIENT_URL}/checkout/success`,
      cancelUrl: `${env.CLIENT_URL}/checkout/cancel`,
    });

    await tx.order.update({
      where: { id: order.id },
      data: {
        paymentSessionId: session.id,
      },
    });

    return {
      checkoutUrl: session.url,
    };
  });
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
    order.paymentStatus !== "UNPAID" ||
    !order.paymentExpiresAt ||
    order.paymentExpiresAt <= new Date()
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

export const expirePendingOrders = async () => {
  return prisma.$transaction(async (tx) => {
    const expiredOrders = await tx.$queryRaw<{ id: number }[]>`
      SELECT "id"
      FROM "Order"
      WHERE "status" = 'PENDING'
        AND "paymentStatus" = 'UNPAID'
        AND "paymentExpiresAt" <= NOW()
      ORDER BY "id"
      FOR UPDATE SKIP LOCKED
    `;

    let expiredCount = 0;

    for (const { id } of expiredOrders) {
      const order = await tx.order.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!order) continue;

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

      await tx.order.update({
        where: { id },
        data: {
          status: "CANCELLED",
        },
      });

      expiredCount++;
    }

    return expiredCount;
  });
};