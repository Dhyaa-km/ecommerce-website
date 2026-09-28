import { Router } from "express";
import { create, getAll } from "./category.controller.js";
import { validate } from "../../middleware/validate.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import { createCategorySchema } from "./category.validator.js";

const router = Router();

router.get("/", getAll);
router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  validate(createCategorySchema),
  create
);

export default router;