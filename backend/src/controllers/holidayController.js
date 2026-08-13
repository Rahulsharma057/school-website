const Holiday = require("../models/Holiday");
const asyncHandler = require("../helpers/asyncHandler");
const ApiResponse = require("../helpers/ApiResponse");

// ================= ADD HOLIDAY =================
// Access: SUPER_ADMIN, ADMIN, PRINCIPAL

exports.addHoliday = asyncHandler(async (req, res) => {
  const { title, date, type } = req.body;

  const existing = await Holiday.findOne({ date });
  if (existing) {
    return res.status(400).json(new ApiResponse(400, null, "Holiday already exists on this date"));
  }

  const holiday = await Holiday.create({ title, date, type, createdBy: req.user._id });

  res.status(201).json(new ApiResponse(201, holiday, "Holiday added successfully"));
});

// ================= GET HOLIDAYS BY YEAR =================

exports.getHolidaysByYear = asyncHandler(async (req, res) => {
  const { year } = req.params;

  const start = new Date(`${year}-01-01`);
  const end = new Date(`${year}-12-31`);

  const holidays = await Holiday.find({ date: { $gte: start, $lte: end } }).sort({ date: 1 });

  res.json(new ApiResponse(200, holidays, "Holidays fetched successfully"));
});

// ================= DELETE HOLIDAY =================
// Access: SUPER_ADMIN, ADMIN, PRINCIPAL

exports.deleteHoliday = asyncHandler(async (req, res) => {
  const holiday = await Holiday.findById(req.params.id);
  if (!holiday) {
    return res.status(404).json(new ApiResponse(404, null, "Holiday not found"));
  }

  await holiday.deleteOne();

  res.json(new ApiResponse(200, null, "Holiday deleted successfully"));
});