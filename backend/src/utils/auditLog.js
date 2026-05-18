const AuditLog = require("../models/AuditLog");

const auditLog = async ({ action, userId, targetId = null, targetModel = null, details = {}, ipAddress = null }) => {
  try {
    await AuditLog.create({ action, userId, targetId, targetModel, details, ipAddress });
  } catch (err) {
    // Audit failures should never crash the app
    console.error(`[AUDIT] Failed to write audit log: ${err.message}`);
  }
};

module.exports = auditLog;
