const LeaveRequest = require("../models/LeaveRequest");
const LeaveQuota = require("../models/LeaveQuota");
const asyncHandler = require("../helpers/asyncHandler");
const ApiResponse = require("../helpers/ApiResponse");

// ================= APPLY LEAVE (Teacher) =================
// Access: TEACHER

exports.applyLeave = asyncHandler(async (req, res) => {
  const { fromDate, toDate, reason } = req.body;

  const leave = await LeaveRequest.create({
    teacher: req.user._id,
    fromDate,
    toDate,
    reason,
  });

  res.status(201).json(new ApiResponse(201, leave, "Leave request submitted"));
});

// ================= MY LEAVE REQUESTS (Teacher) =================

exports.getMyLeaveRequests = asyncHandler(async (req, res) => {
  const leaves = await LeaveRequest.find({ teacher: req.user._id }).sort({ createdAt: -1 });
  res.json(new ApiResponse(200, leaves, "Leave requests fetched"));
});

// ================= ALL PENDING/ALL LEAVE REQUESTS (Admin) =================
// Access: SUPER_ADMIN, ADMIN, PRINCIPAL

exports.getAllLeaveRequests = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const query = status ? { status } : {};

  const leaves = await LeaveRequest.find(query)
    .populate("teacher", "name email")
    .sort({ createdAt: -1 });

  res.json(new ApiResponse(200, leaves, "Leave requests fetched"));
});

// ================= APPROVE / REJECT LEAVE =================
// Access: SUPER_ADMIN, ADMIN, PRINCIPAL
// Body: { status: "APPROVED"/"REJECTED", leaveType: "PAID"/"UNPAID" (only if approved), reviewNote }

exports.reviewLeaveRequest = asyncHandler(async (req, res) => {
  const { status, leaveType, reviewNote } = req.body;
  const leave = await LeaveRequest.findById(req.params.id);

  if (!leave) {
    return res.status(404).json(new ApiResponse(404, null, "Leave request not found"));
  }

  if (leave.status !== "PENDING") {
    return res.status(400).json(new ApiResponse(400, null, "This request is already reviewed"));
  }

  if (status === "APPROVED" && !leaveType) {
    return res.status(400).json(new ApiResponse(400, null, "Specify leaveType (PAID/UNPAID) when approving"));
  }

  leave.status = status;
  leave.leaveType = status === "APPROVED" ? leaveType : null;
  leave.reviewedBy = req.user._id;
  leave.reviewNote = reviewNote || "";
  await leave.save();

  // agar PAID approve hui, quota mein count badhao
  if (status === "APPROVED" && leaveType === "PAID") {
    const days = Math.ceil((new Date(leave.toDate) - new Date(leave.fromDate)) / (1000 * 60 * 60 * 24)) + 1;
    const year = new Date(leave.fromDate).getFullYear();

    await LeaveQuota.findOneAndUpdate(
      { teacher: leave.teacher, year },
      { $inc: { usedPaidLeaves: days } },
      { upsert: true, setDefaultsOnInsert: { totalPaidLeaves: 12 } }
    );
  }

  res.json(new ApiResponse(200, leave, "Leave request reviewed successfully"));
});