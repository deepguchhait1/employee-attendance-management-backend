import Attendance from "../models/attendance.model.js";
import Leave from "../models/leave.model.js";

import { sendResponse } from "../utils/response.js";
import { getToday } from "../utils/date.js";

// Get employee dashboard
export const getEmployeeDashboard = async (req, res) => {
  const today = getToday();

  const employee = req.user;

  const todayAttendance = await Attendance.findOne({
    employee: employee._id,
    date: today,
  });

  const recentLeaves = await Leave.find({
    employee: employee._id,
  })
    .sort({
      createdAt: -1,
    })
    .limit(5);

  sendResponse(res, 200, true, "Dashboard fetched successfully.", {
    employee: {
      fullName: employee.fullName,
      employeeId: employee.employeeId,
      department: employee.department,
      designation: employee.designation,
      profileImage: employee.profileImage,
    },

    todayAttendance,

    leaveBalance: employee.leaveBalance,

    recentLeaves,
  });
};
