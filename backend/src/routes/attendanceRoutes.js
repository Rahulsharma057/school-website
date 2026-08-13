const express = require("express");

const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const allowRoles = require("../middlewares/roleMiddleware");

const {
  markAttendance,
  updateAttendance,
  getClassAttendance,
  getMyAttendance,
  getStudentAttendance,
} = require("../controllers/attendanceController");

// TEACHER — mark attendance
router.post("/mark", authMiddleware, allowRoles("TEACHER"), markAttendance);

// TEACHER — update attendance
router.patch(
  "/update",
  authMiddleware,
  allowRoles("TEACHER"),
  updateAttendance,
);

// TEACHER / ADMIN / PRINCIPAL
router.get(
  "/class",
  authMiddleware,
  allowRoles("TEACHER", "SUPER_ADMIN", "ADMIN", "PRINCIPAL"),
  getClassAttendance,
);

// Individual student attendance
router.get(
  "/student/:studentId",
  authMiddleware,
  allowRoles("TEACHER", "SUPER_ADMIN", "ADMIN", "PRINCIPAL"),
  getStudentAttendance,
);

// STUDENT
router.get(
  "/my-attendance",
  authMiddleware,
  allowRoles("STUDENT"),
  getMyAttendance,
);

module.exports = router;
