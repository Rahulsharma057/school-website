const mongoose = require("mongoose");
const User = require("../models/User");
const StudentProfile = require("../models/StudentProfile");
const generateRollNumber = require("../utils/generateRollNumber");
const { hashPassword } = require("../services/authService");
const asyncHandler = require("../helpers/asyncHandler");
const ApiResponse = require("../helpers/ApiResponse");

// ================= CREATE STUDENT =================
// Sirf PRINCIPAL / ADMIN / SUPER_ADMIN access karenge (route me lagayenge)
//
// Parent linking — two ways, both optional:
//   1. Pass an existing `parentId` (old behaviour, unchanged). If
//      `parentPhone` is also given, we backfill it onto that parent —
//      handy for updating an old parent record that never had a phone.
//   2. Pass `parentName` + `parentEmail` (+ optional `parentPassword`,
//      `parentPhone`) and a brand-new User with role PARENT is created in
//      the same transaction and linked. This is what actually lets phone
//      numbers get into the system for the fee-reminder SMS feature,
//      since there was previously no "create parent" endpoint at all.
exports.createStudent = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    classId,
    address,
    dateOfBirth,
    parentId,
    parentName,
    parentEmail,
    parentPassword,
    parentPhone,
  } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // duplicate email check (student)
    const existingUser = await User.findOne({ email }).session(session);
    if (existingUser) {
      await session.abortTransaction();
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Email already registered"));
    }

    const hashedPassword = await hashPassword(password);

    // Step A: Student User create
    const newUser = await User.create(
      [
        {
          name,
          email,
          password: hashedPassword,
          role: "STUDENT",
          createdBy: req.user._id, // kisne banaya (Principal/Admin)
        },
      ],
      { session },
    );

    const createdUser = newUser[0];

    // Step B: Resolve the parent — create new, link existing, or none.
    let resolvedParentId = parentId || null;

    if (!parentId && parentName && parentEmail) {
      const existingParent = await User.findOne({ email: parentEmail }).session(
        session,
      );
      if (existingParent) {
        await session.abortTransaction();
        return res
          .status(400)
          .json(
            new ApiResponse(
              400,
              null,
              "A user with this parent email already exists — link them via parentId instead",
            ),
          );
      }

      const parentHashedPassword = await hashPassword(
        parentPassword || Math.random().toString(36).slice(-10),
      );

      const newParent = await User.create(
        [
          {
            name: parentName,
            email: parentEmail,
            phone: parentPhone || null,
            password: parentHashedPassword,
            role: "PARENT",
            createdBy: req.user._id,
          },
        ],
        { session },
      );

      resolvedParentId = newParent[0]._id;
    } else if (parentId && parentPhone) {
      // Existing parent, but we were given a phone — backfill it.
      await User.updateOne(
        { _id: parentId },
        { $set: { phone: parentPhone } },
      ).session(session);
    }

    // Step C: Roll number generate
    const rollNumber = await generateRollNumber(classId);

    // Step D: StudentProfile create
    const newProfile = await StudentProfile.create(
      [
        {
          user: createdUser._id,
          class: classId,
          rollNumber,
          address,
          dateOfBirth,
          parent: resolvedParentId,
        },
      ],
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    res.status(201).json(
      new ApiResponse(
        201,
        {
          user: createdUser,
          profile: newProfile[0],
        },
        "Student created successfully",
      ),
    );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error; // asyncHandler pakad lega
  }
});

// ================= STUDENT SELF PROFILE =================
// Sirf STUDENT role access karega (route me allowRoles("STUDENT") lagega)

exports.getMyProfile = asyncHandler(async (req, res) => {
  const profile = await StudentProfile.findOne({ user: req.user._id })
    .populate("class", "className section")
    .populate("user", "name email role")
    .populate("parent", "name email phone");

  if (!profile) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Student profile not found"));
  }

  res.json(
    new ApiResponse(200, profile, "Student profile fetched successfully"),
  );
});

// ================= GET STUDENTS BY CLASS =================
// Access: TEACHER, SUPER_ADMIN, ADMIN, PRINCIPAL

exports.getStudentsByClass = asyncHandler(async (req, res) => {
  const { classId } = req.params;

  const students = await StudentProfile.find({
    class: classId,
    status: "ACTIVE",
  })
    .populate("user", "name email")
    .sort({ rollNumber: 1 });

  res.json(new ApiResponse(200, students, "Students fetched successfully"));
});
