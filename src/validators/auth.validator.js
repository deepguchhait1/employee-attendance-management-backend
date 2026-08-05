import { body, validationResult } from "express-validator";

export const registerValidation = [
  body("fullName")
    .trim()
    .notEmpty()
    .withMessage("Full name is required"),

  body("employeeId")
    .trim()
    .notEmpty()
    .withMessage("Employee ID is required"),

  body("email")
    .trim()
    .isEmail()
    .withMessage("Enter a valid email"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

export const loginValidation = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Enter a valid email"),

  body("password")
    .notEmpty()
    .withMessage("Password is required"),
];

export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
    });
  }

  next();
};