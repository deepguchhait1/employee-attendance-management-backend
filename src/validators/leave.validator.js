import { body, validationResult } from "express-validator";

export const leaveValidation = [
  body("leaveType")
    .notEmpty()
    .withMessage("Leave type is required"),

  body("startDate")
    .notEmpty()
    .withMessage("Start date is required"),

  body("endDate")
    .notEmpty()
    .withMessage("End date is required"),

  body("reason")
    .trim()
    .notEmpty()
    .withMessage("Reason is required"),
];

export const validateLeave = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
    });
  }

  next();
};