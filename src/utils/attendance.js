import { DateTime } from "luxon";


export const getTodayDate = () => {
  return new Date().toISOString().split("T")[0];
};

export const calculateWorkingHours = (checkIn, checkOut) => {
  const difference = checkOut - checkIn;

  const hours = difference / (1000 * 60 * 60);

  return Number(hours.toFixed(2));
};

export const calculateLateMinutes = (checkInTime) => {
  const checkIn = new Date(checkInTime);

  const officeStart = new Date(checkIn);
  officeStart.setHours(10, 0, 0, 0);

  const graceTime = new Date(checkIn);
  graceTime.setHours(10, 30, 0, 0);

  // Before 10 AM
  if (checkIn < officeStart) {
    return 0;
  }

  // 10:00 AM - 10:30 AM
  if (checkIn <= graceTime) {
    return 0;
  }

  // After 10:30 AM
  return Math.floor(
    (checkIn.getTime() - graceTime.getTime()) / (1000 * 60)
  );
};

export const getAttendanceStatus = (hours, lateMinutes) => {
  if (hours < 4) {
    return "Half Day";
  }

  if (lateMinutes > 0) {
    return "Late";
  }

  return "Present";
};

export const getCurrentHour = (date = new Date()) => {
  return date.getHours();
};


export const isAutoCheckoutTime = (date = new Date()) => {
  const hour = date.getHours();
  const minute = date.getMinutes();

  return hour === 21 && minute >= 0;
};


export const isCheckoutAllowed = () => {
  const now = getIndiaTime();

  const autoCheckoutTime = now.set({
    hour: 21,
    minute: 0,
    second: 0,
    millisecond: 0,
  });

  return now < autoCheckoutTime;
};


export const getIndiaTime = () => {
  return DateTime.now().setZone("Asia/Kolkata");
};

export const isCheckInAllowed = () => {
  const now = getIndiaTime();

  const officeStart = now.set({
    hour: 10,
    minute: 0,
    second: 0,
    millisecond: 0,
  });

  const autoCheckoutTime = now.set({
    hour: 21,
    minute: 0,
    second: 0,
    millisecond: 0,
  });

  return now >= officeStart && now < autoCheckoutTime;
};