const mongoose = require("mongoose");
const StudentProfile = require("../models/StudentProfile");
const AcademicHistory = require("../models/AcademicHistory");
const Class = require("../models/Class");
const generateRollNumber = require("../utils/generateRollNumber");
const asyncHandler = require("../helpers/asyncHandler");
const ApiResponse = require("../helpers/ApiResponse");

// helper — current academic year nikalne ke liye (April-March pattern, India wala)
const getCurrentAcademicYear = () => {
  const now = new Date();
  const month = now.getMonth(); // 0 = Jan
  const year = now.getFullYear();
  // April (index 3) ke baad naya session shuru hota hai
  if (month >= 3) {
    return `${year}-${year + 1}`;
  }
  return `${year - 1}-${year}`;
};

// ================= GET STUDENTS OF A CLASS (for promotion screen) =================
// Access: SUPER_ADMIN, ADMIN, PRINCIPAL

exports.getClassStudentsForPromotion = asyncHandler(async (req, res) => {
  const { classId } = req.params;

  const students = await StudentProfile.find({ class: classId, status: "ACTIVE" })
    .populate("user", "name email")
    .populate("class", "className section")
    .sort({ rollNumber: 1 });

  res.json(new ApiResponse(200, students, "Students fetched for promotion"));
});

// ================= BULK PROMOTE =================
// Access: SUPER_ADMIN, ADMIN, PRINCIPAL
// Body: { promotions: [{ studentProfileId, result: "PROMOTED"/"HOLD_BACK"/"GRADUATED", newClassId (optional if HOLD_BACK/GRADUATED) }] }

exports.bulkPromote = asyncHandler(async (req, res) => {
  const { promotions } = req.body;

  if (!Array.isArray(promotions) || promotions.length === 0) {
    return res.status(400).json(
      new ApiResponse(400, null, "Promotions list is required")
    );
  }

  const academicYear = getCurrentAcademicYear();
  const results = [];

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    for (const item of promotions) {
      const { studentProfileId, result, newClassId } = item;

      const profile = await StudentProfile.findById(studentProfileId).session(session);
      if (!profile) continue; // skip agar mil hi nahi raha

      // Step A: History snapshot (purana data save)
      await AcademicHistory.create(
        [
          {
            student: profile.user,
            class: profile.class,
            rollNumber: profile.rollNumber,
            academicYear,
            result,
            promotedBy: req.user._id,
          },
        ],
        { session }
      );

      // Step B: Result ke hisaab se profile update
      if (result === "PROMOTED") {
        if (!newClassId) continue; // promoted karne ke liye newClassId zaroori hai

        const newRollNumber = await generateRollNumber(newClassId);

        profile.class = newClassId;
        profile.rollNumber = newRollNumber;
        await profile.save({ session });
      } else if (result === "HOLD_BACK") {
        // same class mein rahega, kuch change nahi (bas history save ho gaya)
      } else if (result === "GRADUATED") {
        profile.status = "GRADUATED";
        await profile.save({ session });
      }

      results.push({ studentProfileId, result });
    }

    await session.commitTransaction();
    session.endSession();

    res.json(new ApiResponse(200, results, "Promotion process completed"));
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

// ================= GET STUDENT'S ACADEMIC HISTORY =================
// Access: STUDENT (apna dekhe) ya STAFF (kisi ka bhi dekh sake)

exports.getStudentHistory = asyncHandler(async (req, res) => {
  // agar STUDENT khud dekh raha hai to apni hi history milegi
  const studentId = req.user.role === "STUDENT" ? req.user._id : req.params.studentId;

  const history = await AcademicHistory.find({ student: studentId })
    .populate("class", "className section")
    .sort({ createdAt: -1 });

  res.json(new ApiResponse(200, history, "Academic history fetched"));
});