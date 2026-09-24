import { Router } from "express";
import {login, register, refresh, logout } from "./auth.controller.js";
import { validate } from "../../middleware/validate.js";
import { loginSchema, registerSchema } from "./auth.validator.js";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.get("/refresh", refresh);
router.get("/logout", logout);

export default router;