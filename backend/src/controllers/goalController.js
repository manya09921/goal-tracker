const Goal = require("../models/Goal");
const User = require("../models/User");
const auditLog = require("../utils/auditLog");

const MAX_GOALS = 8;
const TOTAL_WEIGHTAGE = 100;
const MIN_WEIGHTAGE = 10;

// ─── Helper ────────────────────────────────────────────────────────────────────

const validateWeightage = async (userId, newWeightage, excludeGoalId = null) => {
  const filter = { userId, status: { $ne: "rejected" } };
  if (excludeGoalId) filter._id = { $ne: excludeGoalId };

  const goals = await Goal.find(filter);
  const totalExisting = goals.reduce((sum, g) => sum + g.weightage, 0);

  if (totalExisting + newWeightage > TOTAL_WEIGHTAGE) {
    return { valid: false, message: `Total weightage exceeds 100%. Currently used: ${totalExisting}%.` };
  }
  return { valid: true };
};

// ─── Employee Controllers ───────────────────────────────────────────────────────

// POST /api/goals
const createGoal = async (req, res, next) => {
  try {
    const { title, description, target, weightage } = req.body;
    const userId = req.user._id;

    // Max 8 goals check
    const goalCount = await Goal.countDocuments({ userId, status: { $ne: "rejected" } });
    if (goalCount >= MAX_GOALS) {
      return res.status(400).json({ success: false, message: `Maximum of ${MAX_GOALS} goals allowed.` });
    }

    // Weightage validations
    if (weightage < MIN_WEIGHTAGE) {
      return res.status(400).json({ success: false, message: `Each goal must have at least ${MIN_WEIGHTAGE}% weightage.` });
    }

    const weightCheck = await validateWeightage(userId, weightage);
    if (!weightCheck.valid) {
      return res.status(400).json({ success: false, message: weightCheck.message });
    }

    const goal = await Goal.create({ userId, title, description, target, weightage });

    await auditLog({ action: "GOAL_CREATED", userId, targetId: goal._id, targetModel: "Goal", details: { title }, ipAddress: req.ip });

    res.status(201).json({ success: true, message: "Goal created.", data: { goal } });
  } catch (err) {
    next(err);
  }
};

// GET /api/goals — Employee sees own, Manager sees team's, Admin sees all
const getGoals = async (req, res, next) => {
  try {
    let filter = {};
    const { status, userId: queryUserId } = req.query;

    if (req.user.role === "employee") {
      filter.userId = req.user._id;
    } else if (req.user.role === "manager") {
      const teamMembers = await User.find({ managerId: req.user._id }).select("_id");
      const teamIds = teamMembers.map((u) => u._id);
      filter.userId = queryUserId ? queryUserId : { $in: teamIds };
    } else if (req.user.role === "admin" && queryUserId) {
      filter.userId = queryUserId;
    }

    if (status) filter.status = status;

    const goals = await Goal.find(filter)
      .populate("userId", "name email")
      .populate("reviewedBy", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: goals.length, data: { goals } });
  } catch (err) {
    next(err);
  }
};

// GET /api/goals/:id
const getGoalById = async (req, res, next) => {
  try {
    const goal = await Goal.findById(req.params.id)
      .populate("userId", "name email managerId")
      .populate("reviewedBy", "name email");

    if (!goal) return res.status(404).json({ success: false, message: "Goal not found." });

    // Access control
    if (req.user.role === "employee" && String(goal.userId._id) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }
    if (req.user.role === "manager") {
      const member = await User.findOne({ _id: goal.userId._id, managerId: req.user._id });
      if (!member) return res.status(403).json({ success: false, message: "Access denied." });
    }

    res.json({ success: true, data: { goal } });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/goals/:id — Employee updates own draft goal
const updateGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ success: false, message: "Goal not found." });

    // Only owner can edit
    if (String(goal.userId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Access denied. Not your goal." });
    }

    // Cannot edit locked/approved goals
    if (goal.locked) {
      return res.status(400).json({ success: false, message: "Goal is locked after approval and cannot be edited." });
    }

    if (!["draft", "rejected"].includes(goal.status)) {
      return res.status(400).json({ success: false, message: "Only draft or rejected goals can be edited." });
    }

    const { title, description, target, weightage } = req.body;

    if (weightage && weightage !== goal.weightage) {
      if (weightage < MIN_WEIGHTAGE) {
        return res.status(400).json({ success: false, message: `Weightage must be at least ${MIN_WEIGHTAGE}%.` });
      }
      const weightCheck = await validateWeightage(req.user._id, weightage, goal._id);
      if (!weightCheck.valid) {
        return res.status(400).json({ success: false, message: weightCheck.message });
      }
    }

    if (title) goal.title = title;
    if (description !== undefined) goal.description = description;
    if (target !== undefined) goal.target = target;
    if (weightage) goal.weightage = weightage;
    goal.status = "draft"; // reset to draft on edit

    await goal.save();
    await auditLog({ action: "GOAL_UPDATED", userId: req.user._id, targetId: goal._id, targetModel: "Goal", ipAddress: req.ip });

    res.json({ success: true, message: "Goal updated.", data: { goal } });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/goals/:id/submit — Employee submits goal for approval
const submitGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ success: false, message: "Goal not found." });

    if (String(goal.userId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    if (!["draft", "rejected"].includes(goal.status)) {
      return res.status(400).json({ success: false, message: "Only draft or rejected goals can be submitted." });
    }

    goal.status = "submitted";
    await goal.save();
    await auditLog({ action: "GOAL_SUBMITTED", userId: req.user._id, targetId: goal._id, targetModel: "Goal", ipAddress: req.ip });

    res.json({ success: true, message: "Goal submitted for approval.", data: { goal } });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/goals/:id — Employee deletes own draft goal
const deleteGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ success: false, message: "Goal not found." });

    if (String(goal.userId) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    if (goal.locked) {
      return res.status(400).json({ success: false, message: "Cannot delete an approved (locked) goal." });
    }

    await goal.deleteOne();
    await auditLog({ action: "GOAL_DELETED", userId: req.user._id, targetId: goal._id, targetModel: "Goal", ipAddress: req.ip });

    res.json({ success: true, message: "Goal deleted." });
  } catch (err) {
    next(err);
  }
};

// ─── Manager Controllers ────────────────────────────────────────────────────────

// Shared: verify manager has authority over this goal's owner
const assertManagerAccess = async (managerId, goal) => {
  const member = await User.findOne({ _id: goal.userId, managerId });
  return !!member;
};

// PATCH /api/goals/:id/approve — Manager approves
const approveGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ success: false, message: "Goal not found." });

    if (!(await assertManagerAccess(req.user._id, goal))) {
      return res.status(403).json({ success: false, message: "Access denied. Not your team member." });
    }

    if (goal.status !== "submitted") {
      return res.status(400).json({ success: false, message: "Only submitted goals can be approved." });
    }

    goal.status = "approved";
    goal.approved = true;
    goal.locked = true; // LOCK on approval
    goal.reviewedBy = req.user._id;
    goal.reviewedAt = new Date();
    goal.managerComment = req.body.comment || "";

    await goal.save();
    await auditLog({ action: "GOAL_APPROVED", userId: req.user._id, targetId: goal._id, targetModel: "Goal", ipAddress: req.ip });

    res.json({ success: true, message: "Goal approved and locked.", data: { goal } });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/goals/:id/reject — Manager rejects
const rejectGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ success: false, message: "Goal not found." });

    if (!(await assertManagerAccess(req.user._id, goal))) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    if (goal.status !== "submitted") {
      return res.status(400).json({ success: false, message: "Only submitted goals can be rejected." });
    }

    const { comment } = req.body;
    if (!comment) {
      return res.status(400).json({ success: false, message: "A rejection comment is required." });
    }

    goal.status = "rejected";
    goal.approved = false;
    goal.reviewedBy = req.user._id;
    goal.reviewedAt = new Date();
    goal.managerComment = comment;

    await goal.save();
    await auditLog({ action: "GOAL_REJECTED", userId: req.user._id, targetId: goal._id, targetModel: "Goal", details: { comment }, ipAddress: req.ip });

    res.json({ success: true, message: "Goal rejected.", data: { goal } });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/goals/:id/manager-edit — Manager edits (only before lock)
const managerEditGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ success: false, message: "Goal not found." });

    if (!(await assertManagerAccess(req.user._id, goal))) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    if (goal.locked) {
      return res.status(400).json({ success: false, message: "Goal is locked and cannot be edited." });
    }

    const { title, description, target, weightage, managerComment } = req.body;
    if (title) goal.title = title;
    if (description !== undefined) goal.description = description;
    if (target !== undefined) goal.target = target;
    if (weightage) {
      const weightCheck = await validateWeightage(goal.userId, weightage, goal._id);
      if (!weightCheck.valid) return res.status(400).json({ success: false, message: weightCheck.message });
      goal.weightage = weightage;
    }
    if (managerComment) goal.managerComment = managerComment;

    await goal.save();
    await auditLog({ action: "GOAL_MANAGER_EDITED", userId: req.user._id, targetId: goal._id, targetModel: "Goal", ipAddress: req.ip });

    res.json({ success: true, message: "Goal updated by manager.", data: { goal } });
  } catch (err) {
    next(err);
  }
};

// GET /api/goals/summary/:userId — weightage summary for a user
const getGoalSummary = async (req, res, next) => {
  try {
    const targetUserId = req.params.userId;
    const goals = await Goal.find({ userId: targetUserId, status: { $ne: "rejected" } });

    const totalWeightage = goals.reduce((sum, g) => sum + g.weightage, 0);
    const remaining = TOTAL_WEIGHTAGE - totalWeightage;

    res.json({
      success: true,
      data: {
        totalGoals: goals.length,
        maxGoals: MAX_GOALS,
        totalWeightage,
        remainingWeightage: remaining,
        isWeightageComplete: totalWeightage === TOTAL_WEIGHTAGE,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createGoal,
  getGoals,
  getGoalById,
  updateGoal,
  submitGoal,
  deleteGoal,
  approveGoal,
  rejectGoal,
  managerEditGoal,
  getGoalSummary,
};
