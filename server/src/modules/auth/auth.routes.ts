import { Router } from "express";
import {login, register, refresh, logout, getMe } from "./auth.controller.js";
import { validate } from "../../middleware/validate.js";
import { loginSchema, registerSchema } from "./auth.validator.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import { authRateLimiter } from "../../middleware/auth-rate-limit.middleware.js";

const router = Router();

router.post("/register", authRateLimiter, validate(registerSchema), register);
router.post("/login", authRateLimiter, validate(loginSchema), login);
router.get("/refresh", refresh);
router.get("/logout", logout);
router.get("/me", authenticate, getMe);


router.get(
  "/admin-test",
  authenticate,
  authorize("ADMIN"),
  (_req, res) => {
    res.json({
      message: "You have admin access",
    });
  }
);

export default router;