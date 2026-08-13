const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const allowRoles = require("../middlewares/roleMiddleware");

const {
  markStudentLeft,
  reactivateStudent,
  getLeftStudents,
} = require("../controllers/studentLifecycleController");

router.patch(
  "/:id/mark-left",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL"),
  markStudentLeft
);

router.patch(
  "/:id/reactivate",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL"),
  reactivateStudent
);

router.get(
  "/left",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL"),
  getLeftStudents
);

module.exports = router;