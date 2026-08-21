const express = require("express");
const router = express.Router();

const {
  assignTeacher,
  getMyAssignments,
  getAllAssignments,
  removeAssignment,  updateAssignment,
} = require("../controllers/teacherAssignmentController");

const authMiddleware = require("../middlewares/authMiddleware");
const allowRoles = require("../middlewares/roleMiddleware");

router.post(
  "/",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL"),
  assignTeacher,
);

router.get(
  "/my-assignments",
  authMiddleware,
  allowRoles("TEACHER"),
  getMyAssignments,
);

router.get(
  "/",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL"),
  getAllAssignments,
);

router.put(
  "/:id/remove",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL"),
  removeAssignment,
);


router.put(
  "/:id",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL"),
  updateAssignment,
);

module.exports = router;
