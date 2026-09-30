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


export const getAll = async ( req: Request,res: Response) => {
  try {
    const search =
      typeof req.query.search === "string"
        ? req.query.search
        : undefined;

    const categoryId =
      typeof req.query.categoryId === "string" &&
      Number.isInteger(Number(req.query.categoryId)) &&
      Number(req.query.categoryId) >= 1
        ? Number(req.query.categoryId)
        : undefined;

    const minPrice =
      typeof req.query.minPrice === "string" &&
      !Number.isNaN(Number(req.query.minPrice)) &&
      Number(req.query.minPrice) >= 0
        ? Number(req.query.minPrice)
        : undefined;

    const maxPrice =
      typeof req.query.maxPrice === "string" &&
      !Number.isNaN(Number(req.query.maxPrice)) &&
      Number(req.query.maxPrice) >= 0
        ? Number(req.query.maxPrice)
        : undefined;

    const page =
      typeof req.query.page === "string" &&
      Number.isInteger(Number(req.query.page)) &&
      Number(req.query.page) >= 1
        ? Number(req.query.page)
        : 1;

    const limit =
      typeof req.query.limit === "string" &&
      Number.isInteger(Number(req.query.limit)) &&
      Number(req.query.limit) >= 1 &&
      Number(req.query.limit) <= 50
        ? Number(req.query.limit)
        : 10;

    const result = await getProducts(
      search,
      categoryId,
      limit,
      page,
      minPrice,
      maxPrice
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal server error",
    });
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