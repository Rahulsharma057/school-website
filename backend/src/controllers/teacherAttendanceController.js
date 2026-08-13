const TeacherAttendance = require("../models/TeacherAttendance");
const asyncHandler = require("../helpers/asyncHandler");
const ApiResponse = require("../helpers/ApiResponse");

const normalizeDate = (d) => {
  const nd = new Date(d);
  nd.setHours(0, 0, 0, 0);
  return nd;
};

// ================= MARK TEACHER ATTENDANCE (bulk, for a date) =================
// Access: SUPER_ADMIN, ADMIN, PRINCIPAL
// Body: { date, records: [{ teacher, status }] }

exports.markTeacherAttendance = asyncHandler(async (req, res) => {
  const { date, records } = req.body;
  const normalizedDate = normalizeDate(date);

  const bulkOps = records.map((r) => ({
    updateOne: {
      filter: { teacher: r.teacher, date: normalizedDate },
      update: {
        $set: { status: r.status, markedBy: req.user._id, date: normalizedDate },
      },
      upsert: true, // pehli baar create, dobara update
    },
  }));

  await TeacherAttendance.bulkWrite(bulkOps);

  res.json(new ApiResponse(200, null, "Teacher attendance marked successfully"));
});

// ================= GET TEACHER ATTENDANCE (month-wise, for salary calc + view) =================
// Access: SUPER_ADMIN, ADMIN, PRINCIPAL, or TEACHER (apni khud ki)

exports.getTeacherAttendanceByMonth = asyncHandler(async (req, res) => {
  const { teacherId, month, year } = req.query;

  const targetTeacher = req.user.role === "TEACHER" ? req.user._id : teacherId;

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  const records = await TeacherAttendance.find({
    teacher: targetTeacher,
    date: { $gte: start, $lte: end },
  }).sort({ date: 1 });

  res.json(new ApiResponse(200, records, "Attendance fetched successfully"));
});