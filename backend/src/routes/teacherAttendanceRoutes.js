const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const allowRoles = require("../middlewares/roleMiddleware");
const {
  markTeacherAttendance,
  getTeacherAttendanceByMonth,
} = require("../controllers/teacherAttendanceController");

router.post("/mark", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL"), markTeacherAttendance);
router.get(
  "/",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL", "TEACHER"),
  getTeacherAttendanceByMonth
);

module.exports = router;