const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const allowRoles = require("../middlewares/roleMiddleware");

const { createExam, getExamsByClass } = require("../controllers/examController");

router.post(
  "/",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL"),
  createExam
);

router.get(
  "/class/:classId",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL", "TEACHER"),
  getExamsByClass
);

module.exports = router;