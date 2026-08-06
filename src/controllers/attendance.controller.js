import { DateTime } from "luxon";

import Attendance from "../models/attendance.model.js";
import Leave from "../models/leave.model.js";

import { sendResponse } from "../utils/response.js";

import {
  getTodayDate,
  calculateLateMinutes,
  calculateWorkingHours,
  getAttendanceStatus,
  isCheckInAllowed,
  getIndiaTime,
} from "../utils/attendance.js";

const TIME_ZONE = "Asia/Kolkata";

// --------------------------------------------------
// Build approved leave dates
// --------------------------------------------------

const buildLeaveDateSet = (leaves, monthStart, monthEnd) => {
  const leaveDates = new Set();

  leaves.forEach((leave) => {
    const startDate = DateTime.fromJSDate(leave.startDate)
      .setZone(TIME_ZONE)
      .startOf("day");

    const endDate = DateTime.fromJSDate(leave.endDate)
      .setZone(TIME_ZONE)
      .startOf("day");

    const rangeStart = startDate > monthStart ? startDate : monthStart;

    const rangeEnd =
      endDate < monthEnd.minus({ days: 1 })
        ? endDate
        : monthEnd.minus({ days: 1 });

    for (
      let date = rangeStart;
      date <= rangeEnd;
      date = date.plus({ days: 1 })
    ) {
      leaveDates.add(date.toFormat("yyyy-MM-dd"));
    }
  });

  return leaveDates;
};

// --------------------------------------------------
// Check In
// --------------------------------------------------

export const checkIn = async (req, res) => {
  if (!isCheckInAllowed()) {
    return sendResponse(
      res,
      400,
      false,
      "Check-in is allowed only between 10:00 AM and 9:00 PM.",
    );
  }

  const today = getTodayDate();

  const existingAttendance = await Attendance.findOne({
    employee: req.user._id,
    date: today,
  });

  if (existingAttendance) {
    return sendResponse(res, 400, false, "Already checked in today.");
  }

  const checkInTime = getIndiaTime().toJSDate();

  const lateMinutes = calculateLateMinutes(checkInTime);

  const status = lateMinutes > 0 ? "Late" : "Present";

  const attendance = await Attendance.create({
    employee: req.user._id,
    date: today,
    checkIn: checkInTime,
    lateMinutes,
    status,
  });

  sendResponse(res, 201, true, "Check In Successful", attendance);
};

// --------------------------------------------------
// Check Out
// --------------------------------------------------

export const checkOut = async (req, res) => {
  const today = getTodayDate();

  const attendance = await Attendance.findOne({
    employee: req.user._id,
    date: today,
  });

  if (!attendance) {
    return sendResponse(res, 404, false, "Please check in first.");
  }

  if (attendance.checkOut) {
    return sendResponse(res, 400, false, "Already checked out.");
  }

  const currentTime = getIndiaTime();

  // Manual checkout is allowed until 9:00 PM
  const checkoutDeadline = currentTime.set({
    hour: 21,
    minute: 0,
    second: 0,
    millisecond: 0,
  });

  // After 9:00 PM, manual checkout is disabled.
  // The auto-checkout job should handle the attendance.
  if (currentTime > checkoutDeadline) {
    return sendResponse(
      res,
      400,
      false,
      "Manual checkout time has ended. Your attendance will be automatically checked out at 9:00 PM.",
    );
  }

  attendance.checkOut = currentTime.toJSDate();

  attendance.workingHours = calculateWorkingHours(
    attendance.checkIn,
    attendance.checkOut,
  );

  attendance.status = getAttendanceStatus(
    attendance.workingHours,
    attendance.lateMinutes,
  );

  await attendance.save();

  sendResponse(res, 200, true, "Check Out Successful", attendance);
};

// --------------------------------------------------
// Get Today's Attendance
// --------------------------------------------------

export const getTodayAttendance = async (req, res) => {
  const attendance = await Attendance.findOne({
    employee: req.user._id,
    date: getTodayDate(),
  });

  sendResponse(res, 200, true, "Today's Attendance", attendance);
};

// --------------------------------------------------
// Get Attendance History
// --------------------------------------------------

export const getAttendanceHistory = async (req, res) => {
  const currentDate = getIndiaTime();

  const month = Number(req.query.month) || currentDate.month;
  const year = Number(req.query.year) || currentDate.year;

  const monthStart = DateTime.fromObject(
    {
      year,
      month,
      day: 1,
    },
    {
      zone: TIME_ZONE,
    },
  ).startOf("day");

  const monthEnd = monthStart.plus({
    months: 1,
  });

  const attendanceQuery = {
    employee: req.user._id,
    date: {
      $gte: monthStart.toFormat("yyyy-MM-dd"),
      $lt: monthEnd.toFormat("yyyy-MM-dd"),
    },
  };

  const [attendanceRecords, approvedLeaves] = await Promise.all([
    Attendance.find(attendanceQuery).sort({
      date: 1,
    }),

    Leave.find({
      employee: req.user._id,
      status: "Approved",
      startDate: {
        $lt: monthEnd.toJSDate(),
      },
      endDate: {
        $gte: monthStart.toJSDate(),
      },
    }),
  ]);

  const attendanceMap = new Map(
    attendanceRecords.map((attendance) => [attendance.date, attendance]),
  );

  const leaveDates = buildLeaveDateSet(approvedLeaves, monthStart, monthEnd);

  const today = getIndiaTime().toFormat("yyyy-MM-dd");

  const days = Array.from(
    {
      length: monthStart.daysInMonth,
    },
    (_, index) => {
      const date = monthStart.plus({
        days: index,
      });

      const dateKey = date.toFormat("yyyy-MM-dd");

      const attendance = attendanceMap.get(dateKey);

      const status =
        attendance?.status || (leaveDates.has(dateKey) ? "On Leave" : "Absent");

      return {
        date: dateKey,
        day: date.day,
        weekday: date.toFormat("ccc"),
        status,
        checkIn: attendance?.checkIn || null,
        checkOut: attendance?.checkOut || null,
        workingHours: attendance?.workingHours || 0,
        lateMinutes: attendance?.lateMinutes || 0,
        isToday: dateKey === today,
      };
    },
  );

  const summary = {
    present: 0,
    late: 0,
    halfDay: 0,
    absent: 0,
    onLeave: 0,
  };

  days.forEach((day) => {
    if (day.status === "Present") {
      summary.present++;
    }

    if (day.status === "Late") {
      summary.late++;
    }

    if (day.status === "Half Day") {
      summary.halfDay++;
    }

    if (day.status === "Absent") {
      summary.absent++;
    }

    if (day.status === "On Leave") {
      summary.onLeave++;
    }
  });

  sendResponse(res, 200, true, "Attendance history fetched successfully.", {
    pagination: {
      currentMonth: month,
      currentYear: year,
      totalRecords: days.length,
    },

    attendance: attendanceRecords,

    calendar: {
      month,
      year,
      monthLabel: monthStart.toFormat("LLLL yyyy"),
      totalDays: monthStart.daysInMonth,
      days,
      summary,
    },
  });
};
