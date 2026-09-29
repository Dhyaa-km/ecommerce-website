import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware.js";
import { getUserProfile , updateUserProfile, updateUserPassword, getAllUsers, updateUserStatus} from "./user.service.js";

export const getMe = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const user = await getUserProfile(
      req.user!.userId
    );

    return res.status(200).json({
      user,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "User not found"
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

export const updateMe = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const user = await updateUserProfile(
      req.user!.userId,
      req.body
    );

    return res.status(200).json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "User not found"
    ) {
      return res.status(404).json({
        message: error.message,
      });
    }

    if (
      error instanceof Error &&
      error.message === "Email already registered"
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

export const updatePassword = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    await updateUserPassword(
      req.user!.userId,
      req.body.currentPassword,
      req.body.newPassword
    );

    return res.status(200).json({
      message: "Password updated successfully",
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "User not found"
    ) {
      return res.status(404).json({
        message: error.message,
      });
    }

    if (
      error instanceof Error &&
      error.message === "Current password is incorrect"
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

export const getAll = async (req: AuthRequest, res: Response) => {
  try {
    const users = await getAllUsers();
    return res.status(200).json({
      users,
    });
  } catch (error) {
    if(error instanceof Error && error.message === "User not found")
      return res.status(404).json({ message: error.message });  
    console.error(error);
    return res.status(500).json({ message: "Internal server error" }); 
  }
};

export const updateStatus = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const user = await updateUserStatus(
      Number(req.params.id),
      req.body.isActive
    );

    return res.status(200).json({
      message: "User status updated successfully",
      user,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "User not found"
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