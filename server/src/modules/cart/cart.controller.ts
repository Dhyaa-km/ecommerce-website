import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware.js";
import { getCart, addToCart, updateCartItem, removeCartItem } from "./cart.service.js";

export const get = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const cart = await getCart(req.user!.userId);

    return res.status(200).json({
      cart,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const add = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const item = await addToCart(
      req.user!.userId,
      req.body
    );

    return res.status(201).json({
      message: "Product added to cart successfully",
      item,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Product not found"
    ) {
      return res.status(404).json({
        message: error.message,
      });
    }

    if (
      error instanceof Error &&
      error.message === "Insufficient stock"
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

export const update = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const item = await updateCartItem(
      req.user!.userId,
      Number(req.params.itemId),
      req.body.quantity
    );

    return res.status(200).json({
      message: "Cart item updated successfully",
      item,
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
      error.message === "Cart item not found"
    ) {
      return res.status(404).json({
        message: error.message,
      });
    }

    if (
      error instanceof Error &&
      error.message === "Product not found"
    ) {
      return res.status(404).json({
        message: error.message,
      });
    }

    if (
      error instanceof Error &&
      error.message === "Insufficient stock"
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

export const remove = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    await removeCartItem(
      req.user!.userId,
      Number(req.params.itemId)
    );

    return res.status(200).json({
      message: "Cart item removed successfully",
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
      error.message === "Cart item not found"
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