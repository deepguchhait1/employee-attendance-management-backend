import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    date: {
      type: String,
      required: true,
    },

    checkIn: {
      type: Date,
      default: null,
    },

    checkOut: {
      type: Date,
      default: null,
    },

    workingHours: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["Present", "Late", "Absent", "Half Day", "On Leave"],
      default: "Present",
    },

    lateMinutes: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

// One attendance per employee per day
attendanceSchema.index(
  {
    employee: 1,
    date: 1,
  },
  {
    unique: true,
  },
);

const Attendance = mongoose.model("Attendance", attendanceSchema);

export default Attendance;
