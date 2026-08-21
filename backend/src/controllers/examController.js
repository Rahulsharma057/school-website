const mongoose = require("mongoose");

const Exam = require("../models/Exam");
const asyncHandler = require("../helpers/asyncHandler");
const ApiResponse = require("../helpers/ApiResponse");

// =====================================================
// CONSTANTS
// =====================================================

const EXAM_CATEGORIES = [
  "PERIODIC_TEST", "UNIT_TEST", "INTERNAL", "MID_TERM", "MID_SEMESTER",
  "HALF_YEARLY", "PRE_ANNUAL", "ANNUAL", "END_SEMESTER", "PRACTICAL",
  "PROJECT", "ASSIGNMENT", "OTHER",
];

const SUBJECT_TYPES = ["COMPULSORY", "OPTIONAL", "ELECTIVE", "ADDITIONAL"];
const SYLLABUS_TYPES = ["FULL_SYLLABUS", "PARTIAL_SYLLABUS", "CUSTOM"];
const CALCULATION_METHODS = ["DIRECT_TOTAL", "WEIGHTED"];
const PASSING_TYPES = ["NONE", "PERCENTAGE", "MARKS"];
const EXAM_STATUSES = ["DRAFT", "OPEN", "PUBLISHED", "LOCKED"];

// FIX: PUBLISHED exam mein sirf ye fields change karne ki ijazat hai.
// Baaki sab (subjects, weightage, calculationMethod, isFinal, etc.)
// published hone ke baad structurally frozen rehne chahiye, warna
// pehle se generated result/marksheets data se mismatch ho jayega.
/* const EDITABLE_FIELDS_WHEN_PUBLISHED = new Set([
  "status", "startDate", "endDate", "examName", "examCode",
  "periodName", "syllabusDescription",
]); */

// =====================================================
// HELPERS
// =====================================================

const getAcademicYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  return month >= 3 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
};

const toNumber = (value, defaultValue = 0) => {
  if (value === undefined || value === null || value === "") return defaultValue;
  const number = Number(value);
  return Number.isFinite(number) ? number : NaN;
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const normalizeComponent = (component = {}) => ({
  name: String(component.name || "").trim(),
  maxMarks: toNumber(component.maxMarks, 0),
  passingMarks: toNumber(component.passingMarks, 0),
  weightage: toNumber(component.weightage, 0),
});

const normalizeSubject = (subject = {}) => {
  const components = Array.isArray(subject.components)
    ? subject.components.map(normalizeComponent)
    : [];

  const maxMarks = components.reduce((total, c) => total + Number(c.maxMarks || 0), 0);

  let passingMarks = toNumber(subject.passingMarks, 0);
  if (!Number.isFinite(passingMarks)) passingMarks = 0;
  if (passingMarks > maxMarks) passingMarks = maxMarks;

  let weightage = toNumber(subject.weightage, 100);
  if (!Number.isFinite(weightage)) weightage = 100;

  return {
    subject: subject.subject,
    subjectName: String(subject.subjectName || "").trim(),
    subjectCode: String(subject.subjectCode || "").trim().toUpperCase(),
    subjectType: subject.subjectType || "COMPULSORY",
    optionalGroup: subject.optionalGroup ? String(subject.optionalGroup).trim() : null,
    components,
    maxMarks,
    passingMarks,
    weightage,
    isOptional: Boolean(subject.isOptional),
  };
};

const validateComponents = (components, subjectName) => {
  if (!Array.isArray(components) || components.length === 0) {
    return `At least one component is required for "${subjectName}"`;
  }

  const names = new Set();

  for (const component of components) {
    const name = String(component?.name || "").trim();
    if (!name) return `Component name is required for "${subjectName}"`;

    const maxMarks = toNumber(component.maxMarks);
    if (!Number.isFinite(maxMarks) || maxMarks <= 0) {
      return `Invalid max marks for component "${name}" in "${subjectName}"`;
    }

    const passingMarks = toNumber(component.passingMarks, 0);
    if (!Number.isFinite(passingMarks) || passingMarks < 0) {
      return `Invalid passing marks for component "${name}"`;
    }
    if (passingMarks > maxMarks) {
      return `Passing marks cannot exceed max marks for component "${name}"`;
    }

    const weightage = toNumber(component.weightage, 0);
    if (!Number.isFinite(weightage) || weightage < 0 || weightage > 100) {
      return `Invalid weightage for component "${name}"`;
    }

    const key = name.toLowerCase();
    if (names.has(key)) return `Duplicate component "${name}" in "${subjectName}"`;
    names.add(key);
  }

  return "";
};

const validateSubjects = (subjects) => {
  if (!Array.isArray(subjects) || subjects.length === 0) {
    return "At least one subject is required";
  }

  const subjectIds = new Set();
  const subjectNames = new Set();
  const subjectCodes = new Set();

  for (const subject of subjects) {
    if (!subject?.subject || !isValidObjectId(subject.subject)) {
      return "Valid subject is required";
    }

    const subjectName = String(subject.subjectName || "").trim();
    if (!subjectName) return "Subject name is required";

    const subjectId = String(subject.subject);
    const lowerName = subjectName.toLowerCase();

    if (subjectIds.has(subjectId)) return `Duplicate subject "${subjectName}"`;
    if (subjectNames.has(lowerName)) return `Duplicate subject "${subjectName}"`;

    subjectIds.add(subjectId);
    subjectNames.add(lowerName);

    // FIX: subjectCode duplicate bhi ab check hota hai (pehle sirf
    // subject ID / name pe hi duplicate check tha, alag ID + naam
    // par same code slip ho sakta tha).
    const subjectCode = String(subject.subjectCode || "").trim().toUpperCase();
    if (subjectCode) {
      if (subjectCodes.has(subjectCode)) return `Duplicate subject code "${subjectCode}"`;
      subjectCodes.add(subjectCode);
    }

    const subjectType = subject.subjectType || "COMPULSORY";
    if (!SUBJECT_TYPES.includes(subjectType)) {
      return `Invalid subject type for "${subjectName}"`;
    }

    if (["OPTIONAL", "ELECTIVE"].includes(subjectType)) {
      if (!subject.optionalGroup || !String(subject.optionalGroup).trim()) {
        return `Optional group is required for "${subjectName}"`;
      }
    }

    const componentError = validateComponents(subject.components, subjectName);
    if (componentError) return componentError;

    const totalMarks = subject.components.reduce(
      (total, c) => total + toNumber(c?.maxMarks, 0), 0
    );
    if (totalMarks <= 0) return `Total marks must be greater than 0 for "${subjectName}"`;

    const passingMarks = toNumber(subject.passingMarks, 0);
    if (!Number.isFinite(passingMarks) || passingMarks < 0) {
      return `Invalid passing marks for "${subjectName}"`;
    }
    if (passingMarks > totalMarks) {
      return `Passing marks cannot exceed total marks for "${subjectName}"`;
    }

    const weightage = toNumber(subject.weightage, 100);
    if (!Number.isFinite(weightage) || weightage < 0 || weightage > 100) {
      return `Invalid weightage for "${subjectName}"`;
    }
  }

  return "";
};

const validateResultCombinationFields = ({ weightage, resultContribution, isFinal }) => {
  if (weightage !== undefined && weightage !== null) {
    const w = Number(weightage);
    if (!Number.isFinite(w) || w < 0 || w > 100) {
      return "weightage must be a number between 0 and 100";
    }
  }

  if (resultContribution !== undefined && typeof resultContribution !== "boolean") {
    return "resultContribution must be true or false";
  }

  if (isFinal !== undefined && typeof isFinal !== "boolean") {
    return "isFinal must be true or false";
  }

  return "";
};

// FIX: naya — same class/program + academicYear group ke andar
// dusre exams ke against isFinal aur weightage sum check karta hai.
// Pehle ye purely per-exam validate hota tha, isliye:
//   - do exams isFinal:true ho sakte the same year mein,
//   - resultContribution:true wale exams ka total weightage 100 se
//     zyada ho sakta tha.
// `excludeExamId` update ke waqt khud exam ko sibling list se hata deta hai.
const validateSiblingCombination = async ({
  institutionType, classId, programId, semester, academicYear,
  weightage, resultContribution, isFinal, excludeExamId,
}) => {
  const finalResultContribution = resultContribution !== undefined ? Boolean(resultContribution) : true;
  const finalWeightage = weightage !== undefined && weightage !== null ? Number(weightage) : 100;
  const finalIsFinal = Boolean(isFinal);

  // agar ye exam khud result mein contribute hi nahi karta, to
  // sibling weightage/isFinal check ki zaroorat nahi.
  if (!finalResultContribution && !finalIsFinal) return "";

  const siblingQuery = { institutionType, academicYear };
  if (institutionType === "SCHOOL") {
    siblingQuery.class = classId;
  } else {
    siblingQuery.program = programId;
    siblingQuery.semester = semester;
  }
  if (excludeExamId) siblingQuery._id = { $ne: excludeExamId };

  const siblings = await Exam.find(siblingQuery)
    .select("weightage resultContribution isFinal examName");

  if (finalIsFinal) {
    const otherFinal = siblings.find((s) => s.isFinal);
    if (otherFinal) {
      return `"${otherFinal.examName}" is already marked as the final exam for this academic year`;
    }
  }

  if (finalResultContribution) {
    const siblingWeightageTotal = siblings
      .filter((s) => s.resultContribution)
      .reduce((total, s) => total + Number(s.weightage || 0), 0);

    const combinedTotal = siblingWeightageTotal + finalWeightage;
    if (combinedTotal > 100) {
      return `Combined weightage of exams contributing to the final result cannot exceed 100 (currently ${combinedTotal})`;
    }
  }

  return "";
};

const validateExam = (data) => {
  const {
    examName, academicYear, institutionType, examCategory, classId, programId,
    semester, totalSemesters, passingPercentage, startDate, endDate,
    syllabusType, calculationMethod, passingType, status,
  } = data;

  if (!examName || !String(examName).trim()) return "Exam name is required";
  if (!academicYear || !String(academicYear).trim()) return "Academic year is required";

  if (!["SCHOOL", "COLLEGE"].includes(institutionType)) {
    return "Institution type must be SCHOOL or COLLEGE";
  }

  if (institutionType === "SCHOOL") {
    if (!classId) return "Class is required for school exam";
    if (!isValidObjectId(classId)) return "Invalid class ID";

    if (
      programId ||
      (semester !== undefined && semester !== null) ||
      (totalSemesters !== undefined && totalSemesters !== null)
    ) {
      return "Program and semester are not allowed for school exam";
    }
  }

  if (institutionType === "COLLEGE") {
    if (!programId) return "Program is required for college exam";
    if (!isValidObjectId(programId)) return "Invalid program ID";

    if (!Number.isInteger(Number(semester)) || Number(semester) < 1) {
      return "Valid semester is required for college exam";
    }
    if (!Number.isInteger(Number(totalSemesters)) || Number(totalSemesters) < 1) {
      return "Total semesters are required for college exam";
    }
    if (Number(semester) > Number(totalSemesters)) {
      return "Semester cannot be greater than total semesters";
    }
    if (classId) return "Class is not allowed for college exam";
  }

  if (examCategory && !EXAM_CATEGORIES.includes(examCategory)) return "Invalid exam category";
  if (syllabusType && !SYLLABUS_TYPES.includes(syllabusType)) return "Invalid syllabus type";
  if (calculationMethod && !CALCULATION_METHODS.includes(calculationMethod)) {
    return "Invalid calculation method";
  }
  if (passingType && !PASSING_TYPES.includes(passingType)) return "Invalid passing type";

  if (
    passingPercentage !== undefined && passingPercentage !== null &&
    (!Number.isFinite(Number(passingPercentage)) || Number(passingPercentage) < 0 || Number(passingPercentage) > 100)
  ) {
    return "Passing percentage must be between 0 and 100";
  }

  if (status && !EXAM_STATUSES.includes(status)) return "Invalid exam status";

  if (startDate) {
    const start = new Date(startDate);
    if (Number.isNaN(start.getTime())) return "Invalid start date";
  }
  if (endDate) {
    const end = new Date(endDate);
    if (Number.isNaN(end.getTime())) return "Invalid end date";
  }
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end < start) {
      return "End date cannot be before start date";
    }
  }

  return "";
};

// =====================================================
// CREATE EXAM
// =====================================================

exports.createExam = asyncHandler(async (req, res) => {
  const {
    examName, examCode, academicYear, institutionType,
    classId, programId, semester, totalSemesters,
    examCategory, periodName,
    syllabusType, syllabusDescription,
    subjects,
    calculationMethod, passingType, passingPercentage,
    status, startDate, endDate,
    weightage, resultContribution, isFinal,
  } = req.body;

  const resolvedAcademicYear = academicYear || getAcademicYear();

  const examError = validateExam({
    examName,
    academicYear: resolvedAcademicYear,
    institutionType, examCategory, classId, programId, semester, totalSemesters,
    passingPercentage, startDate, endDate, syllabusType, calculationMethod, passingType, status,
  });

  if (examError) return res.status(400).json(new ApiResponse(400, null, examError));

  const combinationError = validateResultCombinationFields({ weightage, resultContribution, isFinal });
  if (combinationError) return res.status(400).json(new ApiResponse(400, null, combinationError));

  // FIX: sibling exams (same class/program+semester+academicYear) ke
  // against isFinal aur weightage-sum check.
  const siblingError = await validateSiblingCombination({
    institutionType,
    classId: institutionType === "SCHOOL" ? classId : null,
    programId: institutionType === "COLLEGE" ? programId : null,
    semester: institutionType === "COLLEGE" ? Number(semester) : null,
    academicYear: resolvedAcademicYear,
    weightage, resultContribution, isFinal,
  });
  if (siblingError) return res.status(400).json(new ApiResponse(400, null, siblingError));

  const subjectError = validateSubjects(subjects);
  if (subjectError) return res.status(400).json(new ApiResponse(400, null, subjectError));

  const normalizedSubjects = subjects.map(normalizeSubject);

  const exam = await Exam.create({
    examName: String(examName).trim(),
    examCode: examCode ? String(examCode).trim().toUpperCase() : "",
    academicYear: String(resolvedAcademicYear).trim(),
    institutionType,
    class: institutionType === "SCHOOL" ? classId : null,
    program: institutionType === "COLLEGE" ? programId : null,
    semester: institutionType === "COLLEGE" ? Number(semester) : null,
    totalSemesters: institutionType === "COLLEGE" ? Number(totalSemesters) : null,
    examCategory: examCategory || "OTHER",
    periodName: periodName ? String(periodName).trim() : null,
    syllabusType: syllabusType || "FULL_SYLLABUS",
    syllabusDescription: syllabusDescription ? String(syllabusDescription).trim() : "",
    subjects: normalizedSubjects,
    calculationMethod: calculationMethod || "DIRECT_TOTAL",
    passingType: passingType || "NONE",
    passingPercentage: passingPercentage !== undefined ? Number(passingPercentage) : 0,
    weightage: weightage !== undefined ? Number(weightage) : 100,
    resultContribution: resultContribution !== undefined ? Boolean(resultContribution) : true,
    isFinal: isFinal !== undefined ? Boolean(isFinal) : false,
    status: status || "DRAFT",
    startDate: startDate || null,
    endDate: endDate || null,
    createdBy: req.user?._id || null,
  });

  return res.status(201).json(new ApiResponse(201, exam, "Exam created successfully"));
});

// =====================================================
// GET ALL EXAMS
// =====================================================

exports.getAllExams = asyncHandler(async (req, res) => {
  const { institutionType, academicYear, classId, programId, semester, examCategory, status, search } = req.query;

  const query = {};

  if (institutionType) query.institutionType = institutionType;
  if (typeof academicYear === "string") query.academicYear = academicYear;

  if (classId) {
    if (!isValidObjectId(classId)) return res.status(400).json(new ApiResponse(400, null, "Invalid class ID"));
    query.class = classId;
  }

  if (programId) {
    if (!isValidObjectId(programId)) return res.status(400).json(new ApiResponse(400, null, "Invalid program ID"));
    query.program = programId;
  }

  if (semester) {
    const semesterNumber = Number(semester);
    if (!Number.isInteger(semesterNumber) || semesterNumber < 1) {
      return res.status(400).json(new ApiResponse(400, null, "Invalid semester"));
    }
    query.semester = semesterNumber;
  }

  if (typeof examCategory === "string") query.examCategory = examCategory;
  if (typeof status === "string") query.status = status;

  if (typeof search === "string" && search.trim()) {
    const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    query.examName = { $regex: escaped, $options: "i" };
  }

  const exams = await Exam.find(query)
    .populate("class", "className section")
    .populate("program", "name code totalSemesters")
    .populate("createdBy", "name email")
    .sort({ academicYear: -1, semester: 1, startDate: 1, createdAt: -1 });

  return res.json(new ApiResponse(200, exams, "Exams fetched successfully"));
});

// =====================================================
// GET SCHOOL EXAMS
// =====================================================

exports.getSchoolExams = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  if (!isValidObjectId(classId)) return res.status(400).json(new ApiResponse(400, null, "Invalid class ID"));

  const { academicYear, examCategory, status } = req.query;
  const query = { institutionType: "SCHOOL", class: classId };

  if (typeof academicYear === "string") query.academicYear = academicYear;
  if (typeof examCategory === "string") query.examCategory = examCategory;
  if (typeof status === "string") query.status = status;

  const exams = await Exam.find(query)
    .populate("class", "className section")
    .sort({ sequence: 1, startDate: 1, createdAt: 1 });

  return res.json(new ApiResponse(200, exams, "School exams fetched successfully"));
});

// =====================================================
// GET COLLEGE EXAMS
// =====================================================

exports.getCollegeExams = asyncHandler(async (req, res) => {
  const { programId, semester } = req.params;
  if (!isValidObjectId(programId)) return res.status(400).json(new ApiResponse(400, null, "Invalid program ID"));

  const semesterNumber = Number(semester);
  if (!Number.isInteger(semesterNumber) || semesterNumber < 1) {
    return res.status(400).json(new ApiResponse(400, null, "Invalid semester"));
  }

  const { academicYear, examCategory, status } = req.query;
  const query = { institutionType: "COLLEGE", program: programId, semester: semesterNumber };

  if (typeof academicYear === "string") query.academicYear = academicYear;
  if (typeof examCategory === "string") query.examCategory = examCategory;
  if (typeof status === "string") query.status = status;

  const exams = await Exam.find(query)
    .populate("program", "name code totalSemesters")
    .sort({ sequence: 1, startDate: 1, createdAt: 1 });

  return res.json(new ApiResponse(200, exams, "College exams fetched successfully"));
});

// =====================================================
// GET SINGLE EXAM
// =====================================================

exports.getExamById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) return res.status(400).json(new ApiResponse(400, null, "Invalid exam ID"));

  const exam = await Exam.findById(id)
    .populate("class", "className section")
    .populate("program", "name code totalSemesters")
    .populate("createdBy", "name email")
    .populate("subjects.subject", "name code");

  if (!exam) return res.status(404).json(new ApiResponse(404, null, "Exam not found"));

  return res.json(new ApiResponse(200, exam, "Exam fetched successfully"));
});

// =====================================================
// UPDATE EXAM
// =====================================================

exports.updateExam = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) return res.status(400).json(new ApiResponse(400, null, "Invalid exam ID"));

  const exam = await Exam.findById(id);
  if (!exam) return res.status(404).json(new ApiResponse(404, null, "Exam not found"));

  if (exam.status === "LOCKED") {
    return res.status(400).json(new ApiResponse(400, null, "Locked exam cannot be updated"));
  }

  // FIX: PUBLISHED exam ke liye partial lock. Structural/marks-affecting
  // fields (subjects, weightage, calculationMethod, passingType,
  // passingPercentage, examCategory, syllabusType, institutionType,
  // class/program/semester, isFinal, resultContribution) ab published
  // hone ke baad edit nahi ho sakte — sirf status/dates/metadata allowed.
 /*  if (exam.status === "PUBLISHED") {
    const attemptedFields = Object.keys(req.body);
    const blockedFields = attemptedFields.filter(
      (field) => !EDITABLE_FIELDS_WHEN_PUBLISHED.has(field)
    );
    if (blockedFields.length > 0) {
      return res.status(400).json(new ApiResponse(
        400, null,
        `Published exam cannot be modified: ${blockedFields.join(", ")}. Only status, dates and basic details can be changed.`
      ));
    }
  } */

  const institutionType = req.body.institutionType ?? exam.institutionType;
  const classId = req.body.classId ?? (exam.class ? String(exam.class) : null);
  const programId = req.body.programId ?? (exam.program ? String(exam.program) : null);
  const semester = req.body.semester ?? exam.semester;
  const totalSemesters = req.body.totalSemesters ?? exam.totalSemesters;
  const examName = req.body.examName ?? exam.examName;
  const academicYear = req.body.academicYear ?? exam.academicYear;
  const examCategory = req.body.examCategory ?? exam.examCategory;

  const effectiveClassId = institutionType === "SCHOOL" ? classId : null;
  const effectiveProgramId = institutionType === "COLLEGE" ? programId : null;
  const effectiveSemester = institutionType === "COLLEGE" ? semester : null;
  const effectiveTotalSemesters = institutionType === "COLLEGE" ? totalSemesters : null;

  const validationData = {
    examName,
    academicYear,
    institutionType,
    examCategory,
    classId: effectiveClassId,
    programId: effectiveProgramId,
    semester: effectiveSemester,
    totalSemesters: effectiveTotalSemesters,
    passingPercentage: req.body.passingPercentage ?? exam.passingPercentage,
    startDate: req.body.startDate !== undefined ? req.body.startDate : exam.startDate,
    endDate: req.body.endDate !== undefined ? req.body.endDate : exam.endDate,
    syllabusType: req.body.syllabusType ?? exam.syllabusType,
    calculationMethod: req.body.calculationMethod ?? exam.calculationMethod,
    passingType: req.body.passingType ?? exam.passingType,
    status: req.body.status ?? exam.status,
  };

  const examError = validateExam(validationData);
  if (examError) return res.status(400).json(new ApiResponse(400, null, examError));

  const effectiveWeightage = req.body.weightage !== undefined ? req.body.weightage : exam.weightage;
  const effectiveResultContribution = req.body.resultContribution !== undefined
    ? req.body.resultContribution : exam.resultContribution;
  const effectiveIsFinal = req.body.isFinal !== undefined ? req.body.isFinal : exam.isFinal;

  const combinationError = validateResultCombinationFields({
    weightage: effectiveWeightage,
    resultContribution: effectiveResultContribution,
    isFinal: effectiveIsFinal,
  });
  if (combinationError) return res.status(400).json(new ApiResponse(400, null, combinationError));

  // FIX: update path pe bhi sibling exams ke against isFinal/weightage
  // check, khud exam ko excludeExamId se sibling list se hata ke.
  const siblingError = await validateSiblingCombination({
    institutionType,
    classId: effectiveClassId,
    programId: effectiveProgramId,
    semester: effectiveSemester,
    academicYear,
    weightage: effectiveWeightage,
    resultContribution: effectiveResultContribution,
    isFinal: effectiveIsFinal,
    excludeExamId: exam._id,
  });
  if (siblingError) return res.status(400).json(new ApiResponse(400, null, siblingError));

  if (req.body.examName !== undefined) exam.examName = String(req.body.examName).trim();
  if (req.body.examCode !== undefined) exam.examCode = String(req.body.examCode || "").trim().toUpperCase();
  if (req.body.academicYear !== undefined) exam.academicYear = String(req.body.academicYear).trim();

  if (req.body.institutionType !== undefined) {
    exam.institutionType = req.body.institutionType;
    if (exam.institutionType === "SCHOOL") {
      exam.program = null;
      exam.semester = null;
      exam.totalSemesters = null;
    }
    if (exam.institutionType === "COLLEGE") {
      exam.class = null;
    }
  }

  if (req.body.classId !== undefined) {
    exam.class = exam.institutionType === "SCHOOL" ? req.body.classId : null;
  }
  if (req.body.programId !== undefined) {
    exam.program = exam.institutionType === "COLLEGE" ? req.body.programId : null;
  }
  if (req.body.semester !== undefined) {
    exam.semester = exam.institutionType === "COLLEGE" ? Number(req.body.semester) : null;
  }
  if (req.body.totalSemesters !== undefined) {
    exam.totalSemesters = exam.institutionType === "COLLEGE" ? Number(req.body.totalSemesters) : null;
  }

  if (req.body.examCategory !== undefined) exam.examCategory = req.body.examCategory;
  if (req.body.periodName !== undefined) {
    exam.periodName = req.body.periodName ? String(req.body.periodName).trim() : null;
  }

  if (req.body.syllabusType !== undefined) exam.syllabusType = req.body.syllabusType;
  if (req.body.syllabusDescription !== undefined) {
    exam.syllabusDescription = req.body.syllabusDescription
      ? String(req.body.syllabusDescription).trim() : "";
  }

  if (req.body.subjects !== undefined) {
    const subjectError = validateSubjects(req.body.subjects);
    if (subjectError) return res.status(400).json(new ApiResponse(400, null, subjectError));
    exam.subjects = req.body.subjects.map(normalizeSubject);
  }

  if (req.body.calculationMethod !== undefined) exam.calculationMethod = req.body.calculationMethod;
  if (req.body.passingType !== undefined) exam.passingType = req.body.passingType;
  if (req.body.passingPercentage !== undefined) exam.passingPercentage = Number(req.body.passingPercentage);

  if (req.body.weightage !== undefined) exam.weightage = Number(req.body.weightage);
  if (req.body.resultContribution !== undefined) exam.resultContribution = Boolean(req.body.resultContribution);
  if (req.body.isFinal !== undefined) exam.isFinal = Boolean(req.body.isFinal);

  if (req.body.status !== undefined) exam.status = req.body.status;
  if (req.body.startDate !== undefined) exam.startDate = req.body.startDate || null;
  if (req.body.endDate !== undefined) exam.endDate = req.body.endDate || null;

  const updatedExam = await exam.save();

  return res.json(new ApiResponse(200, updatedExam, "Exam updated successfully"));
});

// =====================================================
// DELETE EXAM
// =====================================================

exports.deleteExam = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) return res.status(400).json(new ApiResponse(400, null, "Invalid exam ID"));

  const exam = await Exam.findById(id);
  if (!exam) return res.status(404).json(new ApiResponse(404, null, "Exam not found"));

  if (["PUBLISHED", "LOCKED"].includes(exam.status)) {
    return res.status(400).json(new ApiResponse(400, null, "Published or locked exam cannot be deleted"));
  }

  await Exam.findByIdAndDelete(id);

  return res.json(new ApiResponse(200, null, "Exam deleted successfully"));
});

// =====================================================
// GET COLLEGE SEMESTER STRUCTURE
// =====================================================

exports.getCollegeSemesterStructure = asyncHandler(async (req, res) => {
  const { programId } = req.params;
  if (!isValidObjectId(programId)) return res.status(400).json(new ApiResponse(400, null, "Invalid program ID"));

  const exams = await Exam.find({ institutionType: "COLLEGE", program: programId })
    .select("academicYear semester totalSemesters");

  if (!exams.length) {
    return res.json(new ApiResponse(200, { totalSemesters: 0, semesters: [] }, "No semester structure found"));
  }

  const totalSemesters = Math.max(...exams.map((e) => Number(e.totalSemesters) || 0));

  const semesters = Array.from({ length: totalSemesters }, (_, index) => ({
    semester: index + 1,
    name: `Semester ${index + 1}`,
  }));

  return res.json(new ApiResponse(200, { totalSemesters, semesters }, "Semester structure fetched successfully"));
});