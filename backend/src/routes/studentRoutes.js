const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const allowRoles = require("../middlewares/roleMiddleware");

const {  createStudent, getMyProfile, getStudentsByClass  } = require("../controllers/studentController");

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
router.get(
  "/by-class/:classId",
  authMiddleware,
  allowRoles("TEACHER", "SUPER_ADMIN", "ADMIN", "PRINCIPAL"),
  getStudentsByClass
);

module.exports = router;