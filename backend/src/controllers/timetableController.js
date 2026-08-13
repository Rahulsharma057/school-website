const Timetable = require("../models/Timetable");
const PeriodSlot = require("../models/PeriodSlot");
const Class = require("../models/Class");
const User = require("../models/User");
const asyncHandler = require("../helpers/asyncHandler");
const ApiResponse = require("../helpers/ApiResponse");

// ================= ASSIGN / CREATE TIMETABLE ENTRY =================
// Access: SUPER_ADMIN, ADMIN, PRINCIPAL
// Body: { classId, day, periodId, subject, teacherId, allowOverride }

exports.createTimetableEntry = asyncHandler(async (req, res) => {
  const { classId, day, periodId, subject, teacherId, allowOverride } = req.body;

  // Step A: validate class, period, teacher exist
  const [classData, periodData, teacher] = await Promise.all([
    Class.findById(classId),
    PeriodSlot.findById(periodId),
    User.findById(teacherId),
  ]);

  if (!classData) return res.status(404).json(new ApiResponse(404, null, "Class not found"));
  if (!periodData) return res.status(404).json(new ApiResponse(404, null, "Period slot not found"));
  if (!teacher || teacher.role !== "TEACHER") {
    return res.status(400).json(new ApiResponse(400, null, "Invalid teacher"));
  }
  if (periodData.isBreak) {
    return res.status(400).json(new ApiResponse(400, null, "Cannot assign subject to a break period"));
  }

  // Step B: HARD check — ye class, is din, is period mein already kuch assigned hai?
  const classConflict = await Timetable.findOne({ class: classId, day, period: periodId });
  if (classConflict) {
    return res.status(409).json(
      new ApiResponse(409, null, "This class already has a subject assigned for this day & period. Edit or delete it first.")
    );
  }

  // Step C: SOFT check — ye teacher, is din, is period mein kahin aur bhi assigned hai?
  const teacherConflict = await Timetable.findOne({ teacher: teacherId, day, period: periodId })
    .populate("class", "className section");

  if (teacherConflict && !allowOverride) {
    return res.status(409).json(
      new ApiResponse(409, {
        conflictType: "TEACHER_DOUBLE_BOOKED",
        conflictWith: {
          class: `${teacherConflict.class?.className} - ${teacherConflict.class?.section}`,
          subject: teacherConflict.subject,
        },
      }, `${teacher.name} is already assigned to another class at this time. Enable override to proceed anyway.`)
    );
  }

  // Step D: create entry (agar override use hua ho to hasConflict mark karo)
  const entry = await Timetable.create({
    class: classId,
    day,
    period: periodId,
    subject,
    teacher: teacherId,
    hasConflict: !!(teacherConflict && allowOverride),
    createdBy: req.user._id,
  });

  const populated = await entry.populate([
    { path: "class", select: "className section" },
    { path: "period" },
    { path: "teacher", select: "name email" },
  ]);

  res.status(201).json(new ApiResponse(201, populated, "Timetable entry created successfully"));
});

// ================= UPDATE TIMETABLE ENTRY =================
// Access: SUPER_ADMIN, ADMIN, PRINCIPAL
// Body: { subject, teacherId, allowOverride }

exports.updateTimetableEntry = asyncHandler(async (req, res) => {
  const { subject, teacherId, allowOverride } = req.body;

  const entry = await Timetable.findById(req.params.id);
  if (!entry) {
    return res.status(404).json(new ApiResponse(404, null, "Timetable entry not found"));
  }

  const newTeacherId = teacherId || entry.teacher;

  if (teacherId) {
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== "TEACHER") {
      return res.status(400).json(new ApiResponse(400, null, "Invalid teacher"));
    }

    // teacher badla hai to conflict dobara check karo
    const teacherConflict = await Timetable.findOne({
      teacher: newTeacherId,
      day: entry.day,
      period: entry.period,
      _id: { $ne: entry._id },
    }).populate("class", "className section");

    if (teacherConflict && !allowOverride) {
      return res.status(409).json(
        new ApiResponse(409, {
          conflictType: "TEACHER_DOUBLE_BOOKED",
          conflictWith: {
            class: `${teacherConflict.class?.className} - ${teacherConflict.class?.section}`,
            subject: teacherConflict.subject,
          },
        }, `${teacher.name} is already assigned elsewhere at this time. Enable override to proceed.`)
      );
    }

    entry.hasConflict = !!(teacherConflict && allowOverride);
    entry.teacher = newTeacherId;
  }

  if (subject) entry.subject = subject;

  await entry.save();

  const populated = await entry.populate([
    { path: "class", select: "className section" },
    { path: "period" },
    { path: "teacher", select: "name email" },
  ]);

  res.json(new ApiResponse(200, populated, "Timetable entry updated successfully"));
});

// ================= DELETE TIMETABLE ENTRY =================
// Access: SUPER_ADMIN, ADMIN, PRINCIPAL

exports.deleteTimetableEntry = asyncHandler(async (req, res) => {
  const entry = await Timetable.findById(req.params.id);
  if (!entry) {
    return res.status(404).json(new ApiResponse(404, null, "Timetable entry not found"));
  }

  await entry.deleteOne();

  res.json(new ApiResponse(200, null, "Timetable entry deleted successfully"));
});

// ================= GET CLASS TIMETABLE (full week grid) =================
// Access: SUPER_ADMIN, ADMIN, PRINCIPAL, TEACHER, STUDENT (apni class ki)

exports.getClassTimetable = asyncHandler(async (req, res) => {
  const { classId } = req.params;

  const entries = await Timetable.find({ class: classId })
    .populate("period")
    .populate("teacher", "name email")
    .sort({ day: 1 });

  res.json(new ApiResponse(200, entries, "Class timetable fetched successfully"));
});

// ================= GET TEACHER TIMETABLE (apna schedule) =================
// Access: TEACHER (apna khud)

exports.getMyTimetable = asyncHandler(async (req, res) => {
  const entries = await Timetable.find({ teacher: req.user._id })
    .populate("class", "className section")
    .populate("period")
    .sort({ day: 1 });

  res.json(new ApiResponse(200, entries, "Your timetable fetched successfully"));
});

// ================= GET STUDENT'S CLASS TIMETABLE =================
// Access: STUDENT (apni class ki)

exports.getMyClassTimetable = asyncHandler(async (req, res) => {
  const StudentProfile = require("../models/StudentProfile");

  const profile = await StudentProfile.findOne({ user: req.user._id });
  if (!profile) {
    return res.status(404).json(new ApiResponse(404, null, "Student profile not found"));
  }

  const entries = await Timetable.find({ class: profile.class })
    .populate("period")
    .populate("teacher", "name email")
    .sort({ day: 1 });

  res.json(new ApiResponse(200, entries, "Timetable fetched successfully"));
});