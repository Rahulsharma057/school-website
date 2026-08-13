const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const allowRoles = require("../middlewares/roleMiddleware");

const {
  assignTeacher,
  getMyAssignments,
  getAllAssignments,
  removeAssignment,
} = require("../controllers/teacherAssignmentController");

// ==========================
// ASSIGN teacher to class — Principal/Admin/SuperAdmin
// ==========================
router.post(
  "/",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL"),
  assignTeacher
);

// ==========================
// TEACHER — apni assigned classes dekhe
// ==========================
router.get(
  "/my-assignments",
  authMiddleware,
  allowRoles("TEACHER"),
  getMyAssignments
);

// ==========================
// ADMIN VIEW — saari assignments (filter ke saath)
// ==========================
router.get(
  "/",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL"),
  getAllAssignments
);

// ==========================
// REMOVE / DEACTIVATE assignment
// ==========================
router.patch(
  "/:id/remove",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL"),
  removeAssignment
);

module.exports = router;