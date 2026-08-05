import { verifyToken } from "../utils/jwt.js";
import User from "../models/user.model.js";
import { sendResponse } from "../utils/response.js";

export const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return sendResponse(res, 401, false, "Please login first.");
    }

    const decoded = verifyToken(token);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return sendResponse(res, 404, false, "User not found.");
    }

    req.user = user;

    next();
  } catch (error) {
    return sendResponse(res, 401, false, "Invalid or expired token.");
  }
};
