import { Router } from "express";

import {
  checkIn,
  checkOut,
  getTodayAttendance,
  getAttendanceHistory,
} from "../controllers/attendance.controller.js";

import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.post("/check-in", checkIn);

router.put("/check-out", checkOut);

router.get("/today", getTodayAttendance);

router.get("/history", getAttendanceHistory);

export default router;
