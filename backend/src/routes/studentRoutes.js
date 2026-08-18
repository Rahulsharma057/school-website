const express = require("express");
const router = express.Router();

const documentUpload = require("../middlewares/documentUpload");
const authMiddleware = require("../middlewares/authMiddleware");
const allowRoles = require("../middlewares/roleMiddleware");

const {
  createStudent,
  getAllStudents,
  getMyProfile,
  updateMyProfile,
  updateStudentByAdmin,
  getStudentsByClass,
  getStudentById,
  deleteStudent,
  uploadStudentAadhar,
  uploadStudentDocument,
  deleteStudentDocument,
  downloadStudentProfileByAdmin,
  downloadMyProfile,
  uploadMyProfilePhoto,
  getMyDocuments,
  uploadMyDocument,
  deleteMyDocument,
  markStudentLeft,
  reactivateStudent,
  getLeftStudents,
} = require("../controllers/studentController");

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL"];

// =====================================================
// IMPORTANT — ROUTE ORDER
// Express matches routes top-to-bottom. Every literal path
// ("/my-profile", "/left", "/by-class/:classId", etc.) MUST be
// declared BEFORE the generic "/:studentId" routes at the bottom,
// otherwise Express treats the literal segment (e.g. "left") as a
// :studentId value and it never reaches the intended handler.
//
// FIX: the old code had "mark-left" / "reactivate" / "left" living
// in a *separate* router file, mounted independently from this one.
// If both routers ever ended up mounted on the same base path
// (e.g. both under "/api/students"), GET "/left" could get swallowed
// by GET "/:studentId" depending on mount order — a silent, hard-to-debug
// bug. Merging everything into a single router removes that risk entirely.
// =====================================================

// CREATE
router.post("/", authMiddleware, allowRoles(...ADMIN_ROLES), createStudent);

// LIST — FIX: was missing entirely; frontend already expected this
router.get("/", authMiddleware, allowRoles("TEACHER", ...ADMIN_ROLES), getAllStudents);

// =====================================================
// MY PROFILE (student self-service)
// =====================================================

router.get("/my-profile", authMiddleware, allowRoles("STUDENT"), getMyProfile);
router.patch("/my-profile", authMiddleware, allowRoles("STUDENT"), updateMyProfile);
router.get("/my-profile/download", authMiddleware, allowRoles("STUDENT"), downloadMyProfile);

// FIX: new — students can now view/add/remove their OWN documents
// (they can still only delete documents they themselves uploaded;
// see deleteMyDocument in the controller).
router.get("/my-profile/documents", authMiddleware, allowRoles("STUDENT"), getMyDocuments);
router.post(
  "/my-profile/documents",
  authMiddleware,
  allowRoles("STUDENT"),
  documentUpload.array("files", 5),
  uploadMyDocument,
);
router.delete(
  "/my-profile/documents/:documentId",
  authMiddleware,
  allowRoles("STUDENT"),
  deleteMyDocument,
);

router.post(
  "/me/profile-photo",
  authMiddleware,
  allowRoles("STUDENT"),
  documentUpload.single("file"),
  uploadMyProfilePhoto,
);

// =====================================================
// CLASS STUDENTS
// =====================================================

router.get(
  "/by-class/:classId",
  authMiddleware,
  allowRoles("TEACHER", ...ADMIN_ROLES),
  getStudentsByClass,
);

// =====================================================
// LEFT STUDENTS ARCHIVE — MUST be before "/:studentId"
// =====================================================

router.get("/left", authMiddleware, allowRoles(...ADMIN_ROLES), getLeftStudents);

// =====================================================
// LIFECYCLE (mark left / reactivate)
// Safe even below "/:studentId" since they have an extra path segment,
// but kept up here with the rest of the specific routes for clarity.
// =====================================================

router.patch("/:id/mark-left", authMiddleware, allowRoles(...ADMIN_ROLES), markStudentLeft);
router.patch("/:id/reactivate", authMiddleware, allowRoles(...ADMIN_ROLES), reactivateStudent);

// =====================================================
// DOWNLOAD — MUST be before "/:studentId"
// =====================================================

router.get(
  "/:studentId/download",
  authMiddleware,
  allowRoles(...ADMIN_ROLES),
  downloadStudentProfileByAdmin,
);

// =====================================================
// AADHAR
// =====================================================

router.post(
  "/:studentId/aadhar",
  authMiddleware,
  allowRoles(...ADMIN_ROLES),
  documentUpload.fields([
    { name: "aadharFront", maxCount: 1 },
    { name: "aadharBack", maxCount: 1 },
  ]),
  uploadStudentAadhar,
);

// =====================================================
// DOCUMENTS (admin managing a specific student's documents)
// =====================================================

router.post(
  "/:studentId/documents",
  authMiddleware,
  allowRoles(...ADMIN_ROLES),
  documentUpload.array("files", 5),
  uploadStudentDocument,
);

router.delete(
  "/:studentId/documents/:documentId",
  authMiddleware,
  allowRoles(...ADMIN_ROLES),
  deleteStudentDocument,
);

// =====================================================
// DELETE
// =====================================================

router.delete("/:studentId", authMiddleware, allowRoles(...ADMIN_ROLES), deleteStudent);

// =====================================================
// GET SINGLE
// =====================================================

router.get("/:studentId", authMiddleware, allowRoles(...ADMIN_ROLES), getStudentById);

// =====================================================
// UPDATE
// =====================================================

router.patch("/:studentId", authMiddleware, allowRoles(...ADMIN_ROLES), updateStudentByAdmin);

module.exports = router;
