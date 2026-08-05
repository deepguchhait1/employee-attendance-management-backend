import { validationResult } from "express-validator";
import { sendResponse } from "../utils/response.js";

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return sendResponse(res, 400, false, errors.array()[0].msg);
  }

  next();
};
