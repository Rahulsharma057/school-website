const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const allowRoles = require("../middlewares/roleMiddleware");

const {
  getClassStudentsForPromotion,
  getPromotionResult,
  bulkPromote,
  getStudentHistory,
} = require("../controllers/promotionController");

// =====================================================
// GET STUDENTS OF CLASS
// =====================================================
// Promotion screen ke liye students

router.get(
  "/class/:classId/students",
  authMiddleware,
  allowRoles(
    "SUPER_ADMIN",
    "ADMIN",
    "PRINCIPAL"
  ),
  getClassStudentsForPromotion
);

// =====================================================
// GET FINAL / COMBINED RESULT FOR PROMOTION
// =====================================================
// Example:
//
// GET /promotion/result?classId=XXX
//
// OR
//
// GET /promotion/result?classId=XXX&academicYear=2026-2027
//
// Ye exams ke weightage ke according
// final percentage + PASS/FAIL nikalega.

router.get(
  "/result",
  authMiddleware,
  allowRoles(
    "SUPER_ADMIN",
    "ADMIN",
    "PRINCIPAL"
  ),
  getPromotionResult
);

// =====================================================
// BULK PROMOTE
// =====================================================
// PROMOTED
// HOLD_BACK
// FAILED
// CONDITIONAL_PROMOTION
// GRADUATED

router.post(
  "/bulk-promote",
  authMiddleware,
  allowRoles(
    "SUPER_ADMIN",
    "ADMIN",
    "PRINCIPAL"
  ),
  bulkPromote
);

// =====================================================
// STUDENT OWN ACADEMIC HISTORY
// =====================================================

router.get(
  "/history/me",
  authMiddleware,
  allowRoles("STUDENT"),
  getStudentHistory
);

// =====================================================
// STAFF VIEW STUDENT ACADEMIC HISTORY
// =====================================================

router.get(
  "/history/:studentId",
  authMiddleware,
  allowRoles(
    "SUPER_ADMIN",
    "ADMIN",
    "PRINCIPAL",
    "TEACHER"
  ),
  getStudentHistory
);

module.exports = router;