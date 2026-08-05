import { Router } from "express";

import {
  getProfile,
  updateProfile,
  updateProfileImage,
  changePassword,
  getEmployeeDashboard,
} from "../controllers/employee.controller.js";

import { authenticate } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/upload.middleware.js";

const router = Router();

router.get("/profile", authenticate, getProfile);

router.put("/profile", authenticate, updateProfile);

router.get("/dashboard", authenticate, getEmployeeDashboard);

router.put(
  "/profile/image",
  authenticate,
  upload.single("image"),
  updateProfileImage,
);

router.put("/change-password", authenticate, changePassword);

export default router;
