import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    role: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Access token required",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      env.JWT_ACCESS_SECRET
    ) as {
      userId: number;
      role: string;
      authVersion: number;
    };

    if (
      !Number.isInteger(decoded.userId) ||
      !Number.isInteger(decoded.authVersion)
    ) {
      throw new Error("Invalid access token");
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        isActive: true,
        role: true,
        authVersion: true,
      },
    });

    if (
      !user ||
      !user.isActive ||
      user.authVersion !== decoded.authVersion
    ) {
      throw new Error("Invalid access token");
    }

    req.user = {
      userId: decoded.userId,
      role: user.role,
    };

    next();
  } catch {
    return res.status(401).json({
      message: "Invalid or expired access token",
    });
  }
};
