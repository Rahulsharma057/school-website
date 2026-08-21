
const express = require("express");

const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const allowRoles = require("../middlewares/roleMiddleware");

const {
  createExam,
  getAllExams,
  getSchoolExams,
  getCollegeExams,
  getExamById,
  updateExam,
  deleteExam,
  getCollegeSemesterStructure,
} = require("../controllers/examController");

/* =========================================================
   CREATE EXAM
   POST /api/v1/exams
========================================================= */

router.post(
  "/",
  authMiddleware,
  allowRoles(
    "SUPER_ADMIN",
    "ADMIN",
    "PRINCIPAL"
  ),
  createExam
);

/* =========================================================
   GET ALL EXAMS
   GET /api/v1/exams
========================================================= */

router.get(
  "/",
  authMiddleware,
  allowRoles(
    "SUPER_ADMIN",
    "ADMIN",
    "PRINCIPAL",
    "TEACHER"
  ),
  getAllExams
);

/* =========================================================
   SCHOOL EXAMS BY CLASS
   GET /api/v1/exams/school/class/:classId

   IMPORTANT:
   This route MUST come before /:id
========================================================= */

router.get(
  "/school/class/:classId",
  authMiddleware,
  allowRoles(
    "SUPER_ADMIN",
    "ADMIN",
    "PRINCIPAL",
    "TEACHER"
  ),
  getSchoolExams
);

/* =========================================================
   COLLEGE EXAMS BY PROGRAM + SEMESTER
   GET /api/v1/exams/college/:programId/semester/:semester
========================================================= */

router.get(
  "/college/:programId/semester/:semester",
  authMiddleware,
  allowRoles(
    "SUPER_ADMIN",
    "ADMIN",
    "PRINCIPAL",
    "TEACHER"
  ),
  getCollegeExams
);

/* =========================================================
   COLLEGE SEMESTER STRUCTURE
   GET /api/v1/exams/college/:programId/semesters
========================================================= */

router.get(
  "/college/:programId/semesters",
  authMiddleware,
  allowRoles(
    "SUPER_ADMIN",
    "ADMIN",
    "PRINCIPAL",
    "TEACHER"
  ),
  getCollegeSemesterStructure
);

/* =========================================================
   GET SINGLE EXAM
   GET /api/v1/exams/:id

   IMPORTANT:
   Keep this AFTER all specific GET routes.
========================================================= */

router.get(
  "/:id",
  authMiddleware,
  allowRoles(
    "SUPER_ADMIN",
    "ADMIN",
    "PRINCIPAL",
    "TEACHER"
  ),
  getExamById
);

/* =========================================================
   UPDATE EXAM
   PUT /api/v1/exams/:id
========================================================= */

router.put(
  "/:id",
  authMiddleware,
  allowRoles(
    "SUPER_ADMIN",
    "ADMIN",
    "PRINCIPAL"
  ),
  updateExam
);

/* =========================================================
   DELETE EXAM
   DELETE /api/v1/exams/:id
========================================================= */

router.delete(
  "/:id",
  authMiddleware,
  allowRoles(
    "SUPER_ADMIN",
    "ADMIN",
    "PRINCIPAL"
  ),
  deleteExam
);

module.exports = router;

