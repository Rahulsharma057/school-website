const PeriodSlot = require("../models/PeriodSlot");
const asyncHandler = require("../helpers/asyncHandler");
const ApiResponse = require("../helpers/ApiResponse");

// ================= CREATE / DEFINE PERIOD SLOT =================
// Access: SUPER_ADMIN, ADMIN, PRINCIPAL

exports.createPeriodSlot = asyncHandler(async (req, res) => {
  const { periodNumber, label, startTime, endTime, isBreak } = req.body;

  const existing = await PeriodSlot.findOne({ periodNumber });
  if (existing) {
    return res.status(400).json(new ApiResponse(400, null, "This period number already exists"));
  }

  // basic time validation
  if (startTime >= endTime) {
    return res.status(400).json(new ApiResponse(400, null, "Start time must be before end time"));
  }

  const slot = await PeriodSlot.create({ periodNumber, label, startTime, endTime, isBreak });

  res.status(201).json(new ApiResponse(201, slot, "Period slot created successfully"));
});

// ================= GET ALL PERIOD SLOTS =================
// Access: any logged-in staff/teacher

exports.getAllPeriodSlots = asyncHandler(async (req, res) => {
  const slots = await PeriodSlot.find().sort({ periodNumber: 1 });
  res.json(new ApiResponse(200, slots, "Period slots fetched successfully"));
});

// ================= UPDATE PERIOD SLOT =================
// Access: SUPER_ADMIN, ADMIN, PRINCIPAL

exports.updatePeriodSlot = asyncHandler(async (req, res) => {
  const { label, startTime, endTime, isBreak } = req.body;

  const slot = await PeriodSlot.findById(req.params.id);
  if (!slot) {
    return res.status(404).json(new ApiResponse(404, null, "Period slot not found"));
  }

  if (startTime && endTime && startTime >= endTime) {
    return res.status(400).json(new ApiResponse(400, null, "Start time must be before end time"));
  }

  if (label !== undefined) slot.label = label;
  if (startTime) slot.startTime = startTime;
  if (endTime) slot.endTime = endTime;
  if (isBreak !== undefined) slot.isBreak = isBreak;

  await slot.save();

  res.json(new ApiResponse(200, slot, "Period slot updated successfully"));
});

// ================= DELETE PERIOD SLOT =================
// Access: SUPER_ADMIN, ADMIN, PRINCIPAL

exports.deletePeriodSlot = asyncHandler(async (req, res) => {
  const Timetable = require("../models/Timetable");

  const inUse = await Timetable.countDocuments({ period: req.params.id });
  if (inUse > 0) {
    return res.status(400).json(
      new ApiResponse(400, null, "Cannot delete — this period is used in timetable entries")
    );
  }

  const slot = await PeriodSlot.findById(req.params.id);
  if (!slot) {
    return res.status(404).json(new ApiResponse(404, null, "Period slot not found"));
  }

  await slot.deleteOne();

  res.json(new ApiResponse(200, null, "Period slot deleted successfully"));
});