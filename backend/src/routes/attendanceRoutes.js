const express = require("express");

const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const allowRoles = require("../middlewares/roleMiddleware");

const {
  markAttendance,
  updateAttendance,
  getClassAttendance,
  getClassAttendanceReport,
  getMyAttendance,
  getStudentAttendance,
} = require("../controllers/attendanceController");

// TEACHER — mark attendance
router.post("/mark", authMiddleware, allowRoles("TEACHER"), markAttendance);

// FIX: was allowRoles("TEACHER") — teachers could edit their own already-
// submitted attendance, contradicting "sirf Admin/Principal edit kar
// sakein, teacher sirf mark kare". Now only Admin/Principal/Super Admin.
router.patch(
  "/update",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL"),
  updateAttendance,
);

// TEACHER / ADMIN / PRINCIPAL — single date
router.get(
  "/class",
  authMiddleware,
  allowRoles("TEACHER", "SUPER_ADMIN", "ADMIN", "PRINCIPAL"),
  getClassAttendance,
);

// FIX: NEW — whole class, date range, per-student % — the "Attendance
// Report" screen needs this; nothing in the old routes covered a range.
router.get(
  "/class/report",
  authMiddleware,
  allowRoles("TEACHER", "SUPER_ADMIN", "ADMIN", "PRINCIPAL"),
  getClassAttendanceReport,
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
