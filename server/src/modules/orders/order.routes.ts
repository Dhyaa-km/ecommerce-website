import { Router } from "express";

import {
  create,
  getMyOrders,
  getOne,
  updateStatus,
  getAll,
} from "./order.controller.js";

import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import { validate } from "../../middleware/validate.js";
import { validatePositiveIntParam } from "../../middleware/validate-param.middleware.js";

import { updateOrderStatusSchema } from "./order.validator.js";

const router = Router();

// Create an order
router.post(
  "/",
  authenticate,
  create
);

// Admin: get all orders
router.get(
  "/",
  authenticate,
  authorize("ADMIN"),
  getAll
);

// User: get own orders
router.get(
  "/my",
  authenticate,
  getMyOrders
);

// Get one own order
router.get(
  "/:id",
  authenticate,
  validatePositiveIntParam("id"),
  getOne
);

// Admin: update order status
router.patch(
  "/:id/status",
  authenticate,
  authorize("ADMIN"),
  validatePositiveIntParam("id"),
  validate(updateOrderStatusSchema),
  updateStatus
);

export default router;
