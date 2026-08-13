const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const allowRoles = require("../middlewares/roleMiddleware");
const { exportTeacherAttendance, exportTeacherSalary } = require("../controllers/exportController");

router.get("/attendance", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL"), exportTeacherAttendance);
router.get("/salary", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL"), exportTeacherSalary);

module.exports = router;