import { Router } from "express";

import authRoutes from "./auth.routes.js";
import employeeRoutes from "./employee.routes.js";
import attendanceRoutes from "./attendance.routes.js";
import leaveRoutes from "./leave.routes.js";
import hrRoutes from "./hr.routes.js";
import dashboardRoutes from "./dashboard.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/employee", employeeRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/leave", leaveRoutes);
router.use("/hr", hrRoutes);
router.use("/dashboard", dashboardRoutes);

export default router;
