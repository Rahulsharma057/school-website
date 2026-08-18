const Attendance = require("../models/Attendance");
const TeacherAssignment = require("../models/TeacherAssignment");
const StudentProfile = require("../models/StudentProfile");
const normalizeDate = require("../utils/normalizeDate");
const asyncHandler = require("../helpers/asyncHandler");
const ApiResponse = require("../helpers/ApiResponse");
const { toDateKey, getHolidayDateSet, isNonWorkingDay } = require("../utils/attendanceHelpers");
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
  const toDate = new Date(to);
  toDate.setHours(23, 59, 59, 999);

  const students = await StudentProfile.find({ class: classId, status: "ACTIVE" })
    .populate("user", "name email")
    .sort({ rollNumber: 1 });

  const attendanceDocs = await Attendance.find({
    class: classId,
    date: { $gte: fromDate, $lte: toDate },
  });

  const attendanceByDate = new Map();
  attendanceDocs.forEach((doc) => attendanceByDate.set(toDateKey(doc.date), doc));

  // NEW: holidays in range
  const holidayDateSet = await getHolidayDateSet(fromDate, toDate);

  // NEW: range ke saare calendar days, taaki jis din doc nahi bana wo bhi check ho sake
  const allDates = [];
  for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
    allDates.push(new Date(d));
  }

  const report = students.map((student) => {
    const studentUserId = String(student.user?._id || student.user);

    let present = 0, absent = 0, leave = 0;

    allDates.forEach((day) => {
      const doc = attendanceByDate.get(toDateKey(day));

      if (doc) {
        const record = doc.records.find((r) => String(r.student) === studentUserId);
        if (!record) return; // us din is student ka record hi nahi
        if (record.status === "PRESENT") present += 1;
        else if (record.status === "ABSENT") absent += 1;
        else if (record.status === "LEAVE") leave += 1;
        return;
      }

      // NEW: attendance mark hi nahi hui — Sunday/Holiday hai to default PRESENT
      if (isNonWorkingDay(day, holidayDateSet)) {
        present += 1;
      }
      // warna simply skip (working day tha lekin mark hi nahi hui)
    });

    const totalMarked = present + absent + leave;
    const percentage = totalMarked > 0 ? Number(((present / totalMarked) * 100).toFixed(2)) : 0;

    return {
      student: {
        _id: student._id,
        userId: student.user?._id,
        name: student.user?.name || "",
        email: student.user?.email || "",
        rollNumber: student.rollNumber,
      },
      present, absent, leave, totalMarked, percentage,
    };
  });

  const totalDaysMarked = attendanceDocs.length;
  const totalHolidayOrSundayDays = allDates.filter(
    (d) => !attendanceByDate.has(toDateKey(d)) && isNonWorkingDay(d, holidayDateSet)
  ).length;

  res.json(
    new ApiResponse(
      200,
      { classId, from: fromDate, to: toDate, totalDaysMarked, totalHolidayOrSundayDays, report },
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
    return res.status(400).json(new ApiResponse(400, null, "Student ID is required"));
  }

  const query = { "records.student": studentId };
  if (classId) query.class = classId;

  let fromDate, toDate;
  if (from || to) {
    query.date = {};
    if (from) {
      fromDate = normalizeDate(from);
      query.date.$gte = fromDate;
    }
    if (to) {
      toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      query.date.$lte = toDate;
    }
  }

  const attendanceDocs = await Attendance.find(query)
    .sort({ date: 1 })
    .populate("records.student", "name email")
    .populate("class", "className section");

  const attendance = [];
  const recordedDateKeys = new Set();

  attendanceDocs.forEach((doc) => {
    const record = doc.records.find(
      (r) => String(r.student?._id || r.student) === String(studentId)
    );
    if (record) {
      attendance.push({ date: doc.date, status: record.status, class: doc.class, markedBy: doc.markedBy });
      recordedDateKeys.add(toDateKey(doc.date));
    }
  });

  // NEW: dono from & to diye ho to range ke Sunday/Holiday auto-present add karo
  if (fromDate && toDate) {
    const holidayDateSet = await getHolidayDateSet(fromDate, toDate);

    for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
      const key = toDateKey(d);
      if (recordedDateKeys.has(key)) continue;
      if (isNonWorkingDay(d, holidayDateSet)) {
        attendance.push({ date: new Date(d), status: "PRESENT", class: classId || null, markedBy: null, auto: true });
      }
    }

    attendance.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  const presentCount = attendance.filter((i) => i.status === "PRESENT").length;
  const absentCount = attendance.filter((i) => i.status === "ABSENT").length;
  const leaveCount = attendance.filter((i) => i.status === "LEAVE").length;
  const totalCount = attendance.length;
  const percentage = totalCount > 0 ? Number(((presentCount / totalCount) * 100).toFixed(2)) : 0;

  res.json(
    new ApiResponse(
      200,
      { attendance, summary: { total: totalCount, present: presentCount, absent: absentCount, leave: leaveCount, percentage } },
      "Student attendance fetched successfully"
    )
  );
});