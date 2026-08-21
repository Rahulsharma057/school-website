const mongoose = require("mongoose");

const FinalResult = require("../models/FinalResult");
const Result = require("../models/Result");
const Exam = require("../models/Exam");
const TeacherAssignment = require("../models/TeacherAssignment");
const Subject = require("../models/Subject");
const StudentProfile = require("../models/StudentProfile");

const asyncHandler = require("../helpers/asyncHandler");
const ApiResponse = require("../helpers/ApiResponse");

// =====================================================
// HELPERS
// =====================================================

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// =====================================================
// AUTHORIZATION
// =====================================================

const isTeacherAssignedToClass = async (teacherId, classId) => {
  if (!teacherId || !classId) return false;

  const assignment = await TeacherAssignment.findOne({
    teacher: teacherId,
    class: classId,
    status: "ACTIVE",
  });

  return !!assignment;
};

const authorizeClass = async (req, classId) => {
  if (req.user.role !== "TEACHER") {
    return true;
  }

  return isTeacherAssignedToClass(req.user._id, classId);
};

// =====================================================
// GRADE
// =====================================================

const getGrade = (percentage) => {
  const value = Number(percentage) || 0;

  if (value >= 90) return "A+";
  if (value >= 80) return "A";
  if (value >= 70) return "B+";
  if (value >= 60) return "B";
  if (value >= 50) return "C";
  if (value >= 40) return "D";

  return "F";
};

// =====================================================
// NORMALIZE EXAM IDS
// =====================================================

const normalizeExamIds = (examIds) => {
  if (!Array.isArray(examIds)) {
    return {
      valid: false,
      message: "examIds must be an array",
    };
  }

  if (!examIds.length) {
    return {
      valid: false,
      message: "At least one examId is required",
    };
  }

  const normalized = examIds.map(String);

  const invalidIds = normalized.filter((id) => !isValidObjectId(id));

  if (invalidIds.length) {
    return {
      valid: false,
      message: `Invalid exam ID: ${invalidIds[0]}`,
    };
  }

  const uniqueIds = [...new Set(normalized)];

  if (uniqueIds.length !== normalized.length) {
    return {
      valid: false,
      message: "Duplicate examIds are not allowed",
    };
  }

  return {
    valid: true,
    examIds: uniqueIds,
  };
};

// =====================================================
// VALIDATE SELECTED EXAMS
// =====================================================

const validateFinalExams = async ({ classId, academicYear, examIds }) => {
  const normalized = normalizeExamIds(examIds);

  if (!normalized.valid) {
    throw Object.assign(new Error(normalized.message), {
      statusCode: 400,
    });
  }

  const exams = await Exam.find({
    _id: {
      $in: normalized.examIds,
    },
  }).sort({
    sequence: 1,
    createdAt: 1,
  });

  // ---------------------------------------------------
  // ALL REQUESTED EXAMS MUST EXIST
  // ---------------------------------------------------

  if (exams.length !== normalized.examIds.length) {
    const foundIds = new Set(exams.map((exam) => String(exam._id)));

    const missingExamIds = normalized.examIds.filter((id) => !foundIds.has(id));

    throw Object.assign(
      new Error(
        `Some selected exams were not found: ${missingExamIds.join(", ")}`,
      ),
      {
        statusCode: 404,
      },
    );
  }

  // ---------------------------------------------------
  // SAME CLASS
  // ---------------------------------------------------

  const wrongClassExam = exams.find(
    (exam) => String(exam.class) !== String(classId),
  );

  if (wrongClassExam) {
    throw Object.assign(
      new Error(
        `Exam "${wrongClassExam.examName}" does not belong to selected class`,
      ),
      {
        statusCode: 400,
      },
    );
  }

  // ---------------------------------------------------
  // SAME ACADEMIC YEAR
  // ---------------------------------------------------

  const wrongAcademicYearExam = exams.find(
    (exam) => String(exam.academicYear) !== String(academicYear),
  );

  if (wrongAcademicYearExam) {
    throw Object.assign(
      new Error(
        `Exam "${wrongAcademicYearExam.examName}" does not belong to academic year ${academicYear}`,
      ),
      {
        statusCode: 400,
      },
    );
  }

  // ---------------------------------------------------
  // SCHOOL ONLY
  // ---------------------------------------------------

  const nonSchoolExam = exams.find(
    (exam) => exam.institutionType !== "SCHOOL" || !exam.class,
  );

  if (nonSchoolExam) {
    throw Object.assign(
      new Error(
        `Exam "${nonSchoolExam.examName}" is not a valid school class exam`,
      ),
      {
        statusCode: 400,
      },
    );
  }

  // ---------------------------------------------------
  // RESULT CONTRIBUTING EXAMS
  // ---------------------------------------------------

  const contributingExams = exams.filter(
    (exam) => exam.resultContribution !== false,
  );

  if (!contributingExams.length) {
    throw Object.assign(
      new Error("None of the selected exams contribute to the final result"),
      {
        statusCode: 400,
      },
    );
  }

  // ---------------------------------------------------
  // WEIGHTAGE VALIDATION
  // ---------------------------------------------------

  let totalWeightage = 0;

  for (const exam of contributingExams) {
    const weightage = Number(exam.weightage);

    if (!Number.isFinite(weightage) || weightage <= 0 || weightage > 100) {
      throw Object.assign(
        new Error(
          `Invalid weightage for exam "${exam.examName}". Weightage must be between 0 and 100`,
        ),
        {
          statusCode: 400,
        },
      );
    }

    totalWeightage += weightage;
  }

  totalWeightage = Number(totalWeightage.toFixed(2));

  if (totalWeightage !== 100) {
    throw Object.assign(
      new Error(
        `Final result exam weightage must total exactly 100%. Current total is ${totalWeightage}%`,
      ),
      {
        statusCode: 400,
      },
    );
  }

  return {
    exams,
    contributingExams,
    examIds: contributingExams.map((exam) => exam._id),
  };
};

// =====================================================
// ADD SUBJECT DETAILS
// =====================================================

const attachSubjectDetails = async (results) => {
  if (!results || !results.length) {
    return results;
  }

  const subjectIds = [];

  for (const result of results) {
    for (const subject of result.subjects || []) {
      if (subject.subject && isValidObjectId(subject.subject)) {
        subjectIds.push(String(subject.subject));
      }
    }
  }

  const uniqueSubjectIds = [...new Set(subjectIds)];

  if (!uniqueSubjectIds.length) {
    return results;
  }

  const subjects = await Subject.find({
    _id: {
      $in: uniqueSubjectIds,
    },
  })
    .select("_id name code level hasPractical status")
    .lean();

  const subjectMap = new Map(
    subjects.map((subject) => [String(subject._id), subject]),
  );

  for (const result of results) {
    if (!result.subjects) continue;

    result.subjects = result.subjects.map((item) => {
      const subjectId = String(item.subject);

      const subjectDetails = subjectMap.get(subjectId);

      return {
        ...item,

        subject: item.subject,

        subjectName: subjectDetails?.name || "Unknown Subject",

        subjectDetails: subjectDetails || null,
      };
    });
  }

  return results;
};

// =====================================================
// GET HALF YEARLY + ANNUAL EXAMS
// =====================================================

const getClassFinalExams = async ({ classId, academicYear }) => {
      console.log("========== FIND EXAMS ==========");
  console.log("classId:", classId);
  console.log("academicYear:", academicYear);
  const exams = await Exam.find({
    class: classId,
    academicYear,
    institutionType: "SCHOOL",
    resultContribution: {
      $ne: false,
    },
  })
    .sort({
      sequence: 1,
      createdAt: 1,
    })
    .lean();

  if (!exams.length) {
    throw Object.assign(
      new Error("No exams found for this class and academic year"),
      {
        statusCode: 404,
      },
    );
  }

  const halfYearly = exams.find((exam) =>
    String(exam.examCategory).toUpperCase().includes("HALF"),
  );

  const annual = exams.find((exam) =>
    String(exam.examCategory).toUpperCase().includes("ANNUAL"),
  );

  if (!halfYearly) {
    throw Object.assign(new Error("Half Yearly exam not found"), {
      statusCode: 404,
    });
  }

  if (!annual) {
    throw Object.assign(new Error("Annual exam not found"), {
      statusCode: 404,
    });
  }

  return {
    halfYearly,
    annual,
  };
};

// =====================================================
// AUTO GENERATE CLASS FINAL RESULT
// HALF YEARLY + ANNUAL
// =====================================================
exports.getClassFinalResults = asyncHandler(async (req, res) => {
  const { classId, academicYear } = req.query;

  console.log("========== GET CLASS FINAL RESULTS ==========");
  console.log("classId:", classId);
  console.log("academicYear:", academicYear);

  // =====================================================
  // VALIDATION
  // =====================================================

  if (!classId || !isValidObjectId(classId)) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Valid classId is required"));
  }

  if (!academicYear || !String(academicYear).trim()) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "academicYear is required"));
  }

  // =====================================================
  // AUTHORIZATION
  // =====================================================

  const authorized = await authorizeClass(req, classId);

  if (!authorized) {
    return res
      .status(403)
      .json(new ApiResponse(403, null, "You are not assigned to this class"));
  }

  // =====================================================
  // FINAL RESULTS
  // =====================================================

  let results = await FinalResult.find({
    class: classId,
    academicYear,
  })
    .populate("student", "name email rollNumber fatherName")
    .populate("class", "className section")
    .populate(
      "sourceExams",
      "examName examCategory weightage sequence"
    )
    .sort({
      percentage: -1,
      createdAt: 1,
    })
    .lean();

  // =====================================================
  // NO RESULTS
  // =====================================================

  if (!results.length) {
    return res.json(
      new ApiResponse(
        200,
        [],
        "No final results found for this class and academic year"
      )
    );
  }

  // =====================================================
  // STUDENT DETAILS
  // =====================================================

  results = await attachSubjectDetails(results);

  results = await attachStudentDetails(results);

  // =====================================================
  // SOURCE EXAM IDS
  // =====================================================

  const examIds = [
    ...new Set(
      results.flatMap((result) =>
        (result.sourceExams || []).map((exam) => String(exam._id))
      )
    ),
  ];

  const studentIds = results
    .map((result) => result.student?._id)
    .filter(Boolean);

  console.log("Exam IDs:", examIds);
  console.log("Student IDs:", studentIds);

  // =====================================================
  // FETCH ORIGINAL EXAM RESULTS
  // =====================================================

  let examResults = await Result.find({
    class: classId,
    student: { $in: studentIds },
    exam: { $in: examIds },
  })
    .populate(
      "exam",
      "examName examCategory weightage sequence"
    )
    .lean();

  console.log(
    "Original exam results found:",
    examResults.length
  );

  // =====================================================
  // IMPORTANT
  // POPULATE SUBJECT INSIDE MARKS
  // =====================================================
  //
  // Agar Result schema mein marks.subject ObjectId hai
  // aur Subject model reference hai, to ye populate chalega.
  //
  // Agar aapke schema mein field "subject" hai:
  //
  // marks.subject -> Subject document
  //
  // =====================================================

  try {
    examResults = await Result.populate(examResults, {
      path: "marks.subject",
      select: "name subjectName code",
    });
  } catch (populateError) {
    console.log(
      "Subject populate skipped:",
      populateError.message
    );
  }

  // =====================================================
  // GROUP EXAM RESULTS
  // =====================================================

  const examResultMap = new Map();

  for (const result of examResults) {
    const studentId = String(result.student);
    const examId = String(result.exam?._id);

    const key = `${studentId}_${examId}`;

    examResultMap.set(key, result);
  }

  // =====================================================
  // ATTACH EXAM-WISE MARKS
  // =====================================================

  results = results.map((finalResult) => {
    const studentId = String(finalResult.student?._id);

    const examWiseResults = (finalResult.sourceExams || []).map(
      (exam) => {
        const examId = String(exam._id);

        const originalResult = examResultMap.get(
          `${studentId}_${examId}`
        );

        // =================================================
        // CALCULATE EXAM TOTAL
        // =================================================

        let marksObtained = 0;
        let maxMarks = 0;

        if (originalResult) {
          for (const mark of originalResult.marks || []) {
            marksObtained += Number(mark.marksObtained) || 0;
            maxMarks += Number(mark.maxMarks) || 0;
          }
        }

        // =================================================
        // SUBJECT DETAILS
        // =================================================

        const subjects =
          originalResult?.marks?.map((mark) => {
            let subjectName = "Subject";

            // ---------------------------------------------
            // CASE 1: subject populated object
            // ---------------------------------------------

            if (
              mark.subject &&
              typeof mark.subject === "object"
            ) {
              subjectName =
                mark.subject.name ||
                mark.subject.subjectName ||
                mark.subject.title ||
                mark.subject.code ||
                "Subject";
            }

            // ---------------------------------------------
            // CASE 2: subject is already a string
            // ---------------------------------------------

            else if (
              typeof mark.subject === "string"
            ) {
              subjectName = mark.subject;
            }

            // ---------------------------------------------
            // CASE 3: subjectName directly exists
            // ---------------------------------------------

            else if (mark.subjectName) {
              subjectName = mark.subjectName;
            }

            return {
              subject: subjectName,

              subjectId:
                mark.subject?._id ||
                mark.subjectId ||
                null,

              marksObtained:
                Number(mark.marksObtained) || 0,

              maxMarks:
                Number(mark.maxMarks) || 0,

              grade:
                mark.grade || null,

              status:
                mark.status || "PASS",
            };
          }) || [];

        // =================================================
        // RETURN EXAM RESULT
        // =================================================

        return {
          examId: exam._id,
          examName: exam.examName,
          examCategory: exam.examCategory,
          weightage: exam.weightage,
          sequence: exam.sequence,

          subjects,

          marksObtained,
          maxMarks,

          percentage:
            maxMarks > 0
              ? Number(
                  (
                    (marksObtained / maxMarks) *
                    100
                  ).toFixed(2)
                )
              : 0,

          status:
            originalResult?.status || "—",
        };
      }
    );

    // =====================================================
    // FINAL RESULT OBJECT
    // =====================================================

    return {
      ...finalResult,

      examResults: examWiseResults,
    };
  });

  // =====================================================
  // RESPONSE
  // =====================================================

  console.log(
    "Final results prepared:",
    results.length
  );

  return res.json(
    new ApiResponse(
      200,
      results,
      "Class final results fetched successfully"
    )
  );
});
// =====================================================
// ADD STUDENT DETAILS
// =====================================================

const attachStudentDetails = async (results) => {
  if (!results || !results.length) {
    return results;
  }

  const studentIds = results
    .map((result) => result?.student?._id || result?.student)
    .filter((id) => id && isValidObjectId(id))
    .map(String);

  const uniqueStudentIds = [...new Set(studentIds)];

  if (!uniqueStudentIds.length) {
    return results;
  }

  const profiles = await StudentProfile.find({
    user: {
      $in: uniqueStudentIds,
    },
  })
    .select("user fatherName motherName rollNumber class")
    .lean();

  const profileMap = new Map(
    profiles.map((profile) => [String(profile.user), profile]),
  );

  return results.map((result) => {
    const studentId = String(result?.student?._id || result?.student);

    const profile = profileMap.get(studentId);

    const studentName = result?.student?.name || "Student";

    return {
      ...result,

      studentName,

      fatherName: profile?.fatherName || "—",

      rollNo: profile?.rollNumber || "—",

      studentProfile: profile || null,
    };
  });
};

// =====================================================
// GET CLASS FINAL RESULTS
// =====================================================

/* exports.getClassFinalResults = asyncHandler(async (req, res) => {
  const { classId, academicYear } = req.query;
console.log("========== GET CLASS FINAL RESULTS ==========");
  console.log("classId:", classId);
  console.log("academicYear:", academicYear);
  if (!classId || !isValidObjectId(classId)) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Valid classId is required"));
  }

  if (!academicYear || !String(academicYear).trim()) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "academicYear is required"));
  }

  const authorized = await authorizeClass(req, classId);

  if (!authorized) {
    return res
      .status(403)
      .json(new ApiResponse(403, null, "You are not assigned to this class"));
  }

  let results = await FinalResult.find({
    class: classId,
    academicYear,
  })
    .populate("student", "name email")
    .populate("class", "className section")
    .populate("sourceExams", "examName examCategory weightage sequence")
    .sort({
      percentage: -1,
      createdAt: 1,
    })
    .lean();

  results = await attachSubjectDetails(results);

  results = await attachStudentDetails(results);

  return res.json(
    new ApiResponse(200, results, "Class final results fetched successfully"),
  );
});
 */
// =====================================================
// GET MY FINAL RESULTS
// =====================================================

exports.getMyFinalResults = asyncHandler(async (req, res) => {
  let results = await FinalResult.find({
    student: req.user._id,

    isPublished: true,
  })
    .populate("student", "name email")
    .populate("class", "className section")
    .populate("sourceExams", "examName examCategory weightage sequence")
    .sort({
      createdAt: -1,
    })
    .lean();

  results = await attachSubjectDetails(results);

  results = await attachStudentDetails(results);

  return res.json(
    new ApiResponse(200, results, "Final results fetched successfully"),
  );
});

// =====================================================
// PUBLISH FINAL RESULTS
// =====================================================

exports.publishFinalResults = asyncHandler(async (req, res) => {
  const { classId, academicYear } = req.body;

  if (!classId || !isValidObjectId(classId)) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Valid classId is required"));
  }

  if (!academicYear || !String(academicYear).trim()) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "academicYear is required"));
  }

  const authorized = await authorizeClass(req, classId);

  if (!authorized) {
    return res
      .status(403)
      .json(new ApiResponse(403, null, "You are not assigned to this class"));
  }

  const existingCount = await FinalResult.countDocuments({
    class: classId,
    academicYear,
  });

  if (existingCount === 0) {
    return res
      .status(404)
      .json(
        new ApiResponse(
          404,
          null,
          "No final results found for this class and academic year",
        ),
      );
  }

  const result = await FinalResult.updateMany(
    {
      class: classId,
      academicYear,
    },
    {
      $set: {
        isPublished: true,
      },
    },
  );

  return res.json(
    new ApiResponse(
      200,
      {
        matchedCount: result.matchedCount || 0,

        modifiedCount: result.modifiedCount || 0,
      },
      "Final results published successfully",
    ),
  );
});

// =====================================================
// GET SINGLE FINAL RESULT
// =====================================================

exports.getFinalResultById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Invalid final result ID"));
  }

  let result = await FinalResult.findById(id)
    .populate("student", "name email")
    .populate("class", "className section")
    .populate(
      "sourceExams",
      "examName examCategory weightage sequence resultContribution",
    )
    .lean();

  if (!result) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Final result not found"));
  }

  if (req.user.role === "TEACHER" && result.class) {
    const authorized = await authorizeClass(req, result.class._id);

    if (!authorized) {
      return res
        .status(403)
        .json(new ApiResponse(403, null, "You are not assigned to this class"));
    }
  }

  const enriched = await attachSubjectDetails([result]);

  result = enriched[0];

  return res.json(
    new ApiResponse(200, result, "Final result fetched successfully"),
  );
});

// =====================================================
// EXISTING GENERATE FINAL RESULTS
// =====================================================

exports.generateFinalResults = asyncHandler(async (req, res) => {
  const { classId, academicYear } = req.body;

  if (!classId || !isValidObjectId(classId)) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Valid classId is required"));
  }

  if (!academicYear || !String(academicYear).trim()) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "academicYear is required"));
  }

  const authorized = await authorizeClass(req, classId);

  if (!authorized) {
    return res
      .status(403)
      .json(new ApiResponse(403, null, "You are not assigned to this class"));
  }

  let exams;

  try {
    exams = await getClassFinalExams({
      classId,
      academicYear,
    });
  } catch (error) {
    return res
      .status(error.statusCode || 400)
      .json(new ApiResponse(error.statusCode || 400, null, error.message));
  }

  let generated;

  try {
    generated = await generateClassWiseFinalResult({
      classId,
      academicYear,

      halfYearlyExam: exams.halfYearly,

      annualExam: exams.annual,

      generatedBy: req.user._id,
    });
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json(new ApiResponse(error.statusCode || 500, null, error.message));
  }

  return res.json(
    new ApiResponse(
      200,
      {
        ...generated,

        exams: {
          halfYearly: {
            id: exams.halfYearly._id,

            name: exams.halfYearly.examName,
          },

          annual: {
            id: exams.annual._id,

            name: exams.annual.examName,
          },
        },
      },
      `${generated.generatedCount} final result(s) generated successfully`,
    ),
  );
});

// =====================================================
// NEW SCHOOL FINAL RESULT FUNCTION
// =====================================================
// Format:
// Half Yearly + Annual
// School Class Final Result
// =====================================================

exports.generateSchoolFinalResult = asyncHandler(async (req, res) => {
  const { classId, academicYear } = req.body;

  console.log("========== SCHOOL FINAL RESULT ==========");
  console.log("classId:", classId);
  console.log("academicYear:", academicYear);

  // =====================================================
  // VALIDATION
  // =====================================================

  if (!classId || !isValidObjectId(classId)) {
    return res.status(400).json(
      new ApiResponse(
        400,
        null,
        "Valid classId is required"
      )
    );
  }

  if (!academicYear || !String(academicYear).trim()) {
    return res.status(400).json(
      new ApiResponse(
        400,
        null,
        "academicYear is required"
      )
    );
  }

  // =====================================================
  // AUTHORIZATION
  // =====================================================

  const authorized = await authorizeClass(req, classId);

  if (!authorized) {
    return res.status(403).json(
      new ApiResponse(
        403,
        null,
        "You are not assigned to this class"
      )
    );
  }

  // =====================================================
  // FIND HALF YEARLY + ANNUAL
  // =====================================================

  let exams;

  try {
    exams = await getClassFinalExams({
      classId,
      academicYear,
    });

    console.log("Half Yearly Exam:", {
      id: exams.halfYearly._id,
      name: exams.halfYearly.examName,
      category: exams.halfYearly.examCategory,
      weightage: exams.halfYearly.weightage,
    });

    console.log("Annual Exam:", {
      id: exams.annual._id,
      name: exams.annual.examName,
      category: exams.annual.examCategory,
      weightage: exams.annual.weightage,
    });
  } catch (error) {
    console.error(
      "Exam detection error:",
      error.message
    );

    return res.status(error.statusCode || 400).json(
      new ApiResponse(
        error.statusCode || 400,
        null,
        error.message
      )
    );
  }

  // =====================================================
  // GENERATE FINAL RESULT
  // =====================================================

  let generated;

  try {
    generated = await generateClassWiseFinalResult({
      classId,
      academicYear,

      halfYearlyExam: exams.halfYearly,
      annualExam: exams.annual,

      generatedBy: req.user._id,
    });

    console.log(
      "Generation Result:",
      generated
    );
  } catch (error) {
    console.error(
      "Final result generation error:",
      error.message
    );

    return res.status(error.statusCode || 500).json(
      new ApiResponse(
        error.statusCode || 500,
        null,
        error.message
      )
    );
  }

  // =====================================================
  // FETCH GENERATED FINAL RESULTS
  // =====================================================

  let finalResults = [];

  try {
    finalResults = await FinalResult.find({
      class: classId,
      academicYear,
      student: {
        $in: generated.studentIds,
      },
    })
      .populate("student", "name email")
      .populate("class", "className section")
      .populate(
        "sourceExams",
        "examName examCategory weightage sequence"
      )
      .lean();

    // Add subject names/details
    finalResults = await attachSubjectDetails(
      finalResults
    );

    // Add father name / roll number
    finalResults = await attachStudentDetails(
      finalResults
    );
  } catch (error) {
    console.error(
      "Final result fetch error:",
      error.message
    );

    return res.status(500).json(
      new ApiResponse(
        500,
        null,
        "Final results generated but could not be fetched"
      )
    );
  }

  // =====================================================
  // FETCH HALF YEARLY + ANNUAL RESULTS SEPARATELY
  // =====================================================

  let examResults = [];

  try {
    const sourceResults = await Result.find({
      class: classId,
      exam: {
        $in: [
          exams.halfYearly._id,
          exams.annual._id,
        ],
      },
      student: {
        $in: generated.studentIds,
      },
    })
      .lean();

    // ---------------------------------------------------
    // STUDENT-WISE GROUPING
    // ---------------------------------------------------

    const studentMap = new Map();

    for (const result of sourceResults) {
      const studentId = String(result.student);

      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, {
          halfYearly: null,
          annual: null,
        });
      }

      const studentData =
        studentMap.get(studentId);

      if (
        String(result.exam) ===
        String(exams.halfYearly._id)
      ) {
        studentData.halfYearly = result;
      }

      if (
        String(result.exam) ===
        String(exams.annual._id)
      ) {
        studentData.annual = result;
      }
    }

    // ---------------------------------------------------
    // BUILD SEPARATE EXAM RESPONSE
    // ---------------------------------------------------

    for (const [studentId, studentData] of studentMap.entries()) {
      const finalResult = finalResults.find(
        (result) =>
          String(
            result.student?._id || result.student
          ) === studentId
      );

      const student = finalResult?.student || null;

      const formatExamResult = (result, exam) => {
        if (!result) {
          return {
            examId: exam._id,
            examName: exam.examName,
            examCategory: exam.examCategory,
            weightage: exam.weightage,

            available: false,

            totalObtained: 0,
            totalMax: 0,
            percentage: 0,

            subjects: [],
          };
        }

        return {
          examId: exam._id,
          examName: exam.examName,
          examCategory: exam.examCategory,
          weightage: exam.weightage,

          available: true,

          totalObtained:
            Number(result.totalObtained) || 0,

          totalMax:
            Number(result.totalMax) || 0,

          percentage:
            Number(result.percentage) || 0,

          overallGrade:
            result.overallGrade || null,

          status:
            result.status || "PASS",

          subjects: (result.marks || []).map(
            (mark) => ({
              subject: mark.subject,

              marksObtained:
                Number(mark.marksObtained) || 0,

              maxMarks:
                Number(mark.maxMarks) || 0,

              grade:
                mark.grade || null,

              status:
                mark.status || "PASS",
            })
          ),
        };
      };

      examResults.push({
        studentId,

        studentName:
          student?.name || finalResult?.studentName || "Student",

        email:
          student?.email || null,

        fatherName:
          finalResult?.fatherName || "—",

        rollNo:
          finalResult?.rollNo || "—",

        exams: {
          halfYearly: formatExamResult(
            studentData.halfYearly,
            exams.halfYearly
          ),

          annual: formatExamResult(
            studentData.annual,
            exams.annual
          ),
        },

        // ---------------------------------------------
        // FINAL RESULT
        // ---------------------------------------------

        finalResult: finalResult
          ? {
              totalObtained:
                finalResult.totalObtained,

              totalMax:
                finalResult.totalMax,

              percentage:
                finalResult.percentage,

              overallGrade:
                finalResult.overallGrade,

              status:
                finalResult.status,
            }
          : null,
      });
    }
  } catch (error) {
    console.error(
      "Separate exam result fetch error:",
      error.message
    );

    return res.status(500).json(
      new ApiResponse(
        500,
        null,
        "Final results generated but exam-wise results could not be fetched"
      )
    );
  }

  // =====================================================
  // RESPONSE
  // =====================================================

  return res.json(
    new ApiResponse(
      200,
      {
        // ---------------------------------------------
        // GENERATION SUMMARY
        // ---------------------------------------------

        generatedCount:
          generated.generatedCount,

        studentIds:
          generated.studentIds,

        skippedStudents:
          generated.skippedStudents,

        upsertedCount:
          generated.upsertedCount || 0,

        modifiedCount:
          generated.modifiedCount || 0,

        // ---------------------------------------------
        // EXAM FORMAT
        // ---------------------------------------------

        examFormat:
          "HALF_YEARLY_AND_ANNUAL",

        exams: {
          halfYearly: {
            id: exams.halfYearly._id,
            name: exams.halfYearly.examName,
            category:
              exams.halfYearly.examCategory,
            weightage:
              exams.halfYearly.weightage,
          },

          annual: {
            id: exams.annual._id,
            name: exams.annual.examName,
            category:
              exams.annual.examCategory,
            weightage:
              exams.annual.weightage,
          },
        },

        // ---------------------------------------------
        // SEPARATE EXAM RESULTS
        // ---------------------------------------------

        examWiseResults: examResults,

        // ---------------------------------------------
        // FINAL GENERATED RESULTS
        // ---------------------------------------------

        finalResults,
      },

      `${generated.generatedCount} school final result(s) generated successfully`
    )
  );
});