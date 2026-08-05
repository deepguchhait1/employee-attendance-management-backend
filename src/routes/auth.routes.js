import { Router } from "express";

import { register, login, logout } from "../controllers/auth.controller.js";

import {
  registerValidation,
  loginValidation,
  validate,
} from "../validators/auth.validator.js";

const router = Router();

router.post("/register", registerValidation, validate, register);

router.post("/login", loginValidation, validate, login);

router.post("/logout", logout);

export default router;
