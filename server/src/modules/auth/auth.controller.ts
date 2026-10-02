import { Request, Response } from "express";
import {
  loginUser,
  registerUser,
  refreshAccessToken,
  revokeRefreshSession,
} from "./auth.service.js";
import { prisma } from "../../lib/prisma.js";
import { AuthRequest } from "../../middleware/auth.middleware.js";
import { env, refreshTokenLifetimeMs } from "../../config/env.js";

const refreshCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: refreshTokenLifetimeMs,
};

const clearRefreshCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    const user = await registerUser(name, email, password);

    return res.status(201).json({
      message: "User registered successfully",
      user,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Email already registered") {
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

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const result = await loginUser(email, password);

    res.cookie("refreshToken", result.refreshToken, refreshCookieOptions);

    return res.status(200).json({
      user: result.user,
      accessToken: result.accessToken,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Invalid email or password"
    ) {
      return res.status(401).json({
        message: error.message,
      });
    }
    if (
      error instanceof Error &&
      error.message === "Account is deactivated"
    ) {
      return res.status(403).json({
        message: error.message,
      });
    }

    console.error(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const refresh = async (req: Request, res: Response) => {
  res.set("Cache-Control", "no-store");

  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        message: "Refresh token required",
      });
    }

    const result = await refreshAccessToken(refreshToken);

    res.cookie("refreshToken", result.refreshToken, refreshCookieOptions);

    return res.status(200).json({
      user: result.user,
      accessToken: result.accessToken,
    });
  } catch (error) {
    res.clearCookie("refreshToken", clearRefreshCookieOptions);

    return res.status(401).json({
      message:
        error instanceof Error
          ? error.message
          : "Invalid refresh token",
    });
  }
};

export const logout = async (req: Request, res: Response) => {
  res.set("Cache-Control", "no-store");

  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      await revokeRefreshSession(refreshToken);
    }

    res.clearCookie("refreshToken", clearRefreshCookieOptions);

    return res.status(200).json({
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error(error);
    res.clearCookie("refreshToken", clearRefreshCookieOptions);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      user,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
