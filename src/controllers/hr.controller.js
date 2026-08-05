import User from "../models/user.model.js";
import Attendance from "../models/attendance.model.js";
import Leave from "../models/leave.model.js";
import { sendResponse } from "../utils/response.js";
import { getToday } from "../utils/date.js";

// Get dashboard stats
export const getDashboardStats = async (req, res) => {
  const today = getToday();

  const totalEmployees = await User.countDocuments({
    role: "EMPLOYEE",
  });

  const attendedEmployees = await Attendance.distinct("employee", {
    date: today,
    status: {
      $in: ["Present", "Late", "Half Day"],
    },
  });

  const halfDayEmployees = await Attendance.distinct("employee", {
    date: today,
    status: "Half Day",
  });

  const leaveEmployees = await Leave.distinct("employee", {
    status: "Approved",
    startDate: {
      $lte: today,
    },
    endDate: {
      $gte: today,
    },
  });

  const attendedSet = new Set(attendedEmployees.map((id) => id.toString()));
  const halfDaySet = new Set(halfDayEmployees.map((id) => id.toString()));
  const leaveSet = new Set(leaveEmployees.map((id) => id.toString()));

  const presentToday = attendedSet.size;
  const halfDayToday = halfDaySet.size;
  const onLeaveToday = leaveSet.size;
  const absentToday = Math.max(totalEmployees - presentToday, 0);

  const lateEmployees = await Attendance.distinct("employee", {
    date: today,
    status: "Late",
  });

  const lateToday = new Set(lateEmployees.map((id) => id.toString())).size;

  const pendingLeaves = await Leave.countDocuments({
    status: "Pending",
  });

  sendResponse(res, 200, true, "Dashboard data fetched successfully.", {
    totalEmployees,
    presentToday,
    absentToday,
    halfDayToday,
    onLeaveToday,
    lateToday,
    pendingLeaves,
  });
};

// Get leave history
export const getLeaveHistory = async (req, res) => {
  const { page = 1, limit = 10, status = "All", search = "" } = req.query;

  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  const skip = (pageNumber - 1) * limitNumber;
  const query = {};

  if (status !== "All") {
    const allowedStatuses = ["Pending", "Approved", "Rejected"];

    if (!allowedStatuses.includes(status)) {
      return sendResponse(res, 400, false, "Invalid leave status.");
    }

    query.status = status;
  }

  let leaves = await Leave.find(query)
    .populate(
      "employee",
      "fullName email profileImage employeeId department designation",
    )
    .populate("reviewedBy", "fullName employeeId")
    .sort({
      createdAt: -1,
    });

  if (search) {
    const searchText = search.toLowerCase();

    leaves = leaves.filter((leave) => {
      const employee = leave.employee;

      if (!employee) {
        return false;
      }

      return (
        employee.fullName?.toLowerCase().includes(searchText) ||
        employee.email?.toLowerCase().includes(searchText) ||
        employee.employeeId?.toLowerCase().includes(searchText) ||
        employee.department?.toLowerCase().includes(searchText)
      );
    });
  }

  const totalLeaves = leaves.length;
  const pendingLeaves = leaves.filter((leave) => leave.status === "Pending").length;
  const approvedLeaves = leaves.filter((leave) => leave.status === "Approved").length;
  const rejectedLeaves = leaves.filter((leave) => leave.status === "Rejected").length;
  const paginatedLeaves = leaves.slice(skip, skip + limitNumber);
  const totalPages = Math.ceil(totalLeaves / limitNumber);

  sendResponse(res, 200, true, "Leave history fetched successfully.", {
    leaves: paginatedLeaves,
    statistics: {
      totalLeaves,
      pendingLeaves,
      approvedLeaves,
      rejectedLeaves,
    },
    pagination: {
      currentPage: pageNumber,
      totalPages,
      totalRecords: totalLeaves,
      limit: limitNumber,
    },
  });
};

// Approve leave
export const approveLeave = async (req, res) => {
  const { leaveId } = req.params;

  const leave = await Leave.findById(leaveId);

  if (!leave) {
    return sendResponse(res, 404, false, "Leave request not found.");
  }

  if (leave.status !== "Pending") {
    return sendResponse(res, 400, false, "Leave already reviewed.");
  }

  const employee = await User.findById(leave.employee);

  if (employee.leaveBalance < leave.totalDays) {
    return sendResponse(res, 400, false, "Insufficient leave balance.");
  }

  employee.leaveBalance -= leave.totalDays;

  await employee.save();

  leave.status = "Approved";
  leave.reviewedBy = req.user._id;
  leave.approvedAt = new Date();

  await leave.save();

  sendResponse(res, 200, true, "Leave approved successfully.", leave);
};

// Reject leave
export const rejectLeave = async (req, res) => {
  const { leaveId } = req.params;
  const { reviewNote } = req.body;

  const leave = await Leave.findById(leaveId);

  if (!leave) {
    return sendResponse(res, 404, false, "Leave request not found.");
  }

  if (leave.status !== "Pending") {
    return sendResponse(res, 400, false, "Leave already reviewed.");
  }

  leave.status = "Rejected";
  leave.reviewedBy = req.user._id;
  leave.reviewNote = reviewNote || "";

  await leave.save();

  sendResponse(res, 200, true, "Leave rejected successfully.", leave);
};

// Get attendance chart
export const getAttendanceChart = async (req, res) => {
  const currentDate = new Date();

  const year = Number(req.query.year) || currentDate.getFullYear();
  const month = Number(req.query.month) || currentDate.getMonth() + 1;

  if (month < 1 || month > 12) {
    return sendResponse(res, 400, false, "Month must be between 1 and 12.");
  }

  const monthString = `${year}-${String(month).padStart(2, "0")}`;

  const totalEmployees = await User.countDocuments({
    role: "EMPLOYEE",
  });

  const attendanceData = await Attendance.aggregate([
    {
      $match: {
        date: {
          $regex: `^${monthString}`,
        },
      },
    },
    {
      $group: {
        _id: {
          date: "$date",
          status: "$status",
        },
        count: {
          $sum: 1,
        },
      },
    },
    {
      $sort: {
        "_id.date": 1,
      },
    },
  ]);

  const totalDays = new Date(year, month, 0).getDate();
  const chartData = [];

  for (let day = 1; day <= totalDays; day++) {
    const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    chartData.push({
      date,
      day,
      present: 0,
      late: 0,
      halfDay: 0,
      absent: 0,
    });
  }

  attendanceData.forEach((item) => {
    const date = item._id.date;
    const status = item._id.status;
    const count = item.count;

    const dayIndex = Number(date.split("-")[2]) - 1;

    if (status === "Present") {
      chartData[dayIndex].present += count;
    }

    if (status === "Late") {
      chartData[dayIndex].present += count;
      chartData[dayIndex].late += count;
    }

    if (status === "Half Day") {
      chartData[dayIndex].halfDay += count;
    }
  });

  chartData.forEach((day) => {
    day.absent = totalEmployees - day.present - day.halfDay;

    if (day.absent < 0) {
      day.absent = 0;
    }
  });

  const monthName = new Date(year, month - 1, 1).toLocaleString("en-US", {
    month: "long",
  });

  sendResponse(res, 200, true, "Attendance chart fetched successfully.", {
    month: monthName,
    year,
    totalEmployees,
    chart: chartData,
  });
};

// Get all employees
export const getAllEmployees = async (req, res) => {
  const { page = 1, limit = 10, search = "" } = req.query;

  const skip = (Number(page) - 1) * Number(limit);
  const today = getToday();

  const searchQuery = {
    role: "EMPLOYEE",
  };

  if (search) {
    searchQuery.$or = [
      {
        fullName: {
          $regex: search,
          $options: "i",
        },
      },
      {
        email: {
          $regex: search,
          $options: "i",
        },
      },
      {
        employeeId: {
          $regex: search,
          $options: "i",
        },
      },
      {
        department: {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }

  const employees = await User.find(searchQuery)
    .select("-password")
    .skip(skip)
    .limit(Number(limit))
    .sort({
      createdAt: -1,
    });

  const totalEmployees = await User.countDocuments(searchQuery);
  const totalPages = Math.ceil(totalEmployees / Number(limit));

  const employeeIds = employees.map((employee) => employee._id);

  const todayAttendance = await Attendance.find({
    employee: { $in: employeeIds },
    date: today,
  }).select("employee status");

  const attendanceStatusMap = new Map();

  todayAttendance.forEach((attendance) => {
    attendanceStatusMap.set(attendance.employee.toString(), attendance.status);
  });

  const employeeData = employees.map((employee) => ({
    _id: employee._id,
    fullName: employee.fullName,
    employeeId: employee.employeeId,
    email: employee.email,
    department: employee.department,
    designation: employee.designation,
    profileImage: employee.profileImage,
    leaveBalance: employee.leaveBalance,
    createdAt: employee.createdAt,
    status: attendanceStatusMap.get(employee._id.toString()) || "Absent",
  }));

  sendResponse(res, 200, true, "Employees fetched successfully.", {
    employees: employeeData,
    pagination: {
      currentPage: Number(page),
      totalPages,
      totalEmployees,
      limit: Number(limit),
    },
  });
};

// Get employee
export const getEmployee = async (req, res) => {
  const { employeeId } = req.params;

  const employee = await User.findOne({
    _id: employeeId,
    role: "EMPLOYEE",
  }).select("-password");

  if (!employee) {
    return sendResponse(res, 404, false, "Employee not found.");
  }

  sendResponse(res, 200, true, "Employee details fetched successfully.", {
    employee: {
      _id: employee._id,
      fullName: employee.fullName,
      employeeId: employee.employeeId,
      email: employee.email,
      department: employee.department,
      designation: employee.designation,
      profileImage: employee.profileImage,
      leaveBalance: employee.leaveBalance,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
    },
  });
};