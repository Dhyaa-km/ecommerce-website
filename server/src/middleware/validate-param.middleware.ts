import { NextFunction, Request, Response } from "express";

export const validatePositiveIntParam = (paramName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const value = req.params[paramName];
    const id = typeof value === "string" ? Number(value) : NaN;

    if (
      typeof value !== "string" ||
      !/^\d+$/.test(value) ||
      !Number.isSafeInteger(id) ||
      id < 1
    ) {
      return res.status(400).json({
        message: `Invalid ${paramName} parameter`,
      });
    }

    next();
  };
};
