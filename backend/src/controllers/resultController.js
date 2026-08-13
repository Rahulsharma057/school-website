const Result = require("../models/Result");
const Exam = require("../models/Exam");
const TeacherAssignment = require("../models/TeacherAssignment");
const asyncHandler = require("../helpers/asyncHandler");
const ApiResponse = require("../helpers/ApiResponse");

const isTeacherAssignedToClass = async (teacherId, classId) => {
  const assignment = await TeacherAssignment.findOne({
    teacher: teacherId,
    class: classId,
    status: "ACTIVE",
  });
  return !!assignment;
};

// ================= ENTER / UPDATE RESULT =================
// Access: TEACHER (apni class ki), PRINCIPAL/ADMIN (kisi bhi class ki)
// Body: { examId, studentId, marks: [{ subject, marksObtained }] }

exports.enterResult = asyncHandler(async (req, res) => {
  const { examId, studentId, marks } = req.body;

  const exam = await Exam.findById(examId);
  if (!exam) {
    return res.status(404).json(new ApiResponse(404, null, "Exam not found"));
  }

  // authorization — agar Teacher hai to apni class ki honi chahiye
  if (req.user.role === "TEACHER") {
    const isAuthorized = await isTeacherAssignedToClass(req.user._id, exam.class);
    if (!isAuthorized) {
      return res.status(403).json(
        new ApiResponse(403, null, "You are not assigned to this class")
      );
    }
  }

  // Step: har subject ka maxMarks Exam se match karke final marks array banao
  const finalMarks = marks.map((m) => {
    const subjectDef = exam.subjects.find((s) => s.subject === m.subject);
    return {
      subject: m.subject,
      marksObtained: m.marksObtained,
      maxMarks: subjectDef ? subjectDef.maxMarks : 0,
    };
  });

  const totalObtained = finalMarks.reduce((sum, m) => sum + m.marksObtained, 0);
  const totalMax = finalMarks.reduce((sum, m) => sum + m.maxMarks, 0);
  const percentage = totalMax > 0 ? Number(((totalObtained / totalMax) * 100).toFixed(2)) : 0;

  // upsert — pehle se ho to update, warna create
  const result = await Result.findOneAndUpdate(
    { exam: examId, student: studentId },
    {
      exam: examId,
      student: studentId,
      class: exam.class,
      marks: finalMarks,
      totalObtained,
      totalMax,
      percentage,
      enteredBy: req.user._id,
    },
    { new: true, upsert: true }
  );

  res.json(new ApiResponse(200, result, "Result saved successfully"));
});

// ================= GET MY RESULT (Student self) =================
// Access: STUDENT only

exports.getMyResults = asyncHandler(async (req, res) => {
  const results = await Result.find({ student: req.user._id })
    .populate("exam", "examName")
    .populate("class", "className section")
    .sort({ createdAt: -1 });

  res.json(new ApiResponse(200, results, "Results fetched successfully"));
});

// ================= GET CLASS RESULTS (exam-wise, staff view) =================
// Access: TEACHER (apni class), PRINCIPAL/ADMIN (koi bhi)

exports.getClassResults = asyncHandler(async (req, res) => {
  const { examId } = req.params;

  const exam = await Exam.findById(examId);
  if (!exam) {
    return res.status(404).json(new ApiResponse(404, null, "Exam not found"));
  }

  if (req.user.role === "TEACHER") {
    const isAuthorized = await isTeacherAssignedToClass(req.user._id, exam.class);
    if (!isAuthorized) {
      return res.status(403).json(
        new ApiResponse(403, null, "You are not assigned to this class")
      );
    }
  }

  const results = await Result.find({ exam: examId })
    .populate("student", "name email")
    .sort({ percentage: -1 });

  res.json(new ApiResponse(200, results, "Class results fetched successfully"));
});