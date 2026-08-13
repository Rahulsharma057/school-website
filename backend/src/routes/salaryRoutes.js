const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const allowRoles = require("../middlewares/roleMiddleware");
const {
  setSalaryStructure,
  getCurrentSalaryStructure,
  generateMonthlySalary,
  addPayment,
  getTeacherSalaryHistory,
  getMySalary,
} = require("../controllers/salaryController");

const staffOnly = allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL");

router.post("/structure", authMiddleware, staffOnly, setSalaryStructure);
router.get("/structure/:teacherId", authMiddleware, staffOnly, getCurrentSalaryStructure);

router.post("/generate", authMiddleware, staffOnly, generateMonthlySalary);
router.patch("/:id/pay", authMiddleware, staffOnly, addPayment);

router.get("/history/:teacherId", authMiddleware, staffOnly, getTeacherSalaryHistory);
router.get("/my-salary", authMiddleware, allowRoles("TEACHER"), getMySalary);

module.exports = router;