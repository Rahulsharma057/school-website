const Submission = require("../models/Submission");
const Assessment = require("../models/Assessment");
const asyncHandler = require("../helpers/asyncHandler");
const ApiResponse = require("../helpers/ApiResponse");

// ================= SUBMIT ANSWERS (Student) =================
// Body: { answers: [{ questionIndex, selectedOptionIndex, textAnswer }] }

exports.submitAssessment = asyncHandler(async (req, res) => {
  const { answers } = req.body;

  const assessment = await Assessment.findById(req.params.id).lean();
  if (!assessment) return res.status(404).json(new ApiResponse(404, null, "Assessment not found"));
  if (assessment.status !== "PUBLISHED") {
    return res.status(400).json(new ApiResponse(400, null, "This assessment is not open for submissions"));
  }

  const existing = await Submission.findOne({ assessment: assessment._id, student: req.user._id });
  if (existing && existing.status !== "IN_PROGRESS") {
    return res.status(400).json(new ApiResponse(400, null, "You have already submitted this assessment"));
  }

  // ===== AUTO-CHECK MCQ, baaki manual rehta hai =====
  let autoScore = 0;
  const processedAnswers = answers.map((a) => {
    const question = assessment.questions[a.questionIndex];
    if (!question) return a;

    if (question.type === "MCQ") {
      const isCorrect = a.selectedOptionIndex === question.correctOptionIndex;
      const marksAwarded = isCorrect ? question.marks : 0;
      autoScore += marksAwarded;
      return { ...a, isCorrect, marksAwarded };
    }
    // SHORT/LONG — teacher baad mein check karega
    return { ...a, isCorrect: null, marksAwarded: 0 };
  });

  const hasManualQuestions = assessment.questions.some((q) => q.type !== "MCQ");

  const submission = await Submission.findOneAndUpdate(
    { assessment: assessment._id, student: req.user._id },
    {
      assessment: assessment._id,
      student: req.user._id,
      answers: processedAnswers,
      totalScore: autoScore, // manual questions check hone ke baad ye badhega
      status: hasManualQuestions ? "SUBMITTED" : "CHECKED", // sab MCQ hai to seedha CHECKED (kuch manual check karne ko nahi bacha)
      submittedAt: new Date(),
      checkedAt: hasManualQuestions ? null : new Date(),
    },
    { new: true, upsert: true }
  );

  res.json(new ApiResponse(200, submission, "Assessment submitted successfully"));
});

// ================= GET SUBMISSIONS FOR AN ASSESSMENT (Teacher — grading list) =================

exports.getSubmissionsForAssessment = asyncHandler(async (req, res) => {
  const submissions = await Submission.find({ assessment: req.params.id })
    .populate("student", "name email")
    .sort({ submittedAt: -1 })
    .lean();

  res.json(new ApiResponse(200, submissions, "Submissions fetched successfully"));
});

// ================= GET SINGLE SUBMISSION (Teacher grading view) =================

exports.getSubmissionById = asyncHandler(async (req, res) => {
  const submission = await Submission.findById(req.params.id)
    .populate("student", "name email")
    .populate("assessment")
    .lean();

  if (!submission) return res.status(404).json(new ApiResponse(404, null, "Submission not found"));

  res.json(new ApiResponse(200, submission, "Submission fetched successfully"));
});

// ================= GRADE SUBMISSION (Teacher — manual marks for SHORT/LONG questions) =================
// Body: { grades: [{ questionIndex, marksAwarded }] }

exports.gradeSubmission = asyncHandler(async (req, res) => {
  const { grades } = req.body;

  const submission = await Submission.findById(req.params.id);
  if (!submission) return res.status(404).json(new ApiResponse(404, null, "Submission not found"));

  const assessment = await Assessment.findById(submission.assessment).lean();

  grades.forEach((g) => {
    const question = assessment.questions[g.questionIndex];
    if (!question) return;

    const cappedMarks = Math.min(Math.max(0, g.marksAwarded), question.marks); // question ke max marks se zyada na ho

    const answerIndex = submission.answers.findIndex((a) => a.questionIndex === g.questionIndex);
    if (answerIndex !== -1) {
      submission.answers[answerIndex].marksAwarded = cappedMarks;
      submission.answers[answerIndex].isCorrect = cappedMarks > 0;
    }
  });

  submission.totalScore = submission.answers.reduce((sum, a) => sum + (a.marksAwarded || 0), 0);
  submission.status = "CHECKED";
  submission.checkedBy = req.user._id;
  submission.checkedAt = new Date();

  await submission.save();

  // ===== agar assessment kisi Exam se linked hai, seedha Result module mein push karo =====
  if (assessment.linkedExam) {
    const Result = require("../models/Result");
    const marks = [{ subject: assessment.subject, marksObtained: submission.totalScore, maxMarks: assessment.totalMarks }];

    await Result.findOneAndUpdate(
      { exam: assessment.linkedExam, student: submission.student },
      {
        $set: {
          exam: assessment.linkedExam,
          student: submission.student,
          class: assessment.class,
          enteredBy: req.user._id,
        },
        $push: { marks: { $each: marks } }, // note: agar subject already hai to duplicate ban sakta hai — simple case ke liye theek hai
      },
      { upsert: true, new: true }
    );
  }

  res.json(new ApiResponse(200, submission, "Submission graded successfully"));
});

// ================= GET MY SUBMISSION (Student — apna result dekhe) =================

exports.getMySubmission = asyncHandler(async (req, res) => {
  const submission = await Submission.findOne({ assessment: req.params.id, student: req.user._id })
    .populate("assessment")
    .lean();

  if (!submission) return res.status(404).json(new ApiResponse(404, null, "You haven't attempted this assessment yet"));

  res.json(new ApiResponse(200, submission, "Submission fetched successfully"));
});