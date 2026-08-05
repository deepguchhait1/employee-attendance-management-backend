import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import { sendResponse } from "../utils/response.js";
import { generateToken } from "../utils/jwt.js";
import { env } from "../config/env.js";
// Register
export const register = async (req, res) => {
  const {
    fullName,
    employeeId,
    email,
    password,
    department,
    designation,
  } = req.body;

  const emailExists = await User.findOne({ email });

  if (emailExists) {
    return sendResponse(res, 400, false, "Email already exists");
  }

  const employeeExists = await User.findOne({ employeeId });

  if (employeeExists) {
    return sendResponse(res, 400, false, "Employee ID already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    fullName,
    employeeId,
    email,
    password: hashedPassword,
    department,
    designation,
  });

  const token = generateToken({
    id: user._id,
    role: user.role,
  });

  res.cookie("token", token, {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

  sendResponse(res, 201, true, "Registration Successful", {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    profileImage: user.profileImage,
  });
};

// Login
export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return sendResponse(res, 404, false, "Invalid Email or Password");
  }

  const isMatched = await bcrypt.compare(password, user.password);

  if (!isMatched) {
    return sendResponse(res, 401, false, "Invalid Email or Password");
  }

  const token = generateToken({
    id: user._id,
    role: user.role,
  });

  res.cookie("token", token, {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

  sendResponse(res, 200, true, "Login Successful", {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    profileImage: user.profileImage,
  });
};

// Logout
export const logout = async (req, res) => {
  res.clearCookie("token");

  sendResponse(res, 200, true, "Logout Successful");
};