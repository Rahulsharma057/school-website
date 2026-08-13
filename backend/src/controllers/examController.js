const Exam = require("../models/Exam");
const asyncHandler = require("../helpers/asyncHandler");
const ApiResponse = require("../helpers/ApiResponse");

// ================= CREATE EXAM =================
// Access: SUPER_ADMIN, ADMIN, PRINCIPAL

exports.createExam = asyncHandler(async (req, res) => {
  const { examName, classId, subjects } = req.body;

  if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
    return res.status(400).json(
      new ApiResponse(400, null, "At least one subject with maxMarks is required")
    );
  }

  const exam = await Exam.create({
    examName,
    class: classId,
    subjects,
    createdBy: req.user._id,
  });

  res.status(201).json(new ApiResponse(201, exam, "Exam created successfully"));
});

// ================= GET EXAMS BY CLASS =================

exports.getExamsByClass = asyncHandler(async (req, res) => {
  const { classId } = req.params;

  const exams = await Exam.find({ class: classId }).sort({ createdAt: -1 });

  res.json(new ApiResponse(200, exams, "Exams fetched successfully"));
});