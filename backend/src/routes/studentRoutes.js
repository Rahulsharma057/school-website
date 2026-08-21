const express = require("express");
const router = express.Router();

const documentUpload = require("../middlewares/documentUpload");
const studentExcelUpload = require("../middlewares/studentExcelUpload");

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

const {
  importStudents,
} = require("../controllers/studentImportController");

const {
  exportStudents,
} = require("../controllers/studentExportController");

const ADMIN_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "PRINCIPAL",
];

// =====================================================
// CREATE
// =====================================================

router.post(
  "/",
  authMiddleware,
  allowRoles(...ADMIN_ROLES),
  createStudent
);

// =====================================================
// IMPORT STUDENTS FROM EXCEL
// =====================================================

router.post(
  "/import",
  authMiddleware,
  allowRoles(...ADMIN_ROLES),
  studentExcelUpload.single("file"),
  importStudents
);

// =====================================================
// LIST
// =====================================================

router.get(
  "/",
  authMiddleware,
  allowRoles("TEACHER", ...ADMIN_ROLES),
  getAllStudents
);

// =====================================================
// EXPORT STUDENTS TO EXCEL
// =====================================================

router.get(
  "/export",
  authMiddleware,
  allowRoles(...ADMIN_ROLES),
  exportStudents
);

// =====================================================
// MY PROFILE
// =====================================================

router.get(
  "/my-profile",
  authMiddleware,
  allowRoles("STUDENT"),
  getMyProfile
);

router.patch(
  "/my-profile",
  authMiddleware,
  allowRoles("STUDENT"),
  updateMyProfile
);

router.get(
  "/my-profile/download",
  authMiddleware,
  allowRoles("STUDENT"),
  downloadMyProfile
);

router.get(
  "/my-profile/documents",
  authMiddleware,
  allowRoles("STUDENT"),
  getMyDocuments
);

router.post(
  "/my-profile/documents",
  authMiddleware,
  allowRoles("STUDENT"),
  documentUpload.array("files", 5),
  uploadMyDocument
);

router.delete(
  "/my-profile/documents/:documentId",
  authMiddleware,
  allowRoles("STUDENT"),
  deleteMyDocument
);

router.post(
  "/me/profile-photo",
  authMiddleware,
  allowRoles("STUDENT"),
  documentUpload.single("file"),
  uploadMyProfilePhoto
);

// =====================================================
// CLASS STUDENTS
// =====================================================

router.get(
  "/by-class/:classId",
  authMiddleware,
  allowRoles("TEACHER", ...ADMIN_ROLES),
  getStudentsByClass
);

// =====================================================
// LEFT STUDENTS
// =====================================================

router.get(
  "/left",
  authMiddleware,
  allowRoles(...ADMIN_ROLES),
  getLeftStudents
);

// =====================================================
// LIFECYCLE
// =====================================================

router.patch(
  "/:id/mark-left",
  authMiddleware,
  allowRoles(...ADMIN_ROLES),
  markStudentLeft
);

router.patch(
  "/:id/reactivate",
  authMiddleware,
  allowRoles(...ADMIN_ROLES),
  reactivateStudent
);

// =====================================================
// DOWNLOAD STUDENT PDF
// =====================================================

router.get(
  "/:studentId/download",
  authMiddleware,
  allowRoles(...ADMIN_ROLES),
  downloadStudentProfileByAdmin
);

// =====================================================
// AADHAR
// =====================================================

router.post(
  "/:studentId/aadhar",
  authMiddleware,
  allowRoles(...ADMIN_ROLES),
  documentUpload.fields([
    {
      name: "aadharFront",
      maxCount: 1,
    },
    {
      name: "aadharBack",
      maxCount: 1,
    },
  ]),
  uploadStudentAadhar
);

// =====================================================
// DOCUMENTS
// =====================================================

router.post(
  "/:studentId/documents",
  authMiddleware,
  allowRoles(...ADMIN_ROLES),
  documentUpload.array("files", 5),
  uploadStudentDocument
);

router.delete(
  "/:studentId/documents/:documentId",
  authMiddleware,
  allowRoles(...ADMIN_ROLES),
  deleteStudentDocument
);

// =====================================================
// DELETE
// =====================================================

router.delete(
  "/:studentId",
  authMiddleware,
  allowRoles(...ADMIN_ROLES),
  deleteStudent
);

// =====================================================
// GET SINGLE
// =====================================================

router.get(
  "/:studentId",
  authMiddleware,
  allowRoles(...ADMIN_ROLES),
  getStudentById
);

// =====================================================
// UPDATE
// =====================================================

router.patch(
  "/:studentId",
  authMiddleware,
  allowRoles(...ADMIN_ROLES),
  updateStudentByAdmin
);

module.exports = router;