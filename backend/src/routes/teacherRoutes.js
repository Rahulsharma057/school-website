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
  deleteTeacherDocument,
  getMyTeacherDocuments,
  uploadMyTeacherDocument,
  deleteMyTeacherDocument,
  uploadMyTeacherProfilePhoto,
} = require("../controllers/teacherController");

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL"];

// ======================================================
// CREATE TEACHER
// SUPER_ADMIN / ADMIN / PRINCIPAL
// ======================================================

router.post("/", authMiddleware, allowRoles(...ADMIN_ROLES), createTeacher);

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
// MY DOCUMENTS
// TEACHER ONLY
// FIX: was completely missing — see controller comment. Uploads always
// go into the otherDocuments bucket.
// ======================================================

router.get(
  "/my-profile/documents",
  authMiddleware,
  allowRoles("TEACHER"),
  getMyTeacherDocuments,
);

router.post(
  "/my-profile/documents",
  authMiddleware,
  allowRoles("TEACHER"),
  documentUpload.single("file"),
  uploadMyTeacherDocument,
);

router.delete(
  "/my-profile/documents/:documentId",
  authMiddleware,
  allowRoles("TEACHER"),
  deleteMyTeacherDocument,
);

// ======================================================
// GET ALL TEACHERS
// SUPER_ADMIN / ADMIN / PRINCIPAL
// ======================================================

router.get("/", authMiddleware, allowRoles(...ADMIN_ROLES), getAllTeachers);

// ======================================================
// GET TEACHER BY ID
// ======================================================

router.get(
  "/:teacherId",
  authMiddleware,
  allowRoles(...ADMIN_ROLES),
  getTeacherById,
);

// ======================================================
// UPDATE TEACHER
// SUPER_ADMIN / ADMIN / PRINCIPAL
// ======================================================

router.patch(
  "/:teacherId",
  authMiddleware,
  allowRoles(...ADMIN_ROLES),
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
  allowRoles(...ADMIN_ROLES),
  documentUpload.single("file"),
  uploadTeacherDocument,
);

// ======================================================
// DELETE TEACHER DOCUMENT
// SUPER_ADMIN / ADMIN / PRINCIPAL
// FIX: was completely missing — there was no way to remove a wrongly
// uploaded document. :documentId is required for the array-based types
// (degreeCertificates, experienceCertificates, otherDocuments) and
// ignored for the single-slot types.
// ======================================================

router.delete(
  "/:teacherId/documents/:documentType/:documentId",
  authMiddleware,
  allowRoles(...ADMIN_ROLES),
  deleteTeacherDocument,
);

router.delete(
  "/:teacherId/documents/:documentType",
  authMiddleware,
  allowRoles(...ADMIN_ROLES),
  deleteTeacherDocument,
);

module.exports = router;
