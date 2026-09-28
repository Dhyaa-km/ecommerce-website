import { Request, Response } from "express";
import { createCategory, getCategories } from "./category.service.js";

export const create = async (req: Request, res: Response) => {
  try {
    const category = await createCategory(req.body.name);

    return res.status(201).json({
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Category already exists"
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

export const getAll = async (_req: Request, res: Response) => {
  try {
    const categories = await getCategories();

    return res.status(200).json({
      categories,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};