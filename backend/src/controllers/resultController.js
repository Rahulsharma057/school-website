const mongoose = require("mongoose");

const Result = require("../models/Result");
const Exam = require("../models/Exam");
const TeacherAssignment = require("../models/TeacherAssignment");
const StudentProfile = require("../models/StudentProfile");
const ExcelJS = require("exceljs");

const asyncHandler = require("../helpers/asyncHandler");
const ApiResponse = require("../helpers/ApiResponse");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// =====================================================
// COMMON ERROR
// =====================================================

const createValidationError = (message) => {
  return Object.assign(new Error(message), {
    statusCode: 400,
  });
};

// =====================================================
// AUTHORIZATION
// =====================================================

const isTeacherAssignedToClass = async (teacherId, classId) => {
  if (!teacherId || !classId) {
    return false;
  }

  const assignment = await TeacherAssignment.findOne({
    teacher: teacherId,
    class: classId,
    status: "ACTIVE",
  }).select("_id");

  return !!assignment;
};

const authorizeExam = async (req, exam) => {
  // Admin / other authorized roles
  if (req.user.role !== "TEACHER") {
    return true;
  }

  return isTeacherAssignedToClass(req.user._id, exam.class);
};

// =====================================================
// SCHOOL EXAM CHECK
// =====================================================

const assertSchoolExam = (exam) => {
  if (exam.institutionType !== "SCHOOL" || !exam.class) {
    throw createValidationError(
      "This operation is only available for school class exams",
    );
  }
};

// =====================================================
// STUDENT CLASS VALIDATION
// =====================================================

const assertStudentBelongsToClass = async (studentId, classId) => {
  if (!studentId || !classId) {
    throw createValidationError("Student and class are required");
  }

  const student = await StudentProfile.findOne({
    user: studentId,
    class: classId,
    status: "ACTIVE",
  }).select("_id user class");

  if (!student) {
    throw createValidationError(
      "Student does not belong to this class or is not active",
    );
  }

  return student;
};

// =====================================================
// WEIGHTAGE HELPERS
// =====================================================

const getNormalizedComponentWeightages = (components = []) => {
  if (!Array.isArray(components) || !components.length) {
    return [];
  }

  const weights = components.map((component) =>
    Number(component.weightage ?? 0),
  );

  const total = weights.reduce((sum, weight) => sum + weight, 0);

  // No weightage -> equal distribution
  if (total <= 0) {
    const equalWeight = 100 / components.length;

    return components.map(() => equalWeight);
  }

  return weights.map((weight) => (weight / total) * 100);
};

const getNormalizedSubjectWeightages = (subjects = []) => {
  if (!Array.isArray(subjects) || !subjects.length) {
    return [];
  }

  const weights = subjects.map((subject) => Number(subject.weightage ?? 0));

  const total = weights.reduce((sum, weight) => sum + weight, 0);

  // No weightage -> equal distribution
  if (total <= 0) {
    const equalWeight = 100 / subjects.length;

    return subjects.map(() => equalWeight);
  }

  return weights.map((weight) => (weight / total) * 100);
};

// =====================================================
// VALIDATE EXAM CONFIGURATION
// =====================================================

const validateExamConfiguration = (exam) => {
  if (!exam.subjects || !Array.isArray(exam.subjects)) {
    throw createValidationError("Exam subjects are not configured");
  }

  if (!exam.subjects.length) {
    throw createValidationError("Exam must contain at least one subject");
  }

  const subjectIds = new Set();

  for (const subjectDef of exam.subjects) {
    if (!subjectDef.subject) {
      throw createValidationError("Invalid subject configuration in exam");
    }

    const subjectId = String(subjectDef.subject);

    const subjectName = subjectDef.subjectName || subjectId;

    // -------------------------------------------------
    // DUPLICATE SUBJECT
    // -------------------------------------------------

    if (subjectIds.has(subjectId)) {
      throw createValidationError(
        `Duplicate subject found in exam: ${subjectName}`,
      );
    }

    subjectIds.add(subjectId);

    // -------------------------------------------------
    // MAX MARKS
    // -------------------------------------------------

    const subjectMaxMarks = Number(subjectDef.maxMarks);

    if (!Number.isFinite(subjectMaxMarks) || subjectMaxMarks <= 0) {
      throw createValidationError(
        `Invalid maxMarks for subject "${subjectName}"`,
      );
    }

    // -------------------------------------------------
    // SUBJECT PASSING MARKS
    // -------------------------------------------------

    const subjectPassingMarks = Number(subjectDef.passingMarks ?? 0);

    if (
      !Number.isFinite(subjectPassingMarks) ||
      subjectPassingMarks < 0 ||
      subjectPassingMarks > subjectMaxMarks
    ) {
      throw createValidationError(
        `Invalid passingMarks for subject "${subjectName}"`,
      );
    }

    // -------------------------------------------------
    // SUBJECT WEIGHTAGE
    // -------------------------------------------------

    const subjectWeightage = Number(subjectDef.weightage ?? 0);

    if (
      !Number.isFinite(subjectWeightage) ||
      subjectWeightage < 0 ||
      subjectWeightage > 100
    ) {
      throw createValidationError(
        `Invalid weightage for subject "${subjectName}"`,
      );
    }

    // -------------------------------------------------
    // COMPONENT VALIDATION
    // -------------------------------------------------

    const components = Array.isArray(subjectDef.components)
      ? subjectDef.components
      : [];

    if (!components.length) {
      continue;
    }

    const componentNames = new Set();

    for (const component of components) {
      const componentName = String(component?.name || "").trim();

      if (!componentName) {
        throw createValidationError(
          `Component name is required for subject "${subjectName}"`,
        );
      }

      const componentKey = componentName.toLowerCase();

      if (componentNames.has(componentKey)) {
        throw createValidationError(
          `Duplicate component "${componentName}" in subject "${subjectName}"`,
        );
      }

      componentNames.add(componentKey);

      // -----------------------------------------------
      // COMPONENT MAX MARKS
      // -----------------------------------------------

      const maxMarks = Number(component.maxMarks);

      if (!Number.isFinite(maxMarks) || maxMarks <= 0) {
        throw createValidationError(
          `Invalid maxMarks for component "${componentName}" in "${subjectName}"`,
        );
      }

      // -----------------------------------------------
      // COMPONENT PASSING MARKS
      // -----------------------------------------------

      const passingMarks = Number(component.passingMarks ?? 0);

      if (
        !Number.isFinite(passingMarks) ||
        passingMarks < 0 ||
        passingMarks > maxMarks
      ) {
        throw createValidationError(
          `Invalid passingMarks for component "${componentName}" in "${subjectName}"`,
        );
      }

      // -----------------------------------------------
      // COMPONENT WEIGHTAGE
      // -----------------------------------------------

      const weightage = Number(component.weightage ?? 0);

      if (!Number.isFinite(weightage) || weightage < 0 || weightage > 100) {
        throw createValidationError(
          `Invalid weightage for component "${componentName}" in "${subjectName}"`,
        );
      }
    }
  }
};

// =====================================================
// OPTIONAL SUBJECT VALIDATION
// =====================================================

const validateOptionalSubjects = (exam, selectedOptionalSubjects = []) => {
  if (!Array.isArray(selectedOptionalSubjects)) {
    throw createValidationError("selectedOptionalSubjects must be an array");
  }

  const selected = selectedOptionalSubjects.map(String);

  // Duplicate selected subjects
  if (new Set(selected).size !== selected.length) {
    throw createValidationError("Duplicate optional subjects selected");
  }

  const subjectMap = new Map();

  for (const subject of exam.subjects) {
    subjectMap.set(String(subject.subject), subject);
  }

  const selectedSubjects = [];

  for (const subjectId of selected) {
    if (!isValidObjectId(subjectId)) {
      throw createValidationError(`Invalid optional subject ID: ${subjectId}`);
    }

    const subject = subjectMap.get(subjectId);

    if (!subject) {
      throw createValidationError(
        "Selected optional subject does not belong to this exam",
      );
    }

    if (subject.isOptional !== true) {
      throw createValidationError(
        `"${subject.subjectName}" is not an optional subject`,
      );
    }

    selectedSubjects.push(subject);
  }

  // ---------------------------------------------------
  // OPTIONAL GROUP RULE
  // ---------------------------------------------------

  const groups = new Map();

  for (const subject of selectedSubjects) {
    const group = String(subject.optionalGroup || "").trim();

    if (!group) {
      continue;
    }

    if (!groups.has(group)) {
      groups.set(group, []);
    }

    groups.get(group).push(subject);
  }

  for (const [group, subjects] of groups.entries()) {
    if (subjects.length > 1) {
      throw createValidationError(
        `Only one subject can be selected from optional group "${group}"`,
      );
    }
  }

  return selected;
};

// =====================================================
// INPUT MARK VALIDATION
// =====================================================
// =====================================================
// INPUT MARK VALIDATION
// =====================================================

const validateInputMarks = (exam, inputMarks = []) => {
  if (!Array.isArray(inputMarks)) {
    throw createValidationError("marks must be an array");
  }

  const subjectMap = new Map(
    exam.subjects.map((subject) => [
      String(subject.subject),
      subject,
    ]),
  );

  const seenSubjects = new Set();

  for (const mark of inputMarks) {
    if (!mark || !mark.subject) {
      throw createValidationError(
        "Each mark entry must contain a valid subject",
      );
    }

    const subjectId = String(mark.subject);

    if (!subjectMap.has(subjectId)) {
      throw createValidationError(
        `Subject "${subjectId}" does not belong to this exam`,
      );
    }

    if (seenSubjects.has(subjectId)) {
      throw createValidationError(
        `Duplicate marks entry found for subject "${subjectId}"`,
      );
    }

    seenSubjects.add(subjectId);

    const subjectDef = subjectMap.get(subjectId);

    // =================================================
    // STATUS
    // =================================================

    // Status optional hai.
    // Agar marks diye hain -> PRESENT
    // Agar explicitly ABSENT hai -> ABSENT
    const status =
      String(mark.status || "").toUpperCase() === "ABSENT"
        ? "ABSENT"
        : "PRESENT";

    // =================================================
    // SIMPLE SUBJECT
    // =================================================

    const components = Array.isArray(subjectDef.components)
      ? subjectDef.components
      : [];

    if (!components.length) {
      if (status === "ABSENT") {
        continue;
      }

      if (
        mark.marksObtained === undefined ||
        mark.marksObtained === null ||
        mark.marksObtained === ""
      ) {
        throw createValidationError(
          `Marks are required for subject "${subjectDef.subjectName}"`,
        );
      }

      const marks = Number(mark.marksObtained);
      const maxMarks = Number(subjectDef.maxMarks);

      if (
        !Number.isFinite(marks) ||
        marks < 0 ||
        marks > maxMarks
      ) {
        throw createValidationError(
          `Invalid marks for "${subjectDef.subjectName}" (max ${maxMarks})`,
        );
      }

      continue;
    }

    // =================================================
    // COMPONENT SUBJECT
    // =================================================

    const inputComponents = Array.isArray(mark.components)
      ? mark.components
      : [];

    const definedComponentMap = new Map();

    for (const component of components) {
      definedComponentMap.set(
        String(component.name).trim().toLowerCase(),
        component,
      );
    }

    const seenComponents = new Set();

    for (const enteredComponent of inputComponents) {
      const componentName = String(
        enteredComponent?.component || "",
      ).trim();

      if (!componentName) {
        throw createValidationError(
          `Invalid component in subject "${subjectDef.subjectName}"`,
        );
      }

      const componentKey = componentName.toLowerCase();

      if (!definedComponentMap.has(componentKey)) {
        throw createValidationError(
          `Component "${componentName}" does not belong to subject "${subjectDef.subjectName}"`,
        );
      }

      if (seenComponents.has(componentKey)) {
        throw createValidationError(
          `Duplicate component "${componentName}" in subject "${subjectDef.subjectName}"`,
        );
      }

      seenComponents.add(componentKey);

      const componentStatus =
        String(
          enteredComponent?.status || "",
        ).toUpperCase() === "ABSENT"
          ? "ABSENT"
          : "PRESENT";

      if (componentStatus === "ABSENT") {
        continue;
      }

      if (
        enteredComponent?.marksObtained === undefined ||
        enteredComponent?.marksObtained === null ||
        enteredComponent?.marksObtained === ""
      ) {
        throw createValidationError(
          `Marks are required for component "${componentName}" in subject "${subjectDef.subjectName}"`,
        );
      }

      const marks = Number(
        enteredComponent.marksObtained,
      );

      const maxMarks = Number(
        definedComponentMap.get(componentKey).maxMarks,
      );

      if (
        !Number.isFinite(marks) ||
        marks < 0 ||
        marks > maxMarks
      ) {
        throw createValidationError(
          `Invalid marks for component "${componentName}" in "${subjectDef.subjectName}" (max ${maxMarks})`,
        );
      }
    }
  }
};

// =====================================================
// CALCULATE RESULT
// =====================================================

const calculateResult = (
  exam,
  inputMarks = [],
  selectedOptionalSubjects = [],
) => {
  validateExamConfiguration(exam);

  const selectedOptional = validateOptionalSubjects(
    exam,
    selectedOptionalSubjects,
  );

  validateInputMarks(exam, inputMarks);

  const selectedOptionalSet = new Set(selectedOptional.map(String));

  const finalMarks = [];

  // ===================================================
  // SUBJECT LOOP
  // ===================================================

  for (const subjectDef of exam.subjects) {
    const subjectId = String(subjectDef.subject);

    const isOptional = subjectDef.isOptional === true;

    const selected = selectedOptionalSet.has(subjectId);

    // Optional subject not selected
    if (isOptional && !selected) {
      continue;
    }

    const entered = inputMarks.find(
      (item) => String(item.subject) === subjectId,
    );

    const status = entered?.status || "PRESENT";

    if (!["PRESENT", "ABSENT"].includes(status)) {
      throw createValidationError(
        `Invalid status for "${subjectDef.subjectName}"`,
      );
    }

    const definedComponents = Array.isArray(subjectDef.components)
      ? subjectDef.components
      : [];

    const componentResults = [];

    // =================================================
    // COMPONENT BASED SUBJECT
    // =================================================

    if (definedComponents.length > 0) {
      const enteredComponents = Array.isArray(entered?.components)
        ? entered.components
        : [];

      const enteredComponentMap = new Map();

      for (const item of enteredComponents) {
        enteredComponentMap.set(String(item.component).toLowerCase(), item);
      }

      for (const compDef of definedComponents) {
        const componentName = String(compDef.name);

        const componentKey = componentName.toLowerCase();

        const enteredComp = enteredComponentMap.get(componentKey);

        // ---------------------------------------------
        // ABSENT SUBJECT
        // ---------------------------------------------

        if (status === "ABSENT") {
          componentResults.push({
            component: componentName,
            marksObtained: 0,
            maxMarks: Number(compDef.maxMarks),
            passingMarks: Number(compDef.passingMarks || 0),
            weightage: Number(compDef.weightage || 0),
            status: "ABSENT",
          });

          continue;
        }

        // ---------------------------------------------
        // MISSING COMPONENT
        // ---------------------------------------------

        if (!enteredComp) {
          throw createValidationError(
            `Marks are missing for component "${componentName}" in subject "${subjectDef.subjectName}"`,
          );
        }

        // ---------------------------------------------
        // COMPONENT STATUS
        // ---------------------------------------------

        const componentStatus = enteredComp.status || "PRESENT";

        if (!["PRESENT", "ABSENT"].includes(componentStatus)) {
          throw createValidationError(
            `Invalid status for component "${componentName}" in "${subjectDef.subjectName}"`,
          );
        }

        // ---------------------------------------------
        // COMPONENT ABSENT
        // ---------------------------------------------

        if (componentStatus === "ABSENT") {
          componentResults.push({
            component: componentName,
            marksObtained: 0,
            maxMarks: Number(compDef.maxMarks),
            passingMarks: Number(compDef.passingMarks || 0),
            weightage: Number(compDef.weightage || 0),
            status: "ABSENT",
          });

          continue;
        }

        // ---------------------------------------------
        // MARKS REQUIRED
        // ---------------------------------------------

        if (
          enteredComp.marksObtained === undefined ||
          enteredComp.marksObtained === null ||
          enteredComp.marksObtained === ""
        ) {
          throw createValidationError(
            `Marks are required for component "${componentName}" in subject "${subjectDef.subjectName}"`,
          );
        }

        const marks = Number(enteredComp.marksObtained);

        const maxMarks = Number(compDef.maxMarks);

        if (!Number.isFinite(marks) || marks < 0 || marks > maxMarks) {
          throw createValidationError(
            `Invalid marks for component "${componentName}" in "${subjectDef.subjectName}" (max ${maxMarks})`,
          );
        }

        componentResults.push({
          component: componentName,
          marksObtained: marks,
          maxMarks,
          passingMarks: Number(compDef.passingMarks || 0),
          weightage: Number(compDef.weightage || 0),
          status: "PRESENT",
        });
      }
    }

    // =================================================
    // SUBJECT MARKS
    // =================================================

    let subjectObtained = 0;

    const subjectMax = Number(subjectDef.maxMarks);

    // -------------------------------------------------
    // ABSENT SUBJECT
    // -------------------------------------------------

    if (status === "ABSENT") {
      subjectObtained = 0;
    }

    // -------------------------------------------------
    // COMPONENT BASED SUBJECT
    // -------------------------------------------------
    else if (definedComponents.length > 0) {
      const normalizedWeights =
        getNormalizedComponentWeightages(definedComponents);

      const weightedPercentage = componentResults.reduce(
        (sum, component, index) => {
          if (component.status === "ABSENT") {
            return sum;
          }

          const componentPercentage =
            component.maxMarks > 0
              ? (component.marksObtained / component.maxMarks) * 100
              : 0;

          const weight = Number(normalizedWeights[index] || 0);

          return sum + componentPercentage * (weight / 100);
        },
        0,
      );

      subjectObtained = Number(
        ((weightedPercentage / 100) * subjectMax).toFixed(2),
      );
    }

    // -------------------------------------------------
    // SIMPLE SUBJECT
    // -------------------------------------------------
    else {
      if (
        !entered ||
        entered.marksObtained === undefined ||
        entered.marksObtained === null ||
        entered.marksObtained === ""
      ) {
        throw createValidationError(
          `Marks are missing for subject "${subjectDef.subjectName}"`,
        );
      }

      subjectObtained = Number(entered.marksObtained);

      if (
        !Number.isFinite(subjectObtained) ||
        subjectObtained < 0 ||
        subjectObtained > subjectMax
      ) {
        throw createValidationError(
          `Invalid marks for "${subjectDef.subjectName}" (max ${subjectMax})`,
        );
      }
    }

    // =================================================
    // SUBJECT PERCENTAGE
    // =================================================

    const subjectPercentage =
      subjectMax > 0
        ? Number(((subjectObtained / subjectMax) * 100).toFixed(2))
        : 0;

    // =================================================
    // SUBJECT STATUS
    // =================================================

    let subjectStatus;

    if (status === "ABSENT") {
      subjectStatus = "ABSENT";
    } else {
      const subjectFailed =
        Number(subjectDef.passingMarks || 0) > 0 &&
        subjectObtained < Number(subjectDef.passingMarks);

      const componentFailed = componentResults.some(
        (component) =>
          component.status !== "ABSENT" &&
          Number(component.passingMarks || 0) > 0 &&
          component.marksObtained < component.passingMarks,
      );

      const componentAbsent = componentResults.some(
        (component) => component.status === "ABSENT",
      );

      subjectStatus =
        subjectFailed || componentFailed || componentAbsent ? "FAIL" : "PASS";
    }

    // =================================================
    // SAVE MARK
    // =================================================

    finalMarks.push({
      subject: subjectDef.subject,
      subjectName: subjectDef.subjectName,
      subjectType: subjectDef.subjectType,
      optionalGroup: subjectDef.optionalGroup,
      components: componentResults,
      marksObtained: subjectObtained,
      maxMarks: subjectMax,
      passingMarks: Number(subjectDef.passingMarks || 0),
      percentage: subjectPercentage,
      status: subjectStatus,
    });
  }

  // =====================================================
  // TOTAL RAW MARKS
  // =====================================================

  const totalObtained = Number(
    finalMarks
      .reduce((sum, mark) => sum + Number(mark.marksObtained || 0), 0)
      .toFixed(2),
  );

  const totalMax = Number(
    finalMarks
      .reduce((sum, mark) => sum + Number(mark.maxMarks || 0), 0)
      .toFixed(2),
  );

  // =====================================================
  // FINAL PERCENTAGE
  // =====================================================

  let percentage = 0;

  if (exam.calculationMethod === "WEIGHTED") {
    // IMPORTANT:
    // Sirf selected/final subjects ko normalize
    // karna hai. Unselected optional subjects
    // ka weight include nahi hoga.

    const subjectsForCalculation = exam.subjects.filter((subject) => {
      const id = String(subject.subject);

      if (subject.isOptional === true) {
        return selectedOptionalSet.has(id);
      }

      return true;
    });

    const normalizedWeights = getNormalizedSubjectWeightages(
      subjectsForCalculation,
    );

    let weightedSum = 0;

    subjectsForCalculation.forEach((subject, index) => {
      const resultMark = finalMarks.find(
        (mark) => String(mark.subject) === String(subject.subject),
      );

      if (!resultMark) {
        return;
      }

      const weight = Number(normalizedWeights[index] || 0);

      weightedSum += Number(resultMark.percentage || 0) * (weight / 100);
    });

    percentage = Number(weightedSum.toFixed(2));
  } else {
    percentage =
      totalMax > 0 ? Number(((totalObtained / totalMax) * 100).toFixed(2)) : 0;
  }

  // =====================================================
  // FAILED SUBJECTS
  // =====================================================

  const failedSubjects = finalMarks
    .filter((mark) => mark.status === "FAIL" || mark.status === "ABSENT")
    .map((mark) => mark.subject);

  const overallStatus = failedSubjects.length > 0 ? "FAIL" : "PASS";

  return {
    marks: finalMarks,
    totalObtained,
    totalMax,
    percentage,
    failedSubjects,
    overallStatus,
  };
};

// =====================================================
// ENTER / UPDATE RESULT
// =====================================================

exports.enterResult = asyncHandler(async (req, res) => {
  const {
    examId,
    studentId,
    marks,
    selectedOptionalSubjects = [],
    remarks = "",
  } = req.body;

  // -------------------------------------------------
  // BASIC VALIDATION
  // -------------------------------------------------

  if (!examId || !isValidObjectId(examId)) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Valid examId is required"));
  }

  if (!studentId || !isValidObjectId(studentId)) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Valid studentId is required"));
  }

  if (!Array.isArray(marks)) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "marks must be an array"));
  }

  // -------------------------------------------------
  // EXAM
  // -------------------------------------------------

  const exam = await Exam.findById(examId);

  if (!exam) {
    return res.status(404).json(new ApiResponse(404, null, "Exam not found"));
  }

  // -------------------------------------------------
  // EXAM VALIDATION
  // -------------------------------------------------

  try {
    assertSchoolExam(exam);

    validateExamConfiguration(exam);

    await assertStudentBelongsToClass(studentId, exam.class);
  } catch (err) {
    return res
      .status(err.statusCode || 400)
      .json(new ApiResponse(err.statusCode || 400, null, err.message));
  }

  // -------------------------------------------------
  // LOCKED EXAM
  // -------------------------------------------------

  if (exam.status === "LOCKED") {
    return res
      .status(400)
      .json(
        new ApiResponse(
          400,
          null,
          "Exam is locked — results cannot be modified",
        ),
      );
  }

  // -------------------------------------------------
  // AUTHORIZATION
  // -------------------------------------------------

  const authorized = await authorizeExam(req, exam);

  if (!authorized) {
    return res
      .status(403)
      .json(new ApiResponse(403, null, "You are not assigned to this class"));
  }

  // -------------------------------------------------
  // CALCULATE
  // -------------------------------------------------

  let calculation;

  try {
    calculation = calculateResult(exam, marks, selectedOptionalSubjects);
  } catch (err) {
    return res
      .status(err.statusCode || 400)
      .json(new ApiResponse(err.statusCode || 400, null, err.message));
  }

  // -------------------------------------------------
  // SAVE / UPDATE
  // -------------------------------------------------

  const result = await Result.findOneAndUpdate(
    {
      exam: examId,
      student: studentId,
    },
    {
      $set: {
        exam: examId,
        student: studentId,
        class: exam.class,
        academicYear: exam.academicYear,
        periodName: exam.periodName,
        marks: calculation.marks,
        selectedOptionalSubjects,
        totalObtained: calculation.totalObtained,
        totalMax: calculation.totalMax,
        percentage: calculation.percentage,
        failedSubjects: calculation.failedSubjects,
        status: calculation.overallStatus,
        isFinal: exam.isFinal === true,
        remarks,
        updatedBy: req.user._id,
      },

      $setOnInsert: {
        enteredBy: req.user._id,
      },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
    },
  );

  return res.json(new ApiResponse(200, result, "Result saved successfully"));
});

// =====================================================
// GET MY RESULTS
// =====================================================

exports.getMyResults = asyncHandler(async (req, res) => {
  // -------------------------------------------------
  // STUDENT PROFILE
  // -------------------------------------------------

  const studentProfile = await StudentProfile.findOne({
    user: req.user._id,
    status: "ACTIVE",
  })
    .select("rollNumber fatherName")
    .lean();

  // -------------------------------------------------
  // RESULTS
  // -------------------------------------------------

  const results = await Result.find({
    student: req.user._id,
  })
    .populate(
      "exam",
      "examName academicYear examCategory term sequence weightage isFinal resultContribution",
    )
    .populate("class", "className section")
    .populate("marks.subject", "name code")
    .sort({
      createdAt: -1,
    })
    .lean();

  // -------------------------------------------------
  // RESPONSE
  // -------------------------------------------------

  const formattedResults = results.map((result) => ({
    ...result,

    student: {
      rollNumber: studentProfile?.rollNumber || "",
      fatherName: studentProfile?.fatherName || "",
    },
  }));

  return res.json(
    new ApiResponse(
      200,
      formattedResults,
      "Results fetched successfully",
    ),
  );
});

// =====================================================
// GET CLASS RESULTS
// =====================================================
exports.getClassResults = asyncHandler(async (req, res) => {
  const { examId } = req.params;

  if (!isValidObjectId(examId)) {
    return res.status(400).json(new ApiResponse(400, null, "Invalid exam ID"));
  }

  const exam = await Exam.findById(examId);

  if (!exam) {
    return res.status(404).json(new ApiResponse(404, null, "Exam not found"));
  }

  try {
    assertSchoolExam(exam);
  } catch (err) {
    return res
      .status(err.statusCode || 400)
      .json(new ApiResponse(err.statusCode || 400, null, err.message));
  }

  const authorized = await authorizeExam(req, exam);

  if (!authorized) {
    return res
      .status(403)
      .json(new ApiResponse(403, null, "You are not assigned to this class"));
  }

  try {
    const results = await Result.find({
      exam: examId,
    })
      .populate("student", "name email")
      .populate("marks.subject", "name code")
      .sort({
        percentage: -1,
      });

    const studentIds = results
      .map((result) => result.student?._id)
      .filter(Boolean);

    const studentProfiles = await StudentProfile.find({
      user: { $in: studentIds },
    })
      .select("user rollNumber fatherName")
      .lean();

    const profileMap = new Map(
      studentProfiles.map((profile) => [String(profile.user), profile]),
    );

    // =================================================
    // FIX: student ho sakta hai NULL agar referenced
    // User document delete ho chuka ho. Ab safe hai.
    // =================================================

    const formattedResults = results.map((result) => {
      const resultObj = result.toObject();

      const rawStudent = result.student;

      const studentIdForProfile = rawStudent?._id
        ? String(rawStudent._id)
        : String(resultObj.student || "");

      const profile = profileMap.get(studentIdForProfile);

      const studentData = rawStudent
        ? {
            ...rawStudent.toObject(),
            rollNumber: profile?.rollNumber || "",
            fatherName: profile?.fatherName || "",
          }
        : {
            _id: resultObj.student || null,
            name: "Unknown / Deleted Student",
            email: "",
            rollNumber: profile?.rollNumber || "",
            fatherName: profile?.fatherName || "",
          };

      return {
        ...resultObj,
        student: studentData,
      };
    });

    return res.json(
      new ApiResponse(
        200,
        formattedResults,
        "Class results fetched successfully",
      ),
    );
  } catch (err) {
    return res
      .status(err.statusCode || 500)
      .json(
        new ApiResponse(
          err.statusCode || 500,
          null,
          err.message || "Failed to fetch class results",
        ),
      );
  }
});

// =====================================================
// GET STUDENT ACADEMIC RESULT
// =====================================================

exports.getStudentAcademicResult = asyncHandler(async (req, res) => {
  const { studentId, academicYear } = req.query;

  const targetStudent = req.user.role === "STUDENT" ? req.user._id : studentId;

  if (!targetStudent || !isValidObjectId(targetStudent)) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Valid studentId is required"));
  }

  if (!academicYear) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "academicYear is required"));
  }

  const studentProfile = await StudentProfile.findOne({
    user: targetStudent,
    status: "ACTIVE",
  }).select("class");

  if (!studentProfile?.class) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Student class not found"));
  }

  const exams = await Exam.find({
    academicYear,
    institutionType: "SCHOOL",
    class: studentProfile.class,
  }).sort({
    sequence: 1,
    createdAt: 1,
  });

  const examIds = exams.map((exam) => exam._id);

  const results = await Result.find({
    student: targetStudent,
    class: studentProfile.class,
    academicYear,
    exam: {
      $in: examIds,
    },
  }).populate(
    "exam",
    "examName examCategory term sequence weightage isFinal resultContribution",
  );

  const examResults = results.map((result) => ({
    exam: result.exam,
    totalObtained: result.totalObtained,
    totalMax: result.totalMax,
    percentage: result.percentage,
    status: result.status,
  }));

  // -------------------------------------------------
  // FINAL ACADEMIC WEIGHTED PERCENTAGE
  // -------------------------------------------------

  let weightedTotal = 0;
  let totalWeight = 0;

  for (const result of results) {
    const exam = result.exam;

    if (!exam || exam.resultContribution === false) {
      continue;
    }

    const weight = Number(exam.weightage || 0);

    if (weight <= 0) {
      continue;
    }

    weightedTotal += Number(result.percentage || 0) * weight;

    totalWeight += weight;
  }

  const finalPercentage =
    totalWeight > 0 ? Number((weightedTotal / totalWeight).toFixed(2)) : 0;

  const failed = results.some((result) => result.status === "FAIL");

  return res.json(
    new ApiResponse(
      200,
      {
        academicYear,
        exams: examResults,
        finalPercentage,
        finalStatus: failed ? "FAIL" : "PASS",
      },
      "Academic result fetched successfully",
    ),
  );
});

// =====================================================
// DOWNLOAD EXCEL TEMPLATE
// =====================================================

exports.downloadResultTemplate = asyncHandler(async (req, res) => {
  const { examId } = req.params;

  if (!isValidObjectId(examId)) {
    return res.status(400).json(new ApiResponse(400, null, "Invalid exam ID"));
  }

  const exam = await Exam.findById(examId);

  if (!exam) {
    return res.status(404).json(new ApiResponse(404, null, "Exam not found"));
  }

  try {
    assertSchoolExam(exam);

    validateExamConfiguration(exam);
  } catch (err) {
    return res
      .status(err.statusCode || 400)
      .json(new ApiResponse(err.statusCode || 400, null, err.message));
  }

  const authorized = await authorizeExam(req, exam);

  if (!authorized) {
    return res
      .status(403)
      .json(new ApiResponse(403, null, "You are not assigned to this class"));
  }

  // -------------------------------------------------
  // STUDENTS
  // -------------------------------------------------

  const students = await StudentProfile.find({
    class: exam.class,
    status: "ACTIVE",
  })
    .populate("user", "name email")
    .sort({
      rollNumber: 1,
    });

  // -------------------------------------------------
  // EXISTING RESULTS
  // -------------------------------------------------

  const existingResults = await Result.find({
    exam: examId,
  });

  const resultMap = new Map(
    existingResults.map((result) => [String(result.student), result]),
  );

  // -------------------------------------------------
  // WORKBOOK
  // -------------------------------------------------

  const workbook = new ExcelJS.Workbook();

  const sheet = workbook.addWorksheet("Results");

  const columns = [
    {
      header: "Student ID",
      key: "studentId",
      width: 26,
    },
    {
      header: "Roll No",
      key: "rollNumber",
      width: 12,
    },
    {
      header: "Student Name",
      key: "studentName",
      width: 28,
    },
  ];

  const columnKeyFor = (subjectId, componentName) => {
    return `${subjectId}__${componentName}`;
  };

  // -------------------------------------------------
  // SUBJECT COLUMNS
  // -------------------------------------------------

  exam.subjects.forEach((subject) => {
    const subjectId = String(subject.subject);

    const components =
      Array.isArray(subject.components) && subject.components.length
        ? subject.components
        : [
            {
              name: "Marks",
              maxMarks: subject.maxMarks,
            },
          ];

    components.forEach((component) => {
      columns.push({
        header: `${subject.subjectName} - ${component.name} (max ${component.maxMarks})`,
        key: columnKeyFor(subjectId, component.name),
        width: 22,
      });
    });
  });

  sheet.columns = columns;

  // -------------------------------------------------
  // STUDENT ROWS
  // -------------------------------------------------

  students.forEach((student) => {
    const studentId = String(student.user?._id || "");

    const existing = resultMap.get(studentId);

    const row = {
      studentId,
      rollNumber: student.rollNumber || "",
      studentName: student.user?.name || "Unknown",
    };

    exam.subjects.forEach((subject) => {
      const subjectId = String(subject.subject);

      const existingSubjectMark = existing?.marks?.find(
        (mark) => String(mark.subject) === subjectId,
      );

      const components =
        Array.isArray(subject.components) && subject.components.length
          ? subject.components
          : [
              {
                name: "Marks",
              },
            ];

      components.forEach((component) => {
        const existingComponent = existingSubjectMark?.components?.find(
          (item) => String(item.component) === String(component.name),
        );

        row[columnKeyFor(subjectId, component.name)] = existingComponent
          ? existingComponent.marksObtained
          : "";
      });
    });

    sheet.addRow(row);
  });

  // -------------------------------------------------
  // HEADER STYLE
  // -------------------------------------------------

  const headerRow = sheet.getRow(1);

  headerRow.font = {
    bold: true,
    color: {
      argb: "FFFFFFFF",
    },
  };

  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF5B21B6",
    },
  };

  headerRow.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };

  headerRow.height = 35;

  // -------------------------------------------------
  // LOCK STUDENT ID / ROLL NO / NAME
  // -------------------------------------------------

  ["studentId", "rollNumber", "studentName"].forEach((key) => {
    sheet.getColumn(key).eachCell((cell, rowNumber) => {
      if (rowNumber > 1) {
        cell.protection = {
          locked: true,
        };

        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: {
            argb: "FFF3F0FF",
          },
        };
      }
    });
  });

  // -------------------------------------------------
  // UNLOCK MARK COLUMNS
  // -------------------------------------------------

  exam.subjects.forEach((subject) => {
    const subjectId = String(subject.subject);

    const components =
      Array.isArray(subject.components) && subject.components.length
        ? subject.components
        : [
            {
              name: "Marks",
            },
          ];

    components.forEach((component) => {
      const key = columnKeyFor(subjectId, component.name);

      sheet.getColumn(key).eachCell((cell, rowNumber) => {
        if (rowNumber > 1) {
          cell.protection = {
            locked: false,
          };
        }
      });
    });
  });

  // Excel sheet protection
  await sheet.protect("results", {
    selectLockedCells: true,
    selectUnlockedCells: true,
    formatCells: false,
    formatColumns: false,
    formatRows: false,
    insertColumns: false,
    insertRows: false,
    deleteColumns: false,
    deleteRows: false,
    sort: false,
    autoFilter: false,
  });

  // -------------------------------------------------
  // RESPONSE
  // -------------------------------------------------

  const safeExamName = String(exam.examName || "exam")
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "");

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${safeExamName}_template.xlsx"`,
  );

  await workbook.xlsx.write(res);

  return res.end();
});

// =====================================================
// BULK ENTER RESULTS
// =====================================================

exports.bulkEnterResults = asyncHandler(async (req, res) => {
  const { examId, records } = req.body;

  // -------------------------------------------------
  // BASIC VALIDATION
  // -------------------------------------------------

  if (
    !examId ||
    !isValidObjectId(examId) ||
    !Array.isArray(records) ||
    !records.length
  ) {
    return res
      .status(400)
      .json(
        new ApiResponse(400, null, "Valid examId and records are required"),
      );
  }

  // -------------------------------------------------
  // EXAM
  // -------------------------------------------------

  const exam = await Exam.findById(examId);

  if (!exam) {
    return res.status(404).json(new ApiResponse(404, null, "Exam not found"));
  }

  // -------------------------------------------------
  // VALIDATE EXAM
  // -------------------------------------------------

  try {
    assertSchoolExam(exam);

    validateExamConfiguration(exam);
  } catch (err) {
    return res
      .status(err.statusCode || 400)
      .json(new ApiResponse(err.statusCode || 400, null, err.message));
  }

  // -------------------------------------------------
  // LOCKED EXAM
  // -------------------------------------------------

  if (exam.status === "LOCKED") {
    return res
      .status(400)
      .json(
        new ApiResponse(
          400,
          null,
          "Exam is locked — results cannot be modified",
        ),
      );
  }

  // -------------------------------------------------
  // AUTHORIZATION
  // -------------------------------------------------

  const authorized = await authorizeExam(req, exam);

  if (!authorized) {
    return res
      .status(403)
      .json(new ApiResponse(403, null, "You are not assigned to this class"));
  }

  // -------------------------------------------------
  // CLASS STUDENTS
  // -------------------------------------------------

  const classStudents = await StudentProfile.find({
    class: exam.class,
    status: "ACTIVE",
  }).select("user");

  const validStudentIds = new Set(
    classStudents.map((student) => String(student.user)),
  );

  // -------------------------------------------------
  // BULK OPERATIONS
  // -------------------------------------------------

  const bulkOps = [];
  const skipped = [];

  const processedStudents = new Set();

  for (const record of records) {
    const {
      studentId,
      marks,
      selectedOptionalSubjects = [],
      remarks = "",
    } = record || {};

    // -----------------------------------------------
    // BASIC ROW VALIDATION
    // -----------------------------------------------

    if (!studentId || !isValidObjectId(studentId) || !Array.isArray(marks)) {
      skipped.push({
        studentId: studentId || "unknown",
        reason: "Invalid row",
      });

      continue;
    }

    const studentKey = String(studentId);

    // -----------------------------------------------
    // STUDENT CLASS
    // -----------------------------------------------

    if (!validStudentIds.has(studentKey)) {
      skipped.push({
        studentId,
        reason: "Student not found in this class",
      });

      continue;
    }

    // -----------------------------------------------
    // DUPLICATE STUDENT ROW
    // -----------------------------------------------

    if (processedStudents.has(studentKey)) {
      skipped.push({
        studentId,
        reason: "Duplicate student row",
      });

      continue;
    }

    processedStudents.add(studentKey);

    // -----------------------------------------------
    // CALCULATE
    // -----------------------------------------------

    let calculation;

    try {
      calculation = calculateResult(exam, marks, selectedOptionalSubjects);
    } catch (err) {
      skipped.push({
        studentId,
        reason: err.message,
      });

      continue;
    }

    // -----------------------------------------------
    // UPSERT
    // -----------------------------------------------

    bulkOps.push({
      updateOne: {
        filter: {
          exam: examId,
          student: studentId,
        },

        update: {
          $set: {
            exam: examId,
            student: studentId,
            class: exam.class,
            academicYear: exam.academicYear,
            periodName: exam.periodName,
            marks: calculation.marks,
            selectedOptionalSubjects,
            totalObtained: calculation.totalObtained,
            totalMax: calculation.totalMax,
            percentage: calculation.percentage,
            failedSubjects: calculation.failedSubjects,
            status: calculation.overallStatus,
            isFinal: exam.isFinal === true,
            remarks,
            updatedBy: req.user._id,
          },

          $setOnInsert: {
            enteredBy: req.user._id,
          },
        },

        upsert: true,
      },
    });
  }

  // -------------------------------------------------
  // WRITE
  // -------------------------------------------------

  let savedCount = 0;
  let insertedCount = 0;
  let modifiedCount = 0;

  if (bulkOps.length) {
    const bulkResult = await Result.bulkWrite(bulkOps, {
      ordered: false,
    });

    insertedCount = Number(bulkResult.upsertedCount || 0);

    modifiedCount = Number(bulkResult.modifiedCount || 0);

    savedCount = insertedCount + modifiedCount;
  }

  // -------------------------------------------------
  // RESPONSE
  // -------------------------------------------------

  return res.json(
    new ApiResponse(
      200,
      {
        savedCount,
        insertedCount,
        modifiedCount,
        skipped,
        totalRecords: records.length,
      },
      `${savedCount} result(s) imported successfully${
        skipped.length ? `, ${skipped.length} skipped` : ""
      }`,
    ),
  );
});
