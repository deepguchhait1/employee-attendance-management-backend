import express, { Router } from "express";

import { authenticate } from "../middlewares/auth.middleware.js";

import { authorize } from "../middlewares/role.middleware.js";

import {
  getAllEmployees,
  getDashboardStats,
  getEmployee,
  getLeaveHistory,
} from "../controllers/hr.controller.js";
import { getAttendanceChart } from "../controllers/hr.controller.js";
import { approveLeave, rejectLeave } from "../controllers/hr.controller.js";
const router = express.Router();

router.use(authenticate, authorize("HR"));

router.get("/dashboard", getDashboardStats);

router.get("/dashboard/chart", getAttendanceChart);
router.get("/leaves", getLeaveHistory);

router.put("/leave/:leaveId/approve", approveLeave);

router.put("/leave/:leaveId/reject", rejectLeave);
router.get("/employees/:employeeId", getEmployee);
router.get("/employees", getAllEmployees);

export default router;
