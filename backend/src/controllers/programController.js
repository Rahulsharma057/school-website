const Program = require("../models/Program");
const asyncHandler = require("../helpers/asyncHandler");
const ApiResponse = require("../helpers/ApiResponse");

exports.createProgram = asyncHandler(async (req, res) => {
  const { name, code, durationYears, totalSemesters, programCoordinator } = req.body;

  if (!name?.trim()) {
    return res.status(400).json(new ApiResponse(400, null, "Program name is required"));
  }
  if (!durationYears || !totalSemesters) {
    return res.status(400).json(new ApiResponse(400, null, "durationYears and totalSemesters are required"));
  }

  const program = await Program.create({
    name: name.trim(),
    code: code ? String(code).trim().toUpperCase() : "",
    durationYears: Number(durationYears),
    totalSemesters: Number(totalSemesters),
    programCoordinator: programCoordinator || null,
  });

  res.status(201).json(new ApiResponse(201, program, "Program created successfully"));
});

exports.getAllPrograms = asyncHandler(async (req, res) => {
  const programs = await Program.find({ status: "ACTIVE" })
    .populate("programCoordinator", "name email")
    .sort({ name: 1 });

  res.json(new ApiResponse(200, programs, "Programs fetched successfully"));
});

exports.getProgramById = asyncHandler(async (req, res) => {
  const program = await Program.findById(req.params.id).populate("programCoordinator", "name email");
  if (!program) {
    return res.status(404).json(new ApiResponse(404, null, "Program not found"));
  }
  res.json(new ApiResponse(200, program, "Program fetched successfully"));
});

exports.updateProgram = asyncHandler(async (req, res) => {
  const { name, code, durationYears, totalSemesters, programCoordinator, status } = req.body;

  const program = await Program.findById(req.params.id);
  if (!program) {
    return res.status(404).json(new ApiResponse(404, null, "Program not found"));
  }

  if (name !== undefined) program.name = name.trim();
  if (code !== undefined) program.code = String(code).trim().toUpperCase();
  if (durationYears !== undefined) program.durationYears = Number(durationYears);
  if (totalSemesters !== undefined) program.totalSemesters = Number(totalSemesters);
  if (programCoordinator !== undefined) program.programCoordinator = programCoordinator || null;
  if (status !== undefined) program.status = status;

  await program.save();
  res.json(new ApiResponse(200, program, "Program updated successfully"));
});

exports.deleteProgram = asyncHandler(async (req, res) => {
  const program = await Program.findById(req.params.id);
  if (!program) {
    return res.status(404).json(new ApiResponse(404, null, "Program not found"));
  }
  await program.deleteOne();
  res.json(new ApiResponse(200, null, "Program deleted successfully"));
});