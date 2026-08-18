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
  getAllTeachers,
  getTeacherById,
  uploadTeacherDocument,
  uploadMyTeacherProfilePhoto,
} = require("../controllers/teacherController");

// ======================================================
// CREATE TEACHER
// SUPER_ADMIN / ADMIN / PRINCIPAL
// ======================================================

router.post(
  "/",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL"),
  createTeacher,
);

// ======================================================
// GET MY PROFILE
// TEACHER ONLY
// ======================================================

router.get(
  "/my-profile",
  authMiddleware,
  allowRoles("TEACHER"),
  getMyTeacherProfile,
);

// ======================================================
// UPDATE MY PROFILE
// TEACHER ONLY
// Only profilePhoto + bio
// ======================================================

router.patch(
  "/my-profile",
  authMiddleware,
  allowRoles("TEACHER"),
  updateMyTeacherProfile,
);

// ======================================================
// MY PROFILE PHOTO
// TEACHER ONLY
// ======================================================

router.post(
  "/me/profile-photo",
  authMiddleware,
  allowRoles("TEACHER"),
  documentUpload.single("file"),
  uploadMyTeacherProfilePhoto,
);

// ======================================================
// GET ALL TEACHERS
// SUPER_ADMIN / ADMIN / PRINCIPAL
// ======================================================

router.get(
  "/",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL"),
  getAllTeachers,
);

// ======================================================
// GET TEACHER BY ID
// ======================================================

router.get(
  "/:teacherId",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL"),
  getTeacherById,
);

// ======================================================
// UPDATE TEACHER
// SUPER_ADMIN / ADMIN / PRINCIPAL
// ======================================================

router.patch(
  "/:teacherId",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL"),
  updateTeacherByAdmin,
);

// ======================================================
// UPLOAD TEACHER DOCUMENT
// SUPER_ADMIN / ADMIN / PRINCIPAL
//
// FormData:
//
// file          -> actual file
//
// documentType:
// aadharCard
// panCard
// resume
// degreeCertificates
// experienceCertificates
// offerLetter
// joiningLetter
// appointmentLetter
// otherDocuments
//
// documentName -> required only for otherDocuments
// ======================================================

router.post(
  "/:teacherId/documents",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL"),
  documentUpload.single("file"),
  uploadTeacherDocument,
);

module.exports = router;
