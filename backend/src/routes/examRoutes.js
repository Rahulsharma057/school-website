const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const allowRoles = require("../middlewares/roleMiddleware");

const {
  createExam,
  getExamsByClass,
  getExamById,
  updateExam,
  deleteExam,
} = require("../controllers/examController");

// ================= CREATE EXAM =================
// SUPER_ADMIN, ADMIN, PRINCIPAL

router.post(
  "/",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL"),
  createExam
);

// ================= GET EXAMS BY CLASS =================
// SUPER_ADMIN, ADMIN, PRINCIPAL, TEACHER

router.get(
  "/class/:classId",
  authMiddleware,
  allowRoles(
    "SUPER_ADMIN",
    "ADMIN",
    "PRINCIPAL",
    "TEACHER"
  ),
  getExamsByClass
);

// ================= GET SINGLE EXAM =================
// SUPER_ADMIN, ADMIN, PRINCIPAL, TEACHER

router.get(
  "/:id",
  authMiddleware,
  allowRoles(
    "SUPER_ADMIN",
    "ADMIN",
    "PRINCIPAL",
    "TEACHER"
  ),
  getExamById
);

// ================= UPDATE EXAM =================
// SUPER_ADMIN, ADMIN, PRINCIPAL

router.put(
  "/:id",
  authMiddleware,
  allowRoles(
    "SUPER_ADMIN",
    "ADMIN",
    "PRINCIPAL"
  ),
  updateExam
);

// ================= DELETE EXAM =================
// SUPER_ADMIN, ADMIN, PRINCIPAL

router.delete(
  "/:id",
  authMiddleware,
  allowRoles(
    "SUPER_ADMIN",
    "ADMIN",
    "PRINCIPAL"
  ),
  deleteExam
);

module.exports = router;