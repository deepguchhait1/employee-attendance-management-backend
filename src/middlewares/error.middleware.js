import { sendResponse } from "../utils/response.js";

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  sendResponse(res, statusCode, false, err.message || "Internal Server Error");
};
