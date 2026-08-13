const LeaveQuota = require("../models/LeaveQuota");
const asyncHandler = require("../helpers/asyncHandler");
const ApiResponse = require("../helpers/ApiResponse");

// ================= SET/UPDATE LEAVE QUOTA =================
// Access: SUPER_ADMIN, ADMIN, PRINCIPAL

exports.setLeaveQuota = asyncHandler(async (req, res) => {
  const { teacherId, year, totalPaidLeaves } = req.body;

  const quota = await LeaveQuota.findOneAndUpdate(
    { teacher: teacherId, year },
    { totalPaidLeaves },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  res.json(new ApiResponse(200, quota, "Leave quota set successfully"));
});

// ================= GET LEAVE QUOTA =================

exports.getLeaveQuota = asyncHandler(async (req, res) => {
  const { teacherId, year } = req.params;

  let quota = await LeaveQuota.findOne({ teacher: teacherId, year });

  // agar nahi bani, default dikha do (bina save kiye)
  if (!quota) {
    quota = { teacher: teacherId, year: Number(year), totalPaidLeaves: 12, usedPaidLeaves: 0 };
  }

  res.json(new ApiResponse(200, quota, "Leave quota fetched successfully"));
});