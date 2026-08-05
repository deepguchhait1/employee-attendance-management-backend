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

const normalizeStatus = (status) => {
  const allowedStatuses = new Set([
    "Present",
    "Late",
    "Half Day",
    "Absent",
    "On Leave",
  ]);

  if (allowedStatuses.has(status)) {
    return status;
  }

  return "Absent";
};

const toDayKey = (dateTime) => dateTime.toFormat("yyyy-MM-dd");

const buildLeaveDateSet = (leaves, monthStart, monthEnd) => {
  const leaveDates = new Set();
  const lastDayInMonth = monthEnd.minus({ days: 1 });

  leaves.forEach((leave) => {
    const leaveStart = DateTime.fromJSDate(leave.startDate)
      .setZone(TIME_ZONE)
      .startOf("day");
    const leaveFinish = DateTime.fromJSDate(leave.endDate)
      .setZone(TIME_ZONE)
      .startOf("day");

    const rangeStart =
      leaveStart.toMillis() > monthStart.toMillis() ? leaveStart : monthStart;

    const rangeEnd =
      leaveFinish.toMillis() < lastDayInMonth.toMillis()
        ? leaveFinish
        : lastDayInMonth;

    for (
      let cursor = rangeStart;
      cursor.toMillis() <= rangeEnd.toMillis();
      cursor = cursor.plus({ days: 1 })
    ) {
      leaveDates.add(toDayKey(cursor));
    }
  });

  return leaveDates;
};

// Check in
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

  const attendance = await Attendance.findOne({
    employee: req.user._id,
    date: today,
  });

  if (attendance) {
    return sendResponse(res, 400, false, "Already checked in today.");
  }

  const currentTime = getIndiaTime().toJSDate();

  const lateMinutes = calculateLateMinutes(currentTime);

  const status = lateMinutes > 0 ? "Late" : "Present";

  const newAttendance = await Attendance.create({
    employee: req.user._id,
    date: today,
    checkIn: currentTime,
    lateMinutes,
    status,
  });

  sendResponse(res, 201, true, "Check In Successful", newAttendance);
};

// Check out
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

  // Manual checkout is allowed only until 7:00 PM
  const manualCheckoutEndTime = currentTime.set({
    hour: 19,
    minute: 0,
    second: 0,
    millisecond: 0,
  });

  if (currentTime >= manualCheckoutEndTime) {
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

// Get today attendance
export const getTodayAttendance = async (req, res) => {
  const today = getTodayDate();

  const attendance = await Attendance.findOne({
    employee: req.user._id,
    date: today,
  });

  sendResponse(res, 200, true, "Today's Attendance", attendance);
};

// Get attendance history
export const getAttendanceHistory = async (req, res) => {
  const currentMonth = getIndiaTime();
  const monthValue = Number(req.query.month) || currentMonth.month;
  const yearValue = Number(req.query.year) || currentMonth.year;

  const monthStart = DateTime.fromObject(
    {
      year: yearValue,
      month: monthValue,
      day: 1,
    },
    {
      zone: TIME_ZONE,
    },
  ).startOf("day");

  const monthEnd = monthStart.plus({ months: 1 });

  const query = {
    employee: req.user._id,
    date: {
      $gte: monthStart.toFormat("yyyy-MM-dd"),
      $lt: monthEnd.toFormat("yyyy-MM-dd"),
    },
  };

  const [attendanceRecords, approvedLeaves] = await Promise.all([
    Attendance.find(query).sort({
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
    attendanceRecords.map((record) => [record.date, record]),
  );

  const leaveDates = buildLeaveDateSet(approvedLeaves, monthStart, monthEnd);

  const calendarDays = Array.from(
    {
      length: monthStart.daysInMonth,
    },
    (_, index) => {
      const dayDate = monthStart.plus({ days: index });
      const dayKey = toDayKey(dayDate);
      const attendance = attendanceMap.get(dayKey);

      const status = normalizeStatus(
        attendance?.status || (leaveDates.has(dayKey) ? "On Leave" : "Absent"),
      );

      return {
        date: dayKey,
        day: dayDate.day,
        weekday: dayDate.toFormat("ccc"),
        status,
        checkIn: attendance?.checkIn || null,
        checkOut: attendance?.checkOut || null,
        workingHours: attendance?.workingHours || 0,
        lateMinutes: attendance?.lateMinutes || 0,
        isToday: dayKey === getIndiaTime().toFormat("yyyy-MM-dd"),
      };
    },
  );

  const summary = calendarDays.reduce(
    (accumulator, day) => {
      const statusKey =
        day.status === "Half Day"
          ? "halfDay"
          : day.status === "On Leave"
            ? "onLeave"
            : day.status.toLowerCase();

      if (accumulator[statusKey] !== undefined) {
        accumulator[statusKey] += 1;
      }

      return accumulator;
    },
    {
      present: 0,
      late: 0,
      halfDay: 0,
      absent: 0,
      onLeave: 0,
    },
  );

  sendResponse(res, 200, true, "Attendance history fetched successfully.", {
    pagination: {
      currentMonth: monthValue,
      currentYear: yearValue,
      totalRecords: calendarDays.length,
    },
    attendance: attendanceRecords,
    calendar: {
      month: monthValue,
      year: yearValue,
      monthLabel: monthStart.toFormat("LLLL yyyy"),
      totalDays: monthStart.daysInMonth,
      days: calendarDays,
      summary,
    },
  });
};
