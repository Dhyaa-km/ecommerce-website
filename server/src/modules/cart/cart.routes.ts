import { Router } from "express";
import { get , add , update , remove} from "./cart.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.js";
import { addToCartSchema, updateCartItemSchema } from "./cart.validator.js";
import { validatePositiveIntParam } from "../../middleware/validate-param.middleware.js";

const router = Router();

router.get("/", authenticate, get);
router.post(
  "/items",
  authenticate,
  validate(addToCartSchema),
  add
);
router.put(
  "/items/:itemId",
  authenticate,
  validatePositiveIntParam("itemId"),
  validate(updateCartItemSchema),
  update
);
router.delete(
  "/items/:itemId",
  authenticate,
  validatePositiveIntParam("itemId"),
  remove
);

export default router;
