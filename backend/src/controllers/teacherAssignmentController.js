const TeacherAssignment = require("../models/TeacherAssignment");
const Class = require("../models/Class");
const Program = require("../models/Program");
const User = require("../models/User");
const asyncHandler = require("../helpers/asyncHandler");
const ApiResponse = require("../helpers/ApiResponse");

/* =========================================================
   HELPERS
========================================================= */

const sendError = (res, status, message) => {
  return res.status(status).json(new ApiResponse(status, null, message));
};

const normalizeSubject = (subject) => {
  return typeof subject === "string" ? subject.trim() : "";
};

/* =========================================================
   ASSIGN TEACHER
   SCHOOL:
   {
     teacherId,
     classId,
     subject,
     isClassTeacher
   }

   COLLEGE:
   {
     teacherId,
     programId,
     semester,
     subject
   }
========================================================= */

exports.assignTeacher = asyncHandler(async (req, res) => {
  const {
    teacherId,
    classId,
    programId,
    semester,
    subject,
    isClassTeacher,
  } = req.body;

  /* -------------------------------------------------------
     BASIC VALIDATION
  ------------------------------------------------------- */

  if (!teacherId) {
    return sendError(res, 400, "teacherId is required");
  }

  if (classId && programId) {
    return sendError(
      res,
      400,
      "Provide either classId or programId, not both",
    );
  }

  if (!classId && !programId) {
    return sendError(
      res,
      400,
      "Either classId or programId is required",
    );
  }

  /* -------------------------------------------------------
     VALIDATE TEACHER
  ------------------------------------------------------- */

  const teacher = await User.findById(teacherId).select(
    "_id name email role isActive",
  );

  if (!teacher) {
    return sendError(res, 404, "Teacher not found");
  }

  if (teacher.role !== "TEACHER") {
    return sendError(
      res,
      400,
      "Selected user is not a TEACHER",
    );
  }

  if (teacher.isActive === false) {
    return sendError(
      res,
      400,
      "Teacher account is inactive",
    );
  }

  const cleanSubject = normalizeSubject(subject);

  /* =======================================================
     SCHOOL ASSIGNMENT
  ======================================================= */

  if (classId) {
    const classData = await Class.findById(classId);

    if (!classData) {
      return sendError(res, 404, "Class not found");
    }

    /* -----------------------------------------------------
       SUBJECT IS REQUIRED FOR NORMAL SUBJECT ASSIGNMENT
       If class teacher only, subject can remain empty.
    ----------------------------------------------------- */

    if (!isClassTeacher && !cleanSubject) {
      return sendError(
        res,
        400,
        "Subject is required for teacher assignment",
      );
    }

    /* -----------------------------------------------------
       CHECK EXISTING ACTIVE ASSIGNMENT
       Same teacher + class + subject
    ----------------------------------------------------- */

    const existingAssignment = await TeacherAssignment.findOne({
      teacher: teacherId,
      class: classId,
      subject: cleanSubject,
      status: "ACTIVE",
    });

    if (existingAssignment) {
      return sendError(
        res,
        409,
        "Teacher is already assigned to this class and subject",
      );
    }

    /* -----------------------------------------------------
       IF CLASS TEACHER
       Remove previous class teacher assignment
    ----------------------------------------------------- */

    if (isClassTeacher) {
      const previousClassTeacherAssignments =
        await TeacherAssignment.find({
          class: classId,
          isClassTeacher: true,
          status: "ACTIVE",
        });

      if (previousClassTeacherAssignments.length > 0) {
        await TeacherAssignment.updateMany(
          {
            class: classId,
            isClassTeacher: true,
            status: "ACTIVE",
          },
          {
            $set: {
              isClassTeacher: false,
            },
          },
        );
      }
    }

    /* -----------------------------------------------------
       CREATE ASSIGNMENT
    ----------------------------------------------------- */

    const newAssignment = await TeacherAssignment.create({
      teacher: teacherId,
      class: classId,
      program: null,
      semester: null,
      subject: cleanSubject,
      isClassTeacher: !!isClassTeacher,
      status: "ACTIVE",
      assignedBy: req.user?._id || null,
    });

    /* -----------------------------------------------------
       UPDATE CLASS CLASS-TEACHER
    ----------------------------------------------------- */

    if (isClassTeacher) {
      classData.classTeacher = teacherId;
      await classData.save();
    }

    /* -----------------------------------------------------
       POPULATE RESPONSE
    ----------------------------------------------------- */

    const populatedAssignment =
      await TeacherAssignment.findById(newAssignment._id)
        .populate("teacher", "name email")
        .populate("class", "className section")
        .populate("assignedBy", "name email");

    return res.status(201).json(
      new ApiResponse(
        201,
        populatedAssignment,
        "Teacher assigned successfully",
      ),
    );
  }

  /* =======================================================
     COLLEGE ASSIGNMENT
  ======================================================= */

  const program = await Program.findById(programId);

  if (!program) {
    return sendError(res, 404, "Program not found");
  }

  /* -------------------------------------------------------
     SEMESTER VALIDATION
  ------------------------------------------------------- */

  const numericSemester = Number(semester);

  if (
    !Number.isInteger(numericSemester) ||
    numericSemester < 1
  ) {
    return sendError(
      res,
      400,
      "Valid semester is required for college assignment",
    );
  }

  if (!cleanSubject) {
    return sendError(
      res,
      400,
      "Subject is required for college assignment",
    );
  }

  /* -------------------------------------------------------
     DUPLICATE COLLEGE ASSIGNMENT
     Same teacher + program + semester + subject
  ------------------------------------------------------- */

  const existingAssignment = await TeacherAssignment.findOne({
    teacher: teacherId,
    program: programId,
    semester: numericSemester,
    subject: cleanSubject,
    status: "ACTIVE",
  });

  if (existingAssignment) {
    return sendError(
      res,
      409,
      "Teacher is already assigned to this program, semester and subject",
    );
  }

  /* -------------------------------------------------------
     CREATE COLLEGE ASSIGNMENT
  ------------------------------------------------------- */

  const newAssignment = await TeacherAssignment.create({
    teacher: teacherId,
    class: null,
    program: programId,
    semester: numericSemester,
    subject: cleanSubject,
    isClassTeacher: false,
    status: "ACTIVE",
    assignedBy: req.user?._id || null,
  });

  /* -------------------------------------------------------
     POPULATE RESPONSE
  ------------------------------------------------------- */

  const populatedAssignment =
    await TeacherAssignment.findById(newAssignment._id)
      .populate("teacher", "name email")
      .populate("program", "name code")
      .populate("assignedBy", "name email");

  return res.status(201).json(
    new ApiResponse(
      201,
      populatedAssignment,
      "Teacher assigned successfully",
    ),
  );
});

/* =========================================================
   GET MY ASSIGNMENTS
   TEACHER ONLY
========================================================= */

exports.getMyAssignments = asyncHandler(async (req, res) => {
  const assignments = await TeacherAssignment.find({
    teacher: req.user._id,
    status: "ACTIVE",
  })
    .populate("class", "className section classTeacher")
    .populate("program", "name code")
    .sort({
      createdAt: -1,
    });

  return res.status(200).json(
    new ApiResponse(
      200,
      assignments,
      "Assigned classes/programs fetched successfully",
    ),
  );
});

/* =========================================================
   GET ALL ASSIGNMENTS

   Query:
   ?classId=
   ?programId=
   ?teacherId=
   ?status=
   ?semester=
   ?subject=
========================================================= */

exports.getAllAssignments = asyncHandler(async (req, res) => {
  const {
    classId,
    programId,
    teacherId,
    status,
    semester,
    subject,
  } = req.query;

  const query = {};

  /* -------------------------------------------------------
     STATUS
     Default ACTIVE
  ------------------------------------------------------- */

  query.status = status || "ACTIVE";

  /* -------------------------------------------------------
     FILTERS
  ------------------------------------------------------- */

  if (classId) {
    query.class = classId;
  }

  if (programId) {
    query.program = programId;
  }

  if (teacherId) {
    query.teacher = teacherId;
  }

  if (semester !== undefined && semester !== "") {
    const numericSemester = Number(semester);

    if (!Number.isInteger(numericSemester) || numericSemester < 1) {
      return sendError(
        res,
        400,
        "Invalid semester filter",
      );
    }

    query.semester = numericSemester;
  }

  if (subject) {
    query.subject = {
      $regex: String(subject).trim(),
      $options: "i",
    };
  }

  /* -------------------------------------------------------
     FETCH
  ------------------------------------------------------- */

  const assignments = await TeacherAssignment.find(query)
    .populate("teacher", "name email role")
    .populate("class", "className section classTeacher")
    .populate("program", "name code")
    .populate("assignedBy", "name email")
    .sort({
      createdAt: -1,
    });

  return res.status(200).json(
    new ApiResponse(
      200,
      assignments,
      "Assignments fetched successfully",
    ),
  );
});

/* =========================================================
   REMOVE / DEACTIVATE ASSIGNMENT

   PUT /:id/remove
========================================================= */

exports.removeAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return sendError(
      res,
      400,
      "Assignment id is required",
    );
  }

  const assignment = await TeacherAssignment.findById(id);

  if (!assignment) {
    return sendError(
      res,
      404,
      "Assignment not found",
    );
  }

  /* -------------------------------------------------------
     ALREADY INACTIVE
  ------------------------------------------------------- */

  if (assignment.status === "INACTIVE") {
    return sendError(
      res,
      400,
      "Assignment is already inactive",
    );
  }

  /* -------------------------------------------------------
     DEACTIVATE
  ------------------------------------------------------- */

  assignment.status = "INACTIVE";

  await assignment.save();

  /* -------------------------------------------------------
     IF CLASS TEACHER
     Remove from Class model only if this teacher is still
     the current class teacher.
  ------------------------------------------------------- */

  if (
    assignment.isClassTeacher &&
    assignment.class
  ) {
    const classData = await Class.findById(
      assignment.class,
    );

    if (
      classData &&
      classData.classTeacher &&
      String(classData.classTeacher) ===
        String(assignment.teacher)
    ) {
      classData.classTeacher = null;

      await classData.save();
    }
  }

  /* -------------------------------------------------------
     RESPONSE
  ------------------------------------------------------- */

  const populatedAssignment =
    await TeacherAssignment.findById(assignment._id)
      .populate("teacher", "name email")
      .populate("class", "className section")
      .populate("program", "name code")
      .populate("assignedBy", "name email");

  return res.status(200).json(
    new ApiResponse(
      200,
      populatedAssignment,
      "Assignment deactivated successfully",
    ),
  );
});

exports.updateAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const {
    teacherId,
    classId,
    subject,
    isClassTeacher,
  } = req.body;

  if (!teacherId) {
    return res
      .status(400)
      .json(
        new ApiResponse(
          400,
          null,
          "teacherId is required",
        ),
      );
  }

  if (!classId) {
    return res
      .status(400)
      .json(
        new ApiResponse(
          400,
          null,
          "classId is required",
        ),
      );
  }

  const assignment =
    await TeacherAssignment.findById(id);

  if (!assignment) {
    return res
      .status(404)
      .json(
        new ApiResponse(
          404,
          null,
          "Assignment not found",
        ),
      );
  }

  const teacher = await User.findById(teacherId);

  if (!teacher || teacher.role !== "TEACHER") {
    return res
      .status(400)
      .json(
        new ApiResponse(
          400,
          null,
          "Invalid teacher",
        ),
      );
  }

  const classData = await Class.findById(classId);

  if (!classData) {
    return res
      .status(404)
      .json(
        new ApiResponse(
          404,
          null,
          "Class not found",
        ),
      );
  }

  const cleanSubject =
    typeof subject === "string"
      ? subject.trim()
      : "";

  if (!isClassTeacher && !cleanSubject) {
    return res
      .status(400)
      .json(
        new ApiResponse(
          400,
          null,
          "Subject is required",
        ),
      );
  }

  /* ---------------------------------------------
     DUPLICATE CHECK
     Exclude current assignment
  --------------------------------------------- */

  const duplicate =
    await TeacherAssignment.findOne({
      _id: { $ne: id },
      teacher: teacherId,
      class: classId,
      subject: cleanSubject,
      status: "ACTIVE",
    });

  if (duplicate) {
    return res
      .status(409)
      .json(
        new ApiResponse(
          409,
          null,
          "Teacher is already assigned to this class and subject",
        ),
      );
  }

  /* ---------------------------------------------
     CLASS TEACHER
  --------------------------------------------- */

  if (isClassTeacher) {
    await TeacherAssignment.updateMany(
      {
        class: classId,
        isClassTeacher: true,
        status: "ACTIVE",
        _id: { $ne: id },
      },
      {
        $set: {
          isClassTeacher: false,
        },
      },
    );

    classData.classTeacher = teacherId;
  } else if (
    assignment.isClassTeacher &&
    String(classData.classTeacher) ===
      String(assignment.teacher)
  ) {
    classData.classTeacher = null;
  }

  await classData.save();

  /* ---------------------------------------------
     UPDATE
  --------------------------------------------- */

  assignment.teacher = teacherId;
  assignment.class = classId;
  assignment.subject = cleanSubject;
  assignment.isClassTeacher = Boolean(
    isClassTeacher,
  );

  await assignment.save();

  const populated =
    await TeacherAssignment.findById(id)
      .populate("teacher", "name email")
      .populate("class", "className section")
      .populate("assignedBy", "name email");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        populated,
        "Assignment updated successfully",
      ),
    );
});