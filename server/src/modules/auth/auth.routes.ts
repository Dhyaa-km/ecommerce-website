import { Router } from "express";
import {login, register, refresh, logout, getMe } from "./auth.controller.js";
import { validate } from "../../middleware/validate.js";
import { loginSchema, registerSchema } from "./auth.validator.js";
import { authenticate } from "../../middleware/auth.middleware.js";


const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.get("/refresh", refresh);
router.get("/logout", logout);
router.get("/me", authenticate, getMe);

export default router;