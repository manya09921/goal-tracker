const express = require("express");
const { body } = require("express-validator");
const {
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
} = require("../controllers/goalController");
const { authenticate, authorize } = require("../middleware/auth");
const validate = require("../middleware/validate");

const router = express.Router();
router.use(authenticate);

const goalBodyValidators = [
  body("title").optional().trim().notEmpty().withMessage("Title cannot be empty"),
  body("target").optional().isNumeric().withMessage("Target must be a number"),
  body("weightage").optional().isFloat({ min: 10, max: 100 }).withMessage("Weightage must be between 10 and 100"),
];

// GET /api/goals/summary/:userId
router.get("/summary/:userId", authorize("admin", "manager", "employee"), getGoalSummary);

// Employee CRUD
router.post(
  "/",
  authorize("employee"),
  [
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("target").isNumeric().withMessage("Target is required and must be a number"),
    body("weightage").isFloat({ min: 10, max: 100 }).withMessage("Weightage must be between 10 and 100"),
    ...goalBodyValidators,
  ],
  validate,
  createGoal
);

router.get("/", authorize("admin", "manager", "employee"), getGoals);
router.get("/:id", authorize("admin", "manager", "employee"), getGoalById);

router.patch("/:id", authorize("employee"), goalBodyValidators, validate, updateGoal);
router.patch("/:id/submit", authorize("employee"), submitGoal);
router.delete("/:id", authorize("employee", "admin"), deleteGoal);

// Manager actions
router.patch(
  "/:id/approve",
  authorize("manager"),
  [body("comment").optional().isString()],
  validate,
  approveGoal
);

router.patch(
  "/:id/reject",
  authorize("manager"),
  [body("comment").notEmpty().withMessage("Rejection comment is required")],
  validate,
  rejectGoal
);

router.patch("/:id/manager-edit", authorize("manager"), goalBodyValidators, validate, managerEditGoal);

module.exports = router;
