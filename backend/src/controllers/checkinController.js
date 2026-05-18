const Checkin = require("../models/Checkin");
const Goal = require("../models/Goal");
const User = require("../models/User");
const auditLog = require("../utils/auditLog");

// POST /api/checkins — Employee submits a quarterly update
const createCheckin = async (req, res, next) => {
  try {
    const { goalId, quarter, actualValue, status, comment } = req.body;

    const goal = await Goal.findById(goalId);
    if (!goal) return res.status(404).json({ success: false, message: "Goal not found." });

    // Only goal owner can check in
    if (String(goal.userId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Access denied. Not your goal." });
    }

    // Goal must be approved before check-ins
    if (!goal.approved || goal.status !== "approved") {
      return res.status(400).json({ success: false, message: "Check-ins are only allowed on approved goals." });
    }

    // Prevent duplicate check-in for same quarter
    const existing = await Checkin.findOne({ goalId, quarter });
    if (existing) {
      return res.status(409).json({ success: false, message: `A check-in for ${quarter} already exists. Use update instead.` });
    }

    const checkin = await Checkin.create({ goalId, userId: req.user._id, quarter, actualValue, status, comment });

    // Auto-complete goal if status is completed
    if (status === "completed") {
      await Goal.findByIdAndUpdate(goalId, { status: "completed" });
    }

    await auditLog({ action: "CHECKIN_CREATED", userId: req.user._id, targetId: checkin._id, targetModel: "Checkin", details: { goalId, quarter }, ipAddress: req.ip });

    res.status(201).json({ success: true, message: "Check-in recorded.", data: { checkin } });
  } catch (err) {
    next(err);
  }
};

// GET /api/checkins — Filtered by goalId, userId, quarter
const getCheckins = async (req, res, next) => {
  try {
    const { goalId, quarter } = req.query;
    let filter = {};

    if (req.user.role === "employee") {
      filter.userId = req.user._id;
    } else if (req.user.role === "manager") {
      const teamMembers = await User.find({ managerId: req.user._id }).select("_id");
      filter.userId = { $in: teamMembers.map((u) => u._id) };
    }

    if (goalId) filter.goalId = goalId;
    if (quarter) filter.quarter = quarter;

    const checkins = await Checkin.find(filter)
      .populate("goalId", "title target weightage")
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: checkins.length, data: { checkins } });
  } catch (err) {
    next(err);
  }
};

// GET /api/checkins/:id
const getCheckinById = async (req, res, next) => {
  try {
    const checkin = await Checkin.findById(req.params.id)
      .populate("goalId", "title target")
      .populate("userId", "name email");

    if (!checkin) return res.status(404).json({ success: false, message: "Check-in not found." });

    // Access control
    if (req.user.role === "employee" && String(checkin.userId._id) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    res.json({ success: true, data: { checkin } });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/checkins/:id — Update an existing check-in (same quarter)
const updateCheckin = async (req, res, next) => {
  try {
    const checkin = await Checkin.findById(req.params.id);
    if (!checkin) return res.status(404).json({ success: false, message: "Check-in not found." });

    if (String(checkin.userId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    const { actualValue, status, comment } = req.body;
    if (actualValue !== undefined) checkin.actualValue = actualValue;
    if (status) checkin.status = status;
    if (comment !== undefined) checkin.comment = comment;

    await checkin.save();
    await auditLog({ action: "CHECKIN_UPDATED", userId: req.user._id, targetId: checkin._id, targetModel: "Checkin", ipAddress: req.ip });

    res.json({ success: true, message: "Check-in updated.", data: { checkin } });
  } catch (err) {
    next(err);
  }
};

// GET /api/checkins/goal/:goalId — All quarters for a goal
const getCheckinsByGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findById(req.params.goalId);
    if (!goal) return res.status(404).json({ success: false, message: "Goal not found." });

    const checkins = await Checkin.find({ goalId: req.params.goalId }).sort({ quarter: 1 });
    res.json({ success: true, count: checkins.length, data: { checkins } });
  } catch (err) {
    next(err);
  }
};

module.exports = { createCheckin, getCheckins, getCheckinById, updateCheckin, getCheckinsByGoal };
