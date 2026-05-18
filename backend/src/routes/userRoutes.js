const express = require("express");
const { getUsers, getUserById, updateUser, deactivateUser } = require("../controllers/userController");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate);

// GET /api/users — Admin + Manager
router.get("/", authorize("admin", "manager"), getUsers);

// GET /api/users/:id — Admin + Manager
router.get("/:id", authorize("admin", "manager"), getUserById);

// PATCH /api/users/:id — Admin only
router.patch("/:id", authorize("admin"), updateUser);

// DELETE /api/users/:id — Admin only (soft deactivate)
router.delete("/:id", authorize("admin"), deactivateUser);

module.exports = router;
