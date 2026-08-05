import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    profileImage: {
      url: {
        type: String,
        default: "",
      },
      publicId: {
        type: String,
        default: "",
      },
    },

    role: {
      type: String,
      enum: ["HR", "EMPLOYEE"],
      default: "EMPLOYEE",
    },

    department: {
      type: String,
      trim: true,
    },

    designation: {
      type: String,
      trim: true,
    },

    leaveBalance: {
      type: Number,
      default: 12,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);

export default User;
