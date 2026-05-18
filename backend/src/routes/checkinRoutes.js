const express = require("express");
const { body } = require("express-validator");
const { createCheckin, getCheckins, getCheckinById, updateCheckin, getCheckinsByGoal } = require("../controllers/checkinController");
const { authenticate, authorize } = require("../middleware/auth");
const validate = require("../middleware/validate");

const router = express.Router();
router.use(authenticate);

// GET /api/checkins/goal/:goalId
router.get("/goal/:goalId", authorize("admin", "manager", "employee"), getCheckinsByGoal);

// POST /api/checkins
router.post(
  "/",
  authorize("employee"),
  [
    body("goalId").notEmpty().withMessage("Goal ID is required"),
    body("quarter").isIn(["Q1", "Q2", "Q3", "Q4"]).withMessage("Quarter must be Q1, Q2, Q3, or Q4"),
    body("actualValue").isNumeric().withMessage("Actual value must be a number"),
    body("status").isIn(["on_track", "at_risk", "behind", "completed"]).withMessage("Invalid status"),
  ],
  validate,
  createCheckin
);

// GET /api/checkins
router.get("/", authorize("admin", "manager", "employee"), getCheckins);

// GET /api/checkins/:id
router.get("/:id", authorize("admin", "manager", "employee"), getCheckinById);

// PATCH /api/checkins/:id
router.patch(
  "/:id",
  authorize("employee"),
  [
    body("actualValue").optional().isNumeric().withMessage("Actual value must be a number"),
    body("status").optional().isIn(["on_track", "at_risk", "behind", "completed"]).withMessage("Invalid status"),
  ],
  validate,
  updateCheckin
);

module.exports = router;
