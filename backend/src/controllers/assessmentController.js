const Assessment = require("../models/Assessment");
const TeacherAssignment = require("../models/TeacherAssignment");
const { extractText, parseQuestions } = require("../utils/parseQuestionFile");
const asyncHandler = require("../helpers/asyncHandler");
const ApiResponse = require("../helpers/ApiResponse");

const isTeacherAssignedToClass = async (teacherId, classId) => {
  const a = await TeacherAssignment.findOne({ teacher: teacherId, class: classId, status: "ACTIVE" });
  return !!a;
};

// ================= PARSE UPLOADED FILE → PREVIEW QUESTIONS =================
// Access: TEACHER
// multipart/form-data: file

exports.parseQuestionFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json(new ApiResponse(400, null, "No file uploaded"));
  }

  const rawText = await extractText(req.file.buffer, req.file.mimetype);
  const questions = parseQuestions(rawText);

  if (questions.length === 0) {
    return res.status(400).json(
      new ApiResponse(400, null, "No questions could be detected. Please check the file format and try again.")
    );
  }

  res.json(new ApiResponse(200, { questions }, `${questions.length} questions extracted — review before saving`));
});

// ================= CREATE ASSESSMENT (manual or from parsed file) =================
// Access: TEACHER
// Body: { title, classId, subject, questions, durationMinutes, dueDate, status }

exports.createAssessment = asyncHandler(async (req, res) => {
  const { title, classId, subject, questions, durationMinutes, dueDate, status } = req.body;

  const isAuthorized = await isTeacherAssignedToClass(req.user._id, classId);
  if (!isAuthorized) {
    return res.status(403).json(new ApiResponse(403, null, "You are not assigned to this class"));
  }

  if (!questions || questions.length === 0) {
    return res.status(400).json(new ApiResponse(400, null, "At least one question is required"));
  }

  // MCQ validation — correct option di honi chahiye taaki auto-check ho sake
  for (const q of questions) {
    if (q.type === "MCQ" && (q.correctOptionIndex === null || q.correctOptionIndex === undefined)) {
      return res.status(400).json(new ApiResponse(400, null, `MCQ question "${q.text}" needs a correct answer marked`));
    }
  }

  const assessment = await Assessment.create({
    title,
    class: classId,
    subject,
    createdBy: req.user._id,
    questions,
    durationMinutes: durationMinutes || 30,
    dueDate: dueDate || null,
    status: status || "DRAFT",
  });

  res.status(201).json(new ApiResponse(201, assessment, "Assessment created successfully"));
});

// ================= PUBLISH / CLOSE ASSESSMENT =================
// Access: TEACHER (apna hi)

exports.updateAssessmentStatus = asyncHandler(async (req, res) => {
  const { status } = req.body; // PUBLISHED / CLOSED

  const assessment = await Assessment.findById(req.params.id);
  if (!assessment) return res.status(404).json(new ApiResponse(404, null, "Assessment not found"));

  if (String(assessment.createdBy) !== String(req.user._id)) {
    return res.status(403).json(new ApiResponse(403, null, "Not your assessment"));
  }

  assessment.status = status;
  await assessment.save();

  res.json(new ApiResponse(200, assessment, "Assessment status updated"));
});

// ================= GET MY ASSESSMENTS (Teacher) =================

exports.getMyAssessments = asyncHandler(async (req, res) => {
  const assessments = await Assessment.find({ createdBy: req.user._id })
    .populate("class", "className section")
    .sort({ createdAt: -1 })
    .lean();

  res.json(new ApiResponse(200, assessments, "Assessments fetched successfully"));
});

// ================= GET ASSESSMENT BY ID (Teacher: full with answers; Student: without correct answers) =================

exports.getAssessmentById = asyncHandler(async (req, res) => {
  const assessment = await Assessment.findById(req.params.id).populate("class", "className section").lean();
  if (!assessment) return res.status(404).json(new ApiResponse(404, null, "Assessment not found"));

  if (req.user.role === "STUDENT") {
    // student ko correct answers nahi dikhne chahiye
    assessment.questions = assessment.questions.map((q) => ({
      type: q.type,
      text: q.text,
      options: q.options,
      marks: q.marks,
      _id: q._id,
    }));
  }

  res.json(new ApiResponse(200, assessment, "Assessment fetched successfully"));
});

// ================= GET PUBLISHED ASSESSMENTS FOR STUDENT'S CLASS =================
// Access: STUDENT

exports.getMyClassAssessments = asyncHandler(async (req, res) => {
  const StudentProfile = require("../models/StudentProfile");
  const Submission = require("../models/Submission");

  const profile = await StudentProfile.findOne({ user: req.user._id }).lean();
  if (!profile) return res.status(404).json(new ApiResponse(404, null, "Student profile not found"));

  const assessments = await Assessment.find({ class: profile.class, status: { $in: ["PUBLISHED", "CLOSED"] } })
    .sort({ createdAt: -1 })
    .lean();

  const submissions = await Submission.find({ student: req.user._id }).select("assessment status totalScore").lean();
  const submissionMap = new Map(submissions.map((s) => [String(s.assessment), s]));

  const result = assessments.map((a) => ({
    ...a,
    mySubmission: submissionMap.get(String(a._id)) || null,
  }));

  res.json(new ApiResponse(200, result, "Assessments fetched successfully"));
});