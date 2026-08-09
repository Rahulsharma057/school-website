const SchoolClass = require("../models/SchoolClass");
const Syllabus = require("../models/Syllabus");

const asyncHandler = require("../helpers/asyncHandler");
const ApiResponse = require("../helpers/ApiResponse");
const ApiError = require("../helpers/ApiError");

// ================= CREATE =================

const createSchoolClass = asyncHandler(async (req, res) => {
  const { name, order, status } = req.body;

  if (!name?.trim()) throw new ApiError(400, "Class name is required");

  const exists = await SchoolClass.findOne({ name: name.trim() }).lean();
  if (exists) throw new ApiError(400, "This class already exists");

  const schoolClass = await SchoolClass.create({
    name: name.trim(),
    order: order || 0,
    status: status !== undefined ? status : true,
  });

  return res.status(201).json(new ApiResponse(201, schoolClass, "Class added successfully"));
});

// ================= LIST =================
// Public-readable — used by the admin SyllabusBuilder dropdown and any
// public class filter. Pass includeInactive=true (admin only, in
// practice) to see disabled classes too.

const getSchoolClasses = asyncHandler(async (req, res) => {
  const { includeInactive } = req.query;
  const filter = includeInactive === "true" ? {} : { status: true };

  const data = await SchoolClass.find(filter).sort({ order: 1, name: 1 }).lean();

  return res.json(new ApiResponse(200, data, "Classes fetched successfully"));
});

// ================= UPDATE =================

const updateSchoolClass = asyncHandler(async (req, res) => {
  const schoolClass = await SchoolClass.findById(req.params.id);
  if (!schoolClass) throw new ApiError(404, "Class not found");

  const { name, order, status } = req.body;

  if (name !== undefined && name.trim() !== schoolClass.name) {
    const duplicate = await SchoolClass.findOne({
      name: name.trim(),
      _id: { $ne: schoolClass._id },
    }).lean();

    if (duplicate) throw new ApiError(400, "This class already exists");

    // keep every syllabus's className snapshot in sync with the rename
    await Syllabus.updateMany({ classId: schoolClass._id }, { className: name.trim() });

    schoolClass.name = name.trim();
  }

  if (order !== undefined) schoolClass.order = order;
  if (status !== undefined) schoolClass.status = status;

  await schoolClass.save();

  return res.json(new ApiResponse(200, schoolClass, "Class updated successfully"));
});

// ================= DELETE =================
// Blocked if any syllabus still uses this class — protects data
// integrity instead of silently orphaning existing syllabi.

const deleteSchoolClass = asyncHandler(async (req, res) => {
  const schoolClass = await SchoolClass.findById(req.params.id);
  if (!schoolClass) throw new ApiError(404, "Class not found");

  const inUse = await Syllabus.countDocuments({ classId: schoolClass._id });

  if (inUse > 0) {
    throw new ApiError(
      400,
      `Cannot delete — ${inUse} syllabus(es) still use this class. Delete or reassign them first.`,
    );
  }

  await schoolClass.deleteOne();

  return res.json(new ApiResponse(200, null, "Class deleted successfully"));
});

module.exports = {
  createSchoolClass,
  getSchoolClasses,
  updateSchoolClass,
  deleteSchoolClass,
};