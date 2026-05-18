const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auditLog = require("../utils/auditLog");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, managerId } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: "Email already registered." });
    }

    // Only admins can create managers/admins (enforced at route level too)
    const user = await User.create({ name, email, password, role: role || "employee", managerId: managerId || null });

    await auditLog({ action: "USER_REGISTERED", userId: user._id, targetId: user._id, targetModel: "User", ipAddress: req.ip });

    res.status(201).json({
      success: true,
      message: "User registered successfully.",
      data: { user, token: generateToken(user._id) },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    await auditLog({ action: "USER_LOGIN", userId: user._id, ipAddress: req.ip });

    res.json({
      success: true,
      message: "Login successful.",
      data: { user, token: generateToken(user._id) },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ success: true, data: { user: req.user } });
};

// PATCH /api/auth/change-password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select("+password");

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Current password is incorrect." });
    }

    user.password = newPassword;
    await user.save();

    await auditLog({ action: "PASSWORD_CHANGED", userId: user._id, ipAddress: req.ip });

    res.json({ success: true, message: "Password changed successfully." });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe, changePassword };
