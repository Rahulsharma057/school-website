const Exam = require("../models/Exam");
const asyncHandler = require("../helpers/asyncHandler");
const ApiResponse = require("../helpers/ApiResponse");

// ================= CREATE EXAM =================
// Access: SUPER_ADMIN, ADMIN, PRINCIPAL

exports.createExam = asyncHandler(async (req, res) => {
  const { examName, classId, subjects } = req.body;

  if (!examName || !examName.trim()) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Exam name is required"));
  }

  if (!classId) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Class is required"));
  }

  if (!Array.isArray(subjects) || subjects.length === 0) {
    return res.status(400).json(
      new ApiResponse(
        400,
        null,
        "At least one subject with maxMarks is required"
      )
    );
  }

  // Validate subjects
  for (const subject of subjects) {
    if (!subject.subject || !subject.subject.trim()) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Subject name is required"));
    }

    const maxMarks = Number(subject.maxMarks);

    if (
      Number.isNaN(maxMarks) ||
      maxMarks <= 0
    ) {
      return res.status(400).json(
        new ApiResponse(
          400,
          null,
          `Invalid maxMarks for subject "${subject.subject}"`
        )
      );
    }
  }

  const exam = await Exam.create({
    examName: examName.trim(),
    class: classId,
    subjects: subjects.map((s) => ({
      subject: s.subject.trim(),
      maxMarks: Number(s.maxMarks),
    })),
    createdBy: req.user._id,
  });

  res
    .status(201)
    .json(new ApiResponse(201, exam, "Exam created successfully"));
});

// ================= GET EXAMS BY CLASS =================

exports.getExamsByClass = asyncHandler(async (req, res) => {
  const { classId } = req.params;

  const exams = await Exam.find({
    class: classId,
  }).sort({ createdAt: -1 });

  res.json(
    new ApiResponse(200, exams, "Exams fetched successfully")
  );
});

// ================= GET SINGLE EXAM =================

exports.getExamById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const exam = await Exam.findById(id);

  if (!exam) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Exam not found"));
  }

  res.json(
    new ApiResponse(200, exam, "Exam fetched successfully")
  );
});

// ================= UPDATE EXAM =================
// Access: SUPER_ADMIN, ADMIN, PRINCIPAL

exports.updateExam = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { examName, classId, subjects } = req.body;

  // Find exam
  const exam = await Exam.findById(id);

  if (!exam) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Exam not found"));
  }

  // ================= VALIDATION =================

  if (examName !== undefined) {
    if (!examName || !examName.trim()) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Exam name is required"));
    }

    exam.examName = examName.trim();
  }

  if (classId !== undefined) {
    if (!classId) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Class is required"));
    }

    exam.class = classId;
  }

  if (subjects !== undefined) {
    if (!Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json(
        new ApiResponse(
          400,
          null,
          "At least one subject with maxMarks is required"
        )
      );
    }

    // Validate every subject
    for (const subject of subjects) {
      if (!subject.subject || !subject.subject.trim()) {
        return res.status(400).json(
          new ApiResponse(
            400,
            null,
            "Subject name is required"
          )
        );
      }

      const maxMarks = Number(subject.maxMarks);

      if (Number.isNaN(maxMarks) || maxMarks <= 0) {
        return res.status(400).json(
          new ApiResponse(
            400,
            null,
            `Invalid maxMarks for subject "${subject.subject}"`
          )
        );
      }
    }

    // Remove old _id from subjects if frontend sends it
    exam.subjects = subjects.map((s) => ({
      subject: s.subject.trim(),
      maxMarks: Number(s.maxMarks),
    }));
  }

  const updatedExam = await exam.save();

  res.json(
    new ApiResponse(
      200,
      updatedExam,
      "Exam updated successfully"
    )
  );
});

// ================= DELETE EXAM =================
// Access: SUPER_ADMIN, ADMIN, PRINCIPAL

exports.deleteExam = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const exam = await Exam.findById(id);

  if (!exam) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Exam not found"));
  }

  await Exam.findByIdAndDelete(id);

  res.json(
    new ApiResponse(200, null, "Exam deleted successfully")
  );
});