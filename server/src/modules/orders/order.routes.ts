import { Router } from "express";
import {
  create,
  getAll,
  getOne,
  updateStatus,
} from "./order.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import { validate } from "../../middleware/validate.js";
import { updateOrderStatusSchema } from "./order.validator.js";

const router = Router();

router.post("/", authenticate, create);

router.get("/", authenticate, getAll);

router.get("/:id", authenticate, getOne);

router.patch(
  "/:id/status",
  authenticate,
  authorize("ADMIN"),
  validate(updateOrderStatusSchema),
  updateStatus
);

export default router;