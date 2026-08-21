const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const allowRoles = require("../middlewares/roleMiddleware");

const {
  enterResult,
  getMyResults,
  getClassResults,
  getStudentAcademicResult,
  downloadResultTemplate,
  bulkEnterResults,
} = require("../controllers/resultController");

// =====================================================
// ENTER / UPDATE SINGLE STUDENT RESULT
// =====================================================
// TEACHER -> assigned class only
// ADMIN / PRINCIPAL / SUPER_ADMIN -> any class

router.post(
  "/enter",
  authMiddleware,
  allowRoles(
    "TEACHER",
    "SUPER_ADMIN",
    "ADMIN",
    "PRINCIPAL"
  ),
  enterResult
);

// =====================================================
// GET MY RESULTS
// =====================================================
// STUDENT -> apne saare exam results

router.get(
  "/my-results",
  authMiddleware,
  allowRoles("STUDENT"),
  getMyResults
);

// =====================================================
// GET STUDENT ACADEMIC RESULT
// =====================================================
// Student -> apna yearly / semester combined result
//
// Staff -> kisi student ka result
//
// Example:
// GET /results/academic
// GET /results/academic?academicYear=2026-2027
//
// Staff:
// GET /results/academic?studentId=XXX&academicYear=2026-2027

router.get(
  "/academic",
  authMiddleware,
  allowRoles(
    "STUDENT",
    "TEACHER",
    "SUPER_ADMIN",
    "ADMIN",
    "PRINCIPAL"
  ),
  getStudentAcademicResult
);

// =====================================================
// GET CLASS RESULT FOR ONE EXAM
// =====================================================
// Example:
// GET /results/exam/:examId

router.get(
  "/exam/:examId",
  authMiddleware,
  allowRoles(
    "TEACHER",
    "SUPER_ADMIN",
    "ADMIN",
    "PRINCIPAL"
  ),
  getClassResults
);

// =====================================================
// DOWNLOAD EXCEL RESULT TEMPLATE
// =====================================================

router.get(
  "/template/:examId",
  authMiddleware,
  allowRoles(
    "TEACHER",
    "SUPER_ADMIN",
    "ADMIN",
    "PRINCIPAL"
  ),
  downloadResultTemplate
);

// =====================================================
// BULK IMPORT RESULTS
// =====================================================

router.post(
  "/bulk",
  authMiddleware,
  allowRoles(
    "TEACHER",
    "SUPER_ADMIN",
    "ADMIN",
    "PRINCIPAL"
  ),
  bulkEnterResults
);

module.exports = router;