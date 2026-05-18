const express = require("express");
const { getAuditLogs } = require("../controllers/auditController");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate);
router.get("/", authorize("admin"), getAuditLogs);

module.exports = router;
