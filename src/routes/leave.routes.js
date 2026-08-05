import { Router } from "express";

import {
  applyLeave,
  getMyLeaves,
} from "../controllers/leave.controller.js";

import { authenticate } from "../middlewares/auth.middleware.js";

import {
  leaveValidation,
  validateLeave,
} from "../validators/leave.validator.js";

const router = Router();

router.post(
  "/apply",
  authenticate,
  leaveValidation,
  validateLeave,
  applyLeave
);

router.get(
  "/history",
  authenticate,
  getMyLeaves
);

export default router;