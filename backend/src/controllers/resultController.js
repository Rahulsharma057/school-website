const Result = require("../models/Result");
const Exam = require("../models/Exam");
const TeacherAssignment = require("../models/TeacherAssignment");
const StudentProfile = require("../models/StudentProfile");
const ExcelJS = require("exceljs");
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

  if (req.user.role === "TEACHER") {
    const isAuthorized = await isTeacherAssignedToClass(req.user._id, exam.class);
    if (!isAuthorized) {
      return res.status(403).json(
        new ApiResponse(403, null, "You are not assigned to this class")
      );
    }
  }

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

// ================= DOWNLOAD RESULT TEMPLATE (EXCEL) =================
// Access: TEACHER (apni class ki), PRINCIPAL/ADMIN (kisi bhi class ki)
// GET /results/template/:examId

exports.downloadResultTemplate = asyncHandler(async (req, res) => {
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

  const students = await StudentProfile.find({ class: exam.class, status: "ACTIVE" })
    .populate("user", "name email")
    .sort({ rollNumber: 1 });

  const existingResults = await Result.find({ exam: examId });
  const resultMap = new Map(existingResults.map((r) => [String(r.student), r]));

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Results");

  const columns = [
    { header: "Student ID", key: "studentId", width: 26 },
    { header: "Roll No", key: "rollNumber", width: 12 },
    { header: "Student Name", key: "studentName", width: 28 },
  ];

  exam.subjects.forEach((s) => {
    columns.push({
      header: `${s.subject} (max ${s.maxMarks})`,
      key: s.subject,
      width: 22,
    });
  });

  sheet.columns = columns;

  students.forEach((stu) => {
    const studentId = String(stu.user?._id || "");
    const existing = resultMap.get(studentId);

    const row = {
      studentId,
      rollNumber: stu.rollNumber || "",
      studentName: stu.user?.name || "Unknown",
    };

    exam.subjects.forEach((s) => {
      const existingMark = existing?.marks.find((m) => m.subject === s.subject);
      row[s.subject] = existingMark ? existingMark.marksObtained : "";
    });

    sheet.addRow(row);
  });

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF5B21B6" },
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };

  ["studentId", "rollNumber"].forEach((key) => {
    sheet.getColumn(key).eachCell((cell, rowNumber) => {
      if (rowNumber > 1) {
        cell.protection = { locked: true };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F0FF" } };
      }
    });
  });

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${exam.examName.replace(/\s+/g, "_")}_template.xlsx"`
  );

  await workbook.xlsx.write(res);
  res.end();
});

// ================= BULK IMPORT RESULTS (from filled Excel) =================
// Access: TEACHER (apni class ki), PRINCIPAL/ADMIN (kisi bhi class ki)
// Body: { examId, records: [{ studentId, marks: [{ subject, marksObtained }] }] }

exports.bulkEnterResults = asyncHandler(async (req, res) => {
  const { examId, records } = req.body;

  if (!examId || !Array.isArray(records) || !records.length) {
    return res.status(400).json(
      new ApiResponse(400, null, "examId and records are required")
    );
  }

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

  const classStudentProfiles = await StudentProfile.find({ class: exam.class, status: "ACTIVE" }).select("user");
  const validStudentIds = new Set(classStudentProfiles.map((s) => String(s.user)));

  const bulkOps = [];
  const skipped = [];

  for (const record of records) {
    const { studentId, marks } = record;

    if (!studentId || !Array.isArray(marks)) {
      skipped.push({ studentId: studentId || "unknown", reason: "Invalid row" });
      continue;
    }

    if (!validStudentIds.has(String(studentId))) {
      skipped.push({ studentId, reason: "Student not found in this class" });
      continue;
    }

    const finalMarks = marks.map((m) => {
      const subjectDef = exam.subjects.find((s) => s.subject === m.subject);
      return {
        subject: m.subject,
        marksObtained: Number(m.marksObtained) || 0,
        maxMarks: subjectDef ? subjectDef.maxMarks : 0,
      };
    });

    const totalObtained = finalMarks.reduce((sum, m) => sum + m.marksObtained, 0);
    const totalMax = finalMarks.reduce((sum, m) => sum + m.maxMarks, 0);
    const percentage = totalMax > 0 ? Number(((totalObtained / totalMax) * 100).toFixed(2)) : 0;

    bulkOps.push({
      updateOne: {
        filter: { exam: examId, student: studentId },
        update: {
          $set: {
            exam: examId,
            student: studentId,
            class: exam.class,
            marks: finalMarks,
            totalObtained,
            totalMax,
            percentage,
            enteredBy: req.user._id,
          },
        },
        upsert: true,
      },
    });
  }

  let savedCount = 0;
  if (bulkOps.length) {
    const bulkResult = await Result.bulkWrite(bulkOps);
    savedCount =
      (bulkResult.upsertedCount || 0) +
      (bulkResult.modifiedCount || 0) +
      (bulkResult.matchedCount || 0);
  }

  res.json(
    new ApiResponse(
      200,
      { savedCount, skipped },
      `${savedCount} result(s) imported successfully${skipped.length ? `, ${skipped.length} skipped` : ""}`
    )
  );
});