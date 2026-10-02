import { Router } from "express";
import { create, getAll, getOne, update, remove } from "./product.controller.js";
import { validate } from "../../middleware/validate.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import { createProductSchema, updateProductSchema } from "./product.validator.js";
import { validatePositiveIntParam } from "../../middleware/validate-param.middleware.js";

const router = Router();

router.get("/", getAll);
router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  validate(createProductSchema),
  create
);

router.get("/:id", validatePositiveIntParam("id"), getOne);

router.put(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validatePositiveIntParam("id"),
  validate(updateProductSchema),
  update
);

router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validatePositiveIntParam("id"),
  remove
);

export default router;
