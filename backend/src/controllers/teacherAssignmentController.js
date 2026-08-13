const TeacherAssignment = require("../models/TeacherAssignment");
const Class = require("../models/Class");
const User = require("../models/User");
const asyncHandler = require("../helpers/asyncHandler");
const ApiResponse = require("../helpers/ApiResponse");

// ================= ASSIGN TEACHER TO CLASS =================
// Access: SUPER_ADMIN, ADMIN, PRINCIPAL

exports.assignTeacher = asyncHandler(async (req, res) => {
  const { teacherId, classId, subject, isClassTeacher } = req.body;

  // teacher valid hai aur role TEACHER hai, ye check
  const teacher = await User.findById(teacherId);
  if (!teacher || teacher.role !== "TEACHER") {
    return res.status(400).json(
      new ApiResponse(400, null, "Invalid teacher — user not found or not a TEACHER")
    );
  }

  // class exist karti hai
  const classData = await Class.findById(classId);
  if (!classData) {
    return res.status(404).json(
      new ApiResponse(404, null, "Class not found")
    );
  }

  // agar isClassTeacher = true, to is class ka purana Class Teacher hatao (sirf 1 active class-teacher rule)
  if (isClassTeacher) {
    await TeacherAssignment.updateMany(
      { class: classId, isClassTeacher: true, status: "ACTIVE" },
      { $set: { isClassTeacher: false } }
    );
  }

  // naya assignment banao
  const newAssignment = await TeacherAssignment.create({
    teacher: teacherId,
    class: classId,
    subject: subject || "",
    isClassTeacher: !!isClassTeacher,
    status: "ACTIVE",
    assignedBy: req.user._id,
  });

  // agar class-teacher bana hai, to Class schema ka classTeacher field bhi sync karo
  if (isClassTeacher) {
    classData.classTeacher = teacherId;
    await classData.save();
  }

  const populated = await newAssignment.populate([
    { path: "teacher", select: "name email" },
    { path: "class", select: "className section" },
  ]);

  res.status(201).json(
    new ApiResponse(201, populated, "Teacher assigned successfully")
  );
});

// ================= GET MY CLASSES (Teacher's own dashboard) =================
// Access: TEACHER only

exports.getMyAssignments = asyncHandler(async (req, res) => {
  const assignments = await TeacherAssignment.find({
    teacher: req.user._id,
    status: "ACTIVE",
  })
    .populate("class", "className section")
    .sort({ createdAt: -1 });

  res.json(
    new ApiResponse(200, assignments, "Assigned classes fetched successfully")
  );
});

// ================= GET ALL ASSIGNMENTS (Admin view) =================
// Access: SUPER_ADMIN, ADMIN, PRINCIPAL
// Optional filters: ?classId=... / ?teacherId=...

exports.getAllAssignments = asyncHandler(async (req, res) => {
  const { classId, teacherId, status } = req.query;

  const query = {};
  if (classId) query.class = classId;
  if (teacherId) query.teacher = teacherId;
  query.status = status || "ACTIVE"; // default sirf active dikhao

  const assignments = await TeacherAssignment.find(query)
    .populate("teacher", "name email")
    .populate("class", "className section")
    .sort({ createdAt: -1 });

  res.json(
    new ApiResponse(200, assignments, "Assignments fetched successfully")
  );
});

// ================= REMOVE / DEACTIVATE ASSIGNMENT =================
// Access: SUPER_ADMIN, ADMIN, PRINCIPAL
// (Teacher class chhode / reassign se pehle purani assignment hataani ho)

exports.removeAssignment = asyncHandler(async (req, res) => {
  const assignment = await TeacherAssignment.findById(req.params.id);

  if (!assignment) {
    return res.status(404).json(
      new ApiResponse(404, null, "Assignment not found")
    );
  }

  assignment.status = "INACTIVE";
  await assignment.save();

  // agar ye class-teacher tha, to Class schema se bhi hatao
  if (assignment.isClassTeacher) {
    const classData = await Class.findById(assignment.class);
    if (classData && String(classData.classTeacher) === String(assignment.teacher)) {
      classData.classTeacher = null;
      await classData.save();
    }
  }

  res.json(
    new ApiResponse(200, assignment, "Assignment deactivated successfully")
  );
});