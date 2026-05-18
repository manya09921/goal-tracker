const User = require("../models/User");
const auditLog = require("../utils/auditLog");

// GET /api/users — Admin: all users | Manager: their team
const getUsers = async (req, res, next) => {
  try {
    let filter = {};
    if (req.user.role === "manager") {
      filter = { managerId: req.user._id };
    }

    const users = await User.find(filter).populate("managerId", "name email");
    res.json({ success: true, count: users.length, data: { users } });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/:id
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate("managerId", "name email");
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    // Managers can only view their team members
    if (req.user.role === "manager" && String(user.managerId?._id) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/users/:id — Admin only
const updateUser = async (req, res, next) => {
  try {
    const { name, email, role, managerId, isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, managerId, isActive },
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    await auditLog({ action: "USER_UPDATED", userId: req.user._id, targetId: user._id, targetModel: "User", ipAddress: req.ip });

    res.json({ success: true, message: "User updated.", data: { user } });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/users/:id — Admin only (soft delete)
const deactivateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    await auditLog({ action: "USER_DEACTIVATED", userId: req.user._id, targetId: user._id, targetModel: "User", ipAddress: req.ip });

    res.json({ success: true, message: "User deactivated." });
  } catch (err) {
    next(err);
  }
};

module.exports = { getUsers, getUserById, updateUser, deactivateUser };
