import { z } from "zod";

export const updateUserProfileSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  email: z.string().email().optional(),
});

export const updateUserPasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100),
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});