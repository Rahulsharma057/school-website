const mongoose = require("mongoose");
const User = require("../models/User");
const TeacherProfile = require("../models/TeacherProfile");
const { hashPassword } = require("../services/authService");
const asyncHandler = require("../helpers/asyncHandler");
const ApiResponse = require("../helpers/ApiResponse");

// ================= CREATE TEACHER =================
// Access: SUPER_ADMIN, ADMIN, PRINCIPAL

exports.createTeacher = asyncHandler(async (req, res) => {
  const { name, email, password, qualification, address, phone } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const existingUser = await User.findOne({ email }).session(session);
    if (existingUser) {
      await session.abortTransaction();
      return res.status(400).json(
        new ApiResponse(400, null, "Email already registered")
      );
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await User.create(
      [
        {
          name,
          email,
          password: hashedPassword,
          role: "TEACHER",
          createdBy: req.user._id,
        },
      ],
      { session }
    );

    const createdUser = newUser[0];

    const newProfile = await TeacherProfile.create(
      [
        {
          user: createdUser._id,
          qualification,
          address,
          phone,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    createdUser.password = undefined; // response se hatao

    res.status(201).json(
      new ApiResponse(
        201,
        { user: createdUser, profile: newProfile[0] },
        "Teacher created successfully"
      )
    );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

// ================= TEACHER SELF PROFILE =================
// Access: TEACHER only

exports.getMyTeacherProfile = asyncHandler(async (req, res) => {
  const profile = await TeacherProfile.findOne({ user: req.user._id }).populate(
    "user",
    "name email role"
  );

  if (!profile) {
    return res.status(404).json(new ApiResponse(404, null, "Teacher profile not found"));
  }

  res.json(new ApiResponse(200, profile, "Teacher profile fetched successfully"));
});

exports.getAllTeachers = asyncHandler(async (req, res) => {
  const teachers = await User.find({ role: "TEACHER", isActive: true }).select("name email");
  res.json(new ApiResponse(200, teachers, "Teachers fetched successfully"));
});