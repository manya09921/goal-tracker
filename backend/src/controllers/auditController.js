const AuditLog = require("../models/AuditLog");

// GET /api/audit — Admin only
const getAuditLogs = async (req, res, next) => {
  try {
    const { userId, action, targetModel, from, to, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (userId) filter.userId = userId;
    if (action) filter.action = { $regex: action, $options: "i" };
    if (targetModel) filter.targetModel = targetModel;
    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to) filter.timestamp.$lte = new Date(to);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate("userId", "name email role")
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(Number(limit)),
      AuditLog.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAuditLogs };
