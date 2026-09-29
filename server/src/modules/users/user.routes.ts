import { Router } from "express";
import { getMe , updateMe, updatePassword, getAll, updateStatus} from "./user.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.js";
import { updateUserProfileSchema, updateUserPasswordSchema, updateUserStatusSchema} from "./user.validator.js";
import { authorize } from "../../middleware/role.middleware.js";


const router = Router();

router.get(
  "/",
  authenticate,
  authorize("ADMIN"),
  getAll
);

router.get(
  "/me",
  authenticate,
  getMe
);

router.put(
  "/me",
  authenticate,
  validate(updateUserProfileSchema),
  updateMe
);

router.put(
  "/me/password",
  authenticate,
  validate(updateUserPasswordSchema),
  updatePassword
);

router.patch(
  "/:id/status",
  authenticate,
  authorize("ADMIN"),
  validate(updateUserStatusSchema),
  updateStatus
);
 
export default router;