const express = require("express");
const router = express.Router();

const {
  generateFinalResults,
  getClassFinalResults,
  getMyFinalResults,
  publishFinalResults,
  getFinalResultById,
  generateSchoolFinalResult,
} = require("../controllers/finalResultController");

const authMiddleware = require("../middlewares/authMiddleware");
const allowRoles = require("../middlewares/roleMiddleware");

// =====================================================
// SCHOOL FINAL RESULT GENERATE
// =====================================================
router.post(
  "/school/generate",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL", "TEACHER"),
  generateSchoolFinalResult,
);

// =====================================================
// NORMAL FINAL RESULT GENERATE
// =====================================================
router.post(
  "/generate",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL", "TEACHER"),
  generateFinalResults,
);

// =====================================================
// CLASS FINAL RESULTS
// =====================================================
router.get(
  "/class",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL", "TEACHER"),
  getClassFinalResults,
);

// =====================================================
// PUBLISH
// =====================================================
router.post(
  "/publish",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL"),
  publishFinalResults,
);

// =====================================================
// STUDENT OWN RESULTS
// =====================================================
router.get(
  "/my-results",
  authMiddleware,
  allowRoles("STUDENT"),
  getMyFinalResults,
);

// =====================================================
// SINGLE RESULT
// ALWAYS LAST
// =====================================================
router.get(
  "/:id",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL", "TEACHER", "STUDENT"),
  getFinalResultById,
);
module.exports = router;
