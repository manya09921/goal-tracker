const express = require("express");
const { body } = require("express-validator");
const { register, login, getMe, changePassword } = require("../controllers/authController");
const { authenticate, authorize } = require("../middleware/auth");
const validate = require("../middleware/validate");

const router = express.Router();

// POST /api/auth/register
router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
    body("role").optional().isIn(["employee", "manager", "admin"]).withMessage("Invalid role"),
  ],
  validate,
  register
);

// POST /api/auth/login
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validate,
  login
);

// GET /api/auth/me
router.get("/me", authenticate, getMe);

// PATCH /api/auth/change-password
router.patch(
  "/change-password",
  authenticate,
  [
    body("currentPassword").notEmpty().withMessage("Current password is required"),
    body("newPassword").isLength({ min: 8 }).withMessage("New password must be at least 8 characters"),
  ],
  validate,
  changePassword
);

module.exports = router;
