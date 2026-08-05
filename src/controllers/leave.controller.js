import Leave from "../models/leave.model.js";
import User from "../models/user.model.js";
import { sendResponse } from "../utils/response.js";
import { calculateDays } from "../utils/date.js";

// Apply leave
export const applyLeave = async (req, res) => {
  const { leaveType, startDate, endDate, reason } = req.body;

  const employee = await User.findById(req.user._id);

  if (!employee) {
    return sendResponse(res, 404, false, "Employee not found.");
  }

  const leaveBalance = Number(employee.leaveBalance || 0);

  if (leaveBalance <= 0) {
    return sendResponse(
      res,
      400,
      false,
      "Your leave balance is exhausted. You cannot apply for leave.",
    );
  }

  const totalDays = calculateDays(startDate, endDate);

  if (!totalDays || totalDays <= 0) {
    return sendResponse(res, 400, false, "Invalid leave duration.");
  }

  if (totalDays > leaveBalance) {
    return sendResponse(
      res,
      400,
      false,
      `You have only ${leaveBalance} ${
        leaveBalance === 1 ? "day" : "days"
      } of leave remaining.`,
    );
  }

  const leave = await Leave.create({
    employee: req.user._id,
    leaveType,
    startDate,
    endDate,
    totalDays,
    reason,
    status: "Pending",
  });

  sendResponse(res, 201, true, "Leave request submitted successfully.", leave);
};

// Get my leaves
export const getMyLeaves = async (req, res) => {
  const leaves = await Leave.find({
    employee: req.user._id,
  }).sort({ createdAt: -1 });

  sendResponse(res, 200, true, "Leave history fetched successfully.", leaves);
};
