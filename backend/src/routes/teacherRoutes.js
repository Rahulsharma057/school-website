const express = require("express");
const router = express.Router();
const documentUpload = require("../middlewares/documentUpload");
const authMiddleware = require("../middlewares/authMiddleware");
const allowRoles = require("../middlewares/roleMiddleware");

const {
  createTeacher,
  getMyTeacherProfile,
  updateMyTeacherProfile,
  updateTeacherByAdmin,
  getAllTeachers,uploadTeacherAadhar,
  uploadMyTeacherProfilePhoto,
} = require("../controllers/teacherController");

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

// Teacher khud apni profile ke SELF_EDITABLE_FIELDS (phone, profilePhoto,
// bio, emergencyContact, address) update kar sakta hai.
router.patch(
  "/my-profile",
  authMiddleware,
  allowRoles("TEACHER"),
  updateMyTeacherProfile
);

router.get(
  "/",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL"),
  getAllTeachers
);

// ==========================
// UPDATE TEACHER (ADMIN-ONLY FIELDS) — Principal/Admin/SuperAdmin
// qualification, status, employeeId, joiningDate, experienceYears,
// subjects, classTeacherOf, leftReason, leftDate
// ==========================
router.patch(
  "/:teacherId",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL"),
  updateTeacherByAdmin
);

router.post(
  "/:teacherId/aadhar",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL"),
  documentUpload.single("file"),
  uploadTeacherAadhar
);
router.post(
  "/me/profile-photo",
  authMiddleware,
  allowRoles("TEACHER"),
  documentUpload.single("file"),
  uploadMyTeacherProfilePhoto
);
module.exports = router;
