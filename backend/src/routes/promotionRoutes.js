const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const allowRoles = require("../middlewares/roleMiddleware");

const {
  getClassStudentsForPromotion,
  bulkPromote,
  getStudentHistory,
} = require("../controllers/promotionController");

// ==========================
// GET students of a class (promotion screen ke liye)
// ==========================
router.get(
  "/class/:classId/students",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL"),
  getClassStudentsForPromotion
);

// ==========================
// BULK PROMOTE
// ==========================
router.post(
  "/bulk-promote",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL"),
  bulkPromote
);

// ==========================
// ACADEMIC HISTORY — student apna dekhe, staff kisi ka bhi
// ==========================
router.get(
  "/history/me",
  authMiddleware,
  allowRoles("STUDENT"),
  getStudentHistory
);

router.get(
  "/history/:studentId",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL", "TEACHER"),
  getStudentHistory
);

module.exports = router;