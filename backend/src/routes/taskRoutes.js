const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const allowRoles = require("../middlewares/roleMiddleware");

const {
  createTask,
  getAllTasks,
  getMyTasks,
  getTaskById,
  updateTaskStatus,
  addTaskMessage,
  deleteTask,
  getTaskStats,
} = require("../controllers/taskController");

const staffOnly = allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL");

// Admin/Principal
router.post("/", authMiddleware, staffOnly, createTask);
router.get("/", authMiddleware, staffOnly, getAllTasks);
router.get("/stats", authMiddleware, staffOnly, getTaskStats);
router.delete("/:id", authMiddleware, staffOnly, deleteTask);

// Teacher
router.get("/my-tasks", authMiddleware, allowRoles("TEACHER"), getMyTasks);
router.patch("/:id/status", authMiddleware, allowRoles("TEACHER"), updateTaskStatus);

// Shared (dono access kar sakte hain, andar controller mein ownership check hota hai)
router.get("/:id", authMiddleware, getTaskById);
router.post("/:id/messages", authMiddleware, addTaskMessage);

module.exports = router;