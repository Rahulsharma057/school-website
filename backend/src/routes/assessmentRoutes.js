const express = require("express");
const router = express.Router();
const multer = require("multer");
const authMiddleware = require("../middlewares/authMiddleware");
const allowRoles = require("../middlewares/roleMiddleware");

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const {
  parseQuestionFile, createAssessment, updateAssessmentStatus,
  getMyAssessments, getAssessmentById, getMyClassAssessments,
} = require("../controllers/assessmentController");

const {
  submitAssessment, getSubmissionsForAssessment, getSubmissionById,
  gradeSubmission, getMySubmission,
} = require("../controllers/submissionController");

// TEACHER — creation
router.post("/parse-file", authMiddleware, allowRoles("TEACHER"), upload.single("file"), parseQuestionFile);
router.post("/", authMiddleware, allowRoles("TEACHER"), createAssessment);
router.patch("/:id/status", authMiddleware, allowRoles("TEACHER"), updateAssessmentStatus);
router.get("/my-assessments", authMiddleware, allowRoles("TEACHER"), getMyAssessments);

// STUDENT — attempt
router.get("/my-class-assessments", authMiddleware, allowRoles("STUDENT"), getMyClassAssessments);
router.post("/:id/submit", authMiddleware, allowRoles("STUDENT"), submitAssessment);
router.get("/:id/my-submission", authMiddleware, allowRoles("STUDENT"), getMySubmission);

// SHARED
router.get("/:id", authMiddleware, getAssessmentById);

// TEACHER — grading
router.get("/:id/submissions", authMiddleware, allowRoles("TEACHER"), getSubmissionsForAssessment);
router.get("/submissions/:id", authMiddleware, allowRoles("TEACHER"), getSubmissionById);
router.patch("/submissions/:id/grade", authMiddleware, allowRoles("TEACHER"), gradeSubmission);

module.exports = router;