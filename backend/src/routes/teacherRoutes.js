const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const allowRoles = require("../middlewares/roleMiddleware");

const {createTeacher, getMyTeacherProfile, getAllTeachers } = require("../controllers/teacherController");

router.post(
  "/",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL"),
  createTeacher
);

router.get(
  "/my-profile",
  authMiddleware,
  allowRoles("TEACHER"),
  getMyTeacherProfile
);


router.get(
  "/",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL"),
  getAllTeachers
);

module.exports = router;    