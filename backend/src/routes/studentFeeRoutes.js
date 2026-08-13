const express = require("express");
const router = express.Router();

const {
  assignFeeToStudent,
  bulkAssignFeeToClass,
  getStudentFeeById,
  getMyFee,
  updateStudentFeeComponent,
  addCustomFeeComponent,
  removeCustomFeeComponent,
  getClassFeeSummary,
  getDueList,
  getStudentFeeByStudentId,
  getFeeDashboard,
} = require("../controllers/studentFeeController");

const authMiddleware = require("../middlewares/authMiddleware");
const allowRoles = require("../middlewares/roleMiddleware");

// STUDENT — self view. Registered before "/:id" so "me" is never
// mistaken for an :id.
router.get("/me", authMiddleware, allowRoles("STUDENT"), getMyFee);

// ADMIN — dashboards. Also before "/:id" for the same reason.
router.get(
  "/class-summary",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "ACCOUNTANT"),
  getClassFeeSummary,
);
router.get(
  "/due-list",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "ACCOUNTANT"),
  getDueList,
);
router.get(
  "/dashboard",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "ACCOUNTANT"),
  getFeeDashboard,
);

router.post(
  "/assign",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "ACCOUNTANT"),
  assignFeeToStudent,
);
router.post(
  "/bulk-assign",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "ACCOUNTANT"),
  bulkAssignFeeToClass,
);

router.get(
  "/:id",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "TEACHER"),
  getStudentFeeById,
);

router.patch(
  "/:id/component",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "ACCOUNTANT"),
  updateStudentFeeComponent,
);
router.post(
  "/:id/custom-component",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "ACCOUNTANT"),
  addCustomFeeComponent,
);
router.delete(
  "/:id/custom-component/:componentId",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "ACCOUNTANT"),
  removeCustomFeeComponent,
);
router.get(
  "/by-student/:studentId",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL", "TEACHER"),
  getStudentFeeByStudentId,
);

module.exports = router;
