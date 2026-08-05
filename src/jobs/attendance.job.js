import cron from "node-cron";

import Attendance from "../models/attendance.model.js";

import {
  getTodayDate,
  calculateWorkingHours,
  getAttendanceStatus,
} from "../utils/attendance.js";

export const startAttendanceAutoCheckoutJob = () => {
  cron.schedule(
    "0 21 * * *",
    async () => {
      try {
        console.log("Running attendance auto checkout job...");

        const today = getTodayDate();

        const attendances = await Attendance.find({
          date: today,
          checkIn: { $ne: null },
          checkOut: null,
        });

        for (const attendance of attendances) {
          const autoCheckoutTime = new Date();

          autoCheckoutTime.setHours(21, 0, 0, 0);

          attendance.checkOut = autoCheckoutTime;

          attendance.workingHours = calculateWorkingHours(
            attendance.checkIn,
            attendance.checkOut
          );

          attendance.status = getAttendanceStatus(
            attendance.workingHours,
            attendance.lateMinutes
          );

          await attendance.save();
        }

        console.log(
          `Auto checkout completed for ${attendances.length} employees.`
        );
      } catch (error) {
        console.error(
          "Attendance auto checkout error:",
          error.message
        );
      }
    },
    {
      timezone: "Asia/Kolkata",
    }
  );
};