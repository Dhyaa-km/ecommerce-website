import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware.js";
import { createOrder, getOrders, getOrderById, updateOrderStatus, getAllOrders } from "./order.service.js";

export const create = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const order = await createOrder(
      req.user!.userId
    );

    return res.status(201).json({
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Cart not found"
    ) {
      return res.status(404).json({
        message: error.message,
      });
    }

    if (
      error instanceof Error &&
      error.message === "Cart is empty"
    ) {
      return res.status(400).json({
        message: error.message,
      });
    }

    if (
      error instanceof Error &&
      (
        error.message.includes("Insufficient stock") ||
        error.message.includes("is no longer available")
      )
    ) {
      return res.status(400).json({
        message: error.message,
      });
    }

    console.error(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const getMyOrders = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const orders = await getOrders(
      req.user!.userId
    );

    return res.status(200).json({
      orders,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const getOne = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const order = await getOrderById(
      req.user!.userId,
      Number(req.params.id)
    );

    return res.status(200).json({
      order,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Order not found"
    ) {
      return res.status(404).json({
        message: error.message,
      });
    }

    console.error(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const updateStatus = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const order = await updateOrderStatus(
      Number(req.params.id),
      req.body.status
    );

    return res.status(200).json({
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Order not found"
    ) {
      return res.status(404).json({
        message: error.message,
      });
    }

    if (
      error instanceof Error &&
      error.message === "Invalid order status transition"
    ) {
      return res.status(409).json({
        message: error.message,
      });
    }

    console.error(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// admin
export const getAll  = async (
  _req: AuthRequest,
  res: Response
) => {
  try {
    const orders = await getAllOrders();

    return res.status(200).json({
      orders,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
