const express = require("express");
const router = express.Router();
const documentUpload = require("../middlewares/documentUpload");
const authMiddleware = require("../middlewares/authMiddleware");
const allowRoles = require("../middlewares/roleMiddleware");

const {
  createStudent,
  getMyProfile,
  updateMyProfile,
  updateStudentByAdmin,
  getStudentsByClass,uploadStudentAadhar, uploadMyProfilePhoto
} = require("../controllers/studentController");

// ==========================
// CREATE STUDENT — sirf Principal/Admin/SuperAdmin
// ==========================
router.post(
  "/",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL"),
  createStudent
);

// ==========================
// MY PROFILE — sirf STUDENT
// koi aur role hit kare to allowRoles yahin rok dega,
// controller ka code chalega hi nahi
// ==========================
router.get(
  "/my-profile",
  authMiddleware,
  allowRoles("STUDENT"),
  getMyProfile
);

// Student khud apni profile ke SELF_EDITABLE_FIELDS (phone, bloodGroup,
// profilePhoto, bio, emergencyContact, address) update kar sakta hai.
router.patch(
  "/my-profile",
  authMiddleware,
  allowRoles("STUDENT"),
  updateMyProfile
);

router.get(
  "/by-class/:classId",
  authMiddleware,
  allowRoles("TEACHER", "SUPER_ADMIN", "ADMIN", "PRINCIPAL"),
  getStudentsByClass
);

// ==========================
// UPDATE STUDENT (ADMIN-ONLY FIELDS) — Principal/Admin/SuperAdmin
// class, rollNumber, status, admissionNumber, admissionDate,
// previousSchool, house, dateOfBirth, parent, leftReason, leftDate
// ==========================
router.patch(
  "/:studentId",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL"),
  updateStudentByAdmin
);


router.post(
  "/:studentId/aadhar",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL"),
  documentUpload.single("file"),
  uploadStudentAadhar
);


router.post(
  "/me/profile-photo",
  authMiddleware,
  allowRoles("STUDENT"),
  documentUpload.single("file"),
  uploadMyProfilePhoto
);  
module.exports = router;
