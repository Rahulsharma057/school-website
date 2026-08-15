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
// FIX: Access badla gaya — pehle sirf TEACHER allowed tha (route file me
// allowRoles("TEACHER")), jo galti se stated requirement ke ulta tha
// ("teacher sirf mark kare, edit sirf Admin/Principal kare"). Ab route
// level pe TEACHER hataya gaya hai — is function ka logic khud nahi
// badla, sirf permission route file me change hui hai (neeche dekho).

exports.updateAttendance = asyncHandler(async (req, res) => {
  const { classId, date, records } = req.body;

  const normalizedDate = normalizeDate(date);

  const attendance = await Attendance.findOne({ class: classId, date: normalizedDate });
  if (!attendance) {
    return res.status(404).json(
      new ApiResponse(404, null, "No attendance found for this date")
    );
  }

  attendance.records = records;
  attendance.markedBy = req.user._id; // NOTE: consider renaming to lastEditedBy / adding a separate field if you want to keep "who originally marked it" visible after an admin edit — currently this overwrites it.
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

// ================= CLASS ATTENDANCE REPORT (date range, % per student) =================
// FIX: NEW — getClassAttendance only ever looked at one date. This is
// the "did we actually mark every day this month, and what's each
// student's attendance %" report — one call, every active student in
// the class, tallied across every Attendance doc in the date range.
// Access: TEACHER (own assigned class), SUPER_ADMIN, ADMIN, PRINCIPAL

exports.getClassAttendanceReport = asyncHandler(async (req, res) => {
  const { classId, from, to } = req.query;

  if (!classId || !from || !to) {
    return res.status(400).json(
      new ApiResponse(400, null, "classId, from, and to are required")
    );
  }

  if (req.user.role === "TEACHER") {
    const isAuthorized = await isTeacherAssignedToClass(req.user._id, classId);
    if (!isAuthorized) {
      return res.status(403).json(
        new ApiResponse(403, null, "You are not assigned to this class")
      );
    }
  }

  const fromDate = normalizeDate(from);

  // "to" ka pura din include karna hai, isliye end-of-day tak — same
  // pattern jo getStudentAttendance already use karta hai
  const toDate = new Date(to);
  toDate.setHours(23, 59, 59, 999);

  // Step A: is class ke saare active students (jinke liye report banegi)
  const students = await StudentProfile.find({ class: classId, status: "ACTIVE" })
    .populate("user", "name email")
    .sort({ rollNumber: 1 });

  // Step B: is date-range me is class ki saari attendance docs (ek doc = ek din)
  const attendanceDocs = await Attendance.find({
    class: classId,
    date: { $gte: fromDate, $lte: toDate },
  });

  const totalDaysMarked = attendanceDocs.length;

  // Step C: har student ke liye records tally karo across saare din
  const report = students.map((student) => {
    const studentUserId = String(student.user?._id || student.user);

    let present = 0;
    let absent = 0;
    let leave = 0;

    attendanceDocs.forEach((doc) => {
      const record = doc.records.find(
        (r) => String(r.student) === studentUserId
      );

      if (!record) return; // is din is student ka record hi nahi hai (e.g. baad me class join kiya)

      if (record.status === "PRESENT") present += 1;
      else if (record.status === "ABSENT") absent += 1;
      else if (record.status === "LEAVE") leave += 1;
    });

    const totalMarked = present + absent + leave;
    const percentage =
      totalMarked > 0 ? Number(((present / totalMarked) * 100).toFixed(2)) : 0;

    return {
      student: {
        _id: student._id,
        userId: student.user?._id,
        name: student.user?.name || "",
        email: student.user?.email || "",
        rollNumber: student.rollNumber,
      },
      present,
      absent,
      leave,
      totalMarked,
      percentage,
    };
  });

  res.json(
    new ApiResponse(
      200,
      {
        classId,
        from: fromDate,
        to: toDate,
        totalDaysMarked,
        report,
      },
      "Attendance report generated successfully"
    )
  );
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
