const StudentProfile = require("../models/StudentProfile");
const User = require("../models/User");
const asyncHandler = require("../helpers/asyncHandler");
const ApiResponse = require("../helpers/ApiResponse");

// ================= MARK STUDENT AS LEFT =================
// Access: SUPER_ADMIN, ADMIN, PRINCIPAL

exports.markStudentLeft = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const { id } = req.params; // StudentProfile ki id

  const profile = await StudentProfile.findById(id);
  if (!profile) {
    return res.status(404).json(new ApiResponse(404, null, "Student profile not found"));
  }

  if (profile.status === "LEFT") {
    return res.status(400).json(new ApiResponse(400, null, "Student already marked as left"));
  }

  // Step A: profile update
  profile.status = "LEFT";
  profile.leftReason = reason || "";
  profile.leftDate = new Date();
  await profile.save();

  // Step B: login block karo (soft delete)
  await User.findByIdAndUpdate(profile.user, { isActive: false });

  res.json(new ApiResponse(200, profile, "Student marked as left successfully"));
});

// ================= REACTIVATE STUDENT (agar galti se mark ho gaya ho) =================
// Access: SUPER_ADMIN, ADMIN, PRINCIPAL

exports.reactivateStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const profile = await StudentProfile.findById(id);
  if (!profile) {
    return res.status(404).json(new ApiResponse(404, null, "Student profile not found"));
  }

  profile.status = "ACTIVE";
  profile.leftReason = "";
  profile.leftDate = null;
  await profile.save();

  await User.findByIdAndUpdate(profile.user, { isActive: true });

  res.json(new ApiResponse(200, profile, "Student reactivated successfully"));
});

// ================= GET LEFT STUDENTS LIST (archive view) =================
// Access: SUPER_ADMIN, ADMIN, PRINCIPAL

exports.getLeftStudents = asyncHandler(async (req, res) => {
  const students = await StudentProfile.find({ status: "LEFT" })
    .populate("user", "name email")
    .populate("class", "className section")
    .sort({ leftDate: -1 });

  res.json(new ApiResponse(200, students, "Left students fetched successfully"));
});