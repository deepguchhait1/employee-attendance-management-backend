import { sendResponse } from "../utils/response.js";

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendResponse(res, 401, false, "Unauthorized access.");
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendResponse(
        res,
        403,
        false,
        "You don't have permission to access this resource.",
      );
    }

    next();
  };
};
