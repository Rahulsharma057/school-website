const Subject = require("../models/Subject");
const asyncHandler = require("../helpers/asyncHandler");
const ApiResponse = require("../helpers/ApiResponse");

exports.createSubject = asyncHandler(async (req, res) => {
  const { name, code, level, hasPractical } = req.body;

  if (!name?.trim()) {
    return res.status(400).json(new ApiResponse(400, null, "Subject name is required"));
  }

  const subject = await Subject.create({
    name: name.trim(),
    code: code ? String(code).trim().toUpperCase() : "",
    level: level || "BOTH",
    hasPractical: Boolean(hasPractical),
  });

  res.status(201).json(new ApiResponse(201, subject, "Subject created successfully"));
});

exports.getAllSubjects = asyncHandler(async (req, res) => {
  const { level, search } = req.query;
  const query = { status: "ACTIVE" };

  if (level) query.level = { $in: [level, "BOTH"] };
  if (search?.trim()) {
    query.name = { $regex: search.trim(), $options: "i" };
  }

  const subjects = await Subject.find(query).sort({ name: 1 });
  res.json(new ApiResponse(200, subjects, "Subjects fetched successfully"));
});

exports.updateSubject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, code, level, hasPractical, status } = req.body;

  const subject = await Subject.findById(id);
  if (!subject) {
    return res.status(404).json(new ApiResponse(404, null, "Subject not found"));
  }

  if (name !== undefined) subject.name = name.trim();
  if (code !== undefined) subject.code = String(code).trim().toUpperCase();
  if (level !== undefined) subject.level = level;
  if (hasPractical !== undefined) subject.hasPractical = Boolean(hasPractical);
  if (status !== undefined) subject.status = status;

  await subject.save();
  res.json(new ApiResponse(200, subject, "Subject updated successfully"));
});

exports.deleteSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id);
  if (!subject) {
    return res.status(404).json(new ApiResponse(404, null, "Subject not found"));
  }
  await subject.deleteOne();
  res.json(new ApiResponse(200, null, "Subject deleted successfully"));
});