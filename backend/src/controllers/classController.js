const Class = require("../models/Class");
const asyncHandler = require("../helpers/asyncHandler");
const ApiResponse = require("../helpers/ApiResponse");

// ================= CREATE CLASS =================
// Access: SUPER_ADMIN, ADMIN, PRINCIPAL

exports.createClass = asyncHandler(async (req, res) => {
  const { className, section } = req.body;

  const existing = await Class.findOne({ className, section });
  if (existing) {
    return res.status(400).json(
      new ApiResponse(400, null, "This class-section already exists")
    );
  }

  const newClass = await Class.create({ className, section });

  res.status(201).json(
    new ApiResponse(201, newClass, "Class created successfully")
  );
});

// ================= GET ALL CLASSES =================
// Access: SUPER_ADMIN, ADMIN, PRINCIPAL, TEACHER

exports.getAllClasses = asyncHandler(async (req, res) => {
  const classes = await Class.find()
    .populate("classTeacher", "name email")
    .sort({ className: 1, section: 1 });

  res.json(new ApiResponse(200, classes, "Classes fetched successfully"));
});

// ================= GET SINGLE CLASS =================

exports.getClassById = asyncHandler(async (req, res) => {
  const classData = await Class.findById(req.params.id).populate(
    "classTeacher",
    "name email"
  );

  if (!classData) {
    return res.status(404).json(new ApiResponse(404, null, "Class not found"));
  }

  res.json(new ApiResponse(200, classData, "Class fetched successfully"));
});

// ================= UPDATE CLASS =================
// Access: SUPER_ADMIN, ADMIN, PRINCIPAL

exports.updateClass = asyncHandler(async (req, res) => {
  const { className, section } = req.body;

  const classData = await Class.findById(req.params.id);
  if (!classData) {
    return res.status(404).json(new ApiResponse(404, null, "Class not found"));
  }

  if (className) classData.className = className;
  if (section) classData.section = section;

  await classData.save();

  res.json(new ApiResponse(200, classData, "Class updated successfully"));
});

// ================= DELETE CLASS =================
// Access: SUPER_ADMIN, ADMIN
// Note: agar students already assigned hain to delete allow nahi karna chahiye (data integrity)

exports.deleteClass = asyncHandler(async (req, res) => {
  const StudentProfile = require("../models/StudentProfile");

  const studentCount = await StudentProfile.countDocuments({
    class: req.params.id,
    status: "ACTIVE",
  });

  if (studentCount > 0) {
    return res.status(400).json(
      new ApiResponse(400, null, "Cannot delete — active students are assigned to this class")
    );
  }

  const classData = await Class.findById(req.params.id);
  if (!classData) {
    return res.status(404).json(new ApiResponse(404, null, "Class not found"));
  }

  await classData.deleteOne();

  res.json(new ApiResponse(200, null, "Class deleted successfully"));
});