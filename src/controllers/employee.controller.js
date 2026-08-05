import bcrypt from "bcrypt";

import User from "../models/user.model.js";
import Leave from "../models/leave.model.js";
import Attendance from "../models/attendance.model.js";

import { sendResponse } from "../utils/response.js";
import { getToday } from "../utils/date.js";
import { uploadImage, deleteImage } from "../utils/cloudinary.js";

// Get profile
export const getProfile = async (req, res) => {
  sendResponse(res, 200, true, "Profile fetched successfully.", req.user);
};

// Update profile
export const updateProfile = async (req, res) => {
  const { fullName, department, designation } = req.body;

  const employee = await User.findById(req.user._id);

  employee.fullName = fullName || employee.fullName;
  employee.department = department || employee.department;
  employee.designation = designation || employee.designation;

  await employee.save();

  sendResponse(res, 200, true, "Profile updated successfully.", employee);
};

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
    .sort({ createdAt: -1 })
    .limit(5);

  const totalAttendance = await Attendance.countDocuments({
    employee: employee._id,
  });

  const approvedLeaves = await Leave.countDocuments({
    employee: employee._id,
    status: "Approved",
  });

  sendResponse(res, 200, true, "Dashboard fetched successfully.", {
    employee: {
      fullName: employee.fullName,
      employeeId: employee.employeeId,
      email: employee.email,
      department: employee.department,
      designation: employee.designation,
      profileImage: employee.profileImage,
    },

    todayAttendance: todayAttendance || {
      checkIn: null,
      checkOut: null,
      workingHours: 0,
      status: "Not Checked In",
    },

    leaveBalance: employee.leaveBalance,

    totalAttendance,

    approvedLeaves,

    recentLeaves,
  });
};

// Change password
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const employee = await User.findById(req.user._id);

  const isMatched = await bcrypt.compare(currentPassword, employee.password);

  if (!isMatched) {
    return sendResponse(res, 400, false, "Current password is incorrect.");
  }

  employee.password = await bcrypt.hash(newPassword, 10);

  await employee.save();

  sendResponse(res, 200, true, "Password changed successfully.");
};

// Update profile image
export const updateProfileImage = async (req, res) => {
  if (!req.file) {
    return sendResponse(res, 400, false, "Please upload an image.");
  }

  const employee = await User.findById(req.user._id);

  if (employee.profileImage?.publicId) {
    await deleteImage(employee.profileImage.publicId);
  }

  const image = await uploadImage(req.file.buffer, "attendance-system/employees");

  employee.profileImage = {
    url: image.url,
    publicId: image.publicId,
  };

  await employee.save();

  sendResponse(res, 200, true, "Profile image updated successfully.", employee);
};
