const Attendance = require("../models/Attendance");
const TeacherAssignment = require("../models/TeacherAssignment");
const StudentProfile = require("../models/StudentProfile");
const normalizeDate = require("../utils/normalizeDate");
const asyncHandler = require("../helpers/asyncHandler");
const ApiResponse = require("../helpers/ApiResponse");

// helper — check karo ye teacher is class ke liye authorized hai ya nahi
const isTeacherAssignedToClass = async (teacherId, classId) => {
  const assignment = await TeacherAssignment.findOne({
    teacher: teacherId,
    class: classId,
    status: "ACTIVE",
  });
  return !!assignment;
};

// ================= MARK ATTENDANCE =================
// Access: TEACHER only
// Body: { classId, date, records: [{ student, status }] }

exports.markAttendance = asyncHandler(async (req, res) => {
  const { classId, date, records } = req.body;

  // Step A: authorization — ye teacher isi class ka authorized hai?
  const isAuthorized = await isTeacherAssignedToClass(req.user._id, classId);
  if (!isAuthorized) {
    return res.status(403).json(
      new ApiResponse(403, null, "You are not assigned to this class")
    );
  }

  const normalizedDate = normalizeDate(date);

  // Step B: duplicate check — is din ki attendance pehle se hai?
  const existing = await Attendance.findOne({ class: classId, date: normalizedDate });
  if (existing) {
    return res.status(400).json(
      new ApiResponse(400, null, "Attendance already marked for this date. Use update instead.")
    );
  }

  // Step C: create
  const attendance = await Attendance.create({
    class: classId,
    date: normalizedDate,
    markedBy: req.user._id,
    records,
  });

  res.status(201).json(new ApiResponse(201, attendance, "Attendance marked successfully"));
});

// ================= UPDATE ATTENDANCE (same din dobara edit) =================
// Access: TEACHER only (apni class ki hi)

exports.updateAttendance = asyncHandler(async (req, res) => {
  const { classId, date, records } = req.body;

  const isAuthorized = await isTeacherAssignedToClass(req.user._id, classId);
  if (!isAuthorized) {
    return res.status(403).json(
      new ApiResponse(403, null, "You are not assigned to this class")
    );
  }

  const normalizedDate = normalizeDate(date);

  const attendance = await Attendance.findOne({ class: classId, date: normalizedDate });
  if (!attendance) {
    return res.status(404).json(
      new ApiResponse(404, null, "No attendance found for this date")
    );
  }

  attendance.records = records;
  attendance.markedBy = req.user._id;
  await attendance.save();

  res.json(new ApiResponse(200, attendance, "Attendance updated successfully"));
});

// ================= GET CLASS ATTENDANCE (specific date) =================
// Access: TEACHER (apni class), PRINCIPAL/ADMIN (koi bhi)

exports.getClassAttendance = asyncHandler(async (req, res) => {
  const { classId, date } = req.query;

  // agar Teacher hai, to authorization check
  if (req.user.role === "TEACHER") {
    const isAuthorized = await isTeacherAssignedToClass(req.user._id, classId);
    if (!isAuthorized) {
      return res.status(403).json(
        new ApiResponse(403, null, "You are not assigned to this class")
      );
    }
  }

  const normalizedDate = normalizeDate(date);

  const attendance = await Attendance.findOne({ class: classId, date: normalizedDate })
    .populate("records.student", "name email")
    .populate("class", "className section");

  if (!attendance) {
    return res.status(404).json(
      new ApiResponse(404, null, "No attendance record found for this date")
    );
  }

  res.json(new ApiResponse(200, attendance, "Attendance fetched successfully"));
});

// ================= GET MY ATTENDANCE (Student self) =================
// Access: STUDENT only
// Query: ?month=2026-08 (optional filter)

exports.getMyAttendance = asyncHandler(async (req, res) => {
  const studentProfile = await StudentProfile.findOne({ user: req.user._id });
  if (!studentProfile) {
    return res.status(404).json(new ApiResponse(404, null, "Student profile not found"));
  }

  // saare attendance documents nikaalo jisme is student ka record hai, apni class ke
  const attendanceDocs = await Attendance.find({
    class: studentProfile.class,
    "records.student": req.user._id,
  }).sort({ date: 1 });

  // sirf is student ka status extract karo har document se
  const myAttendance = attendanceDocs.map((doc) => {
    const record = doc.records.find(
      (r) => String(r.student) === String(req.user._id)
    );
    return {
      date: doc.date,
      status: record ? record.status : null,
    };
  });

  // quick summary
  const presentCount = myAttendance.filter((a) => a.status === "PRESENT").length;
  const totalCount = myAttendance.length;

  res.json(
    new ApiResponse(
      200,
      { attendance: myAttendance, presentCount, totalCount },
      "Attendance fetched successfully"
    )
  );
});

// ================= GET STUDENT ATTENDANCE =================
// Access: TEACHER / ADMIN / PRINCIPAL / SUPER_ADMIN

exports.getStudentAttendance = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { classId, from, to } = req.query;

  if (!studentId) {
    return res.status(400).json(
      new ApiResponse(400, null, "Student ID is required")
    );
  }

  const query = {
    "records.student": studentId,
  };

  if (classId) {
    query.class = classId;
  }

  if (from || to) {
    query.date = {};

    if (from) {
      query.date.$gte = normalizeDate(from);
    }

    if (to) {
      const endDate = new Date(to);
      endDate.setHours(23, 59, 59, 999);
      query.date.$lte = endDate;
    }
  }

  const attendanceDocs = await Attendance.find(query)
    .sort({ date: 1 })
    .populate("records.student", "name email")
    .populate("class", "className section");

  const attendance = [];

  attendanceDocs.forEach((doc) => {
    const record = doc.records.find(
      (r) => String(r.student?._id || r.student) === String(studentId)
    );

    if (record) {
      attendance.push({
        date: doc.date,
        status: record.status,
        class: doc.class,
        markedBy: doc.markedBy,
      });
    }
  });

  const presentCount = attendance.filter(
    (item) => item.status === "PRESENT"
  ).length;

  const absentCount = attendance.filter(
    (item) => item.status === "ABSENT"
  ).length;

  const leaveCount = attendance.filter(
    (item) => item.status === "LEAVE"
  ).length;

  const totalCount = attendance.length;

  const percentage =
    totalCount > 0
      ? Number(((presentCount / totalCount) * 100).toFixed(2))
      : 0;

  res.json(
    new ApiResponse(
      200,
      {
        attendance,
        summary: {
          total: totalCount,
          present: presentCount,
          absent: absentCount,
          leave: leaveCount,
          percentage,
        },
      },
      "Student attendance fetched successfully"
    )
  );
});