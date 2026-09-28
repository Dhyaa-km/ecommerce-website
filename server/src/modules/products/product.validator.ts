import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().min(1).max(1000),
  price: z.number().positive(),
  stock: z.number().int().nonnegative(),
  imageUrl: z.string().url().optional(),
  categoryId: z.number().int().positive(),
});

export const updateProductSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().min(1).max(1000).optional(),
  price: z.number().positive().optional(),
  stock: z.number().int().nonnegative().optional(),
  imageUrl: z.string().url().optional(),
  categoryId: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});