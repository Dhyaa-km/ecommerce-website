import { Request , Response } from "express";
import { createProduct, deleteProduct, getProducts, getProductById, updateProduct } from "./product.service.js";

export const create = async (req: Request, res: Response) => {
    try {
        const product = await createProduct(req.body);
        return res.status(201).json({
            message: "Product created successfully",
            product,
        });
    } catch (error) {
        if(error instanceof Error && error.message === "Category not found"){
            return res.status(400).json({ message: error.message });
        }
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};


export const getAll = async (req: Request, res: Response) => {
    try {
        const products = await getProducts();
        return res.status(200).json({
            products,
        });
    } catch (error) {
        if(error instanceof Error && error.message === "Category not found"){
            return res.status(400).json({ message: error.message });
        }
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getOne = async (req: Request, res: Response) => {
  try {
    const product = await getProductById(Number(req.params.id));

    return res.status(200).json({
      product,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Product not found") {
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

export const update = async (req: Request, res: Response) => {
  try {
    const product = await updateProduct(Number(req.params.id), req.body);

    return res.status(200).json({
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Product not found") {
      return res.status(404).json({
        message: error.message,
      });
    }

    if (error instanceof Error && error.message === "Category not found") {
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

export const remove = async (req: Request, res: Response) => {
  try {
    const product = await deleteProduct(Number(req.params.id));

    return res.status(200).json({
      message: "Product deleted successfully",
      product,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Product not found") {
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