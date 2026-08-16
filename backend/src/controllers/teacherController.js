const mongoose = require("mongoose");
const User = require("../models/User");
const TeacherProfile = require("../models/TeacherProfile");
const { hashPassword } = require("../services/authService");
const asyncHandler = require("../helpers/asyncHandler");
const ApiResponse = require("../helpers/ApiResponse");

const documentUpload = require("../middlewares/documentUpload");
const uploadToCloudinary = require("../utils/uploadToCloudinary");
// Nested-object fields jinke andar sirf specific keys allow karni hain
const NESTED_FIELD_KEYS = {
  emergencyContact: ["name", "phone", "relation"],
  address: ["street", "city", "state", "pincode"],
};

// body se sirf `allowedFields` list wale keys nikaal ke ek clean $set object banata hai.
function pickAllowedUpdates(body, allowedFields) {
  const updates = {};

  for (const field of allowedFields) {
    if (!(field in body)) continue;

    if (NESTED_FIELD_KEYS[field]) {
      const incoming = body[field];
      if (incoming && typeof incoming === "object" && !Array.isArray(incoming)) {
        const cleanNested = {};
        for (const key of NESTED_FIELD_KEYS[field]) {
          if (key in incoming) cleanNested[key] = incoming[key];
        }
        updates[field] = cleanNested;
      }
      continue;
    }

    updates[field] = body[field];
  }

  return updates;
}

// ================= CREATE TEACHER =================
// Access: SUPER_ADMIN, ADMIN, PRINCIPAL

exports.createTeacher = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    qualification,
    address,
    phone,
    // Admin-set-at-creation extras (optional, all admin-only fields anyway)
    employeeId,
    joiningDate,
    experienceYears,
    subjects,
  } = req.body;

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
          employeeId: employeeId || "",
          joiningDate: joiningDate || null,
          experienceYears: experienceYears || 0,
          subjects: Array.isArray(subjects) ? subjects : [],
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

// ================= TEACHER SELF PROFILE (VIEW) =================
// Access: TEACHER only

exports.getMyTeacherProfile = asyncHandler(async (req, res) => {
  const profile = await TeacherProfile.findOne({ user: req.user._id })
    .populate("user", "name email role")
    .populate("classTeacherOf", "className section");

  if (!profile) {
    return res.status(404).json(new ApiResponse(404, null, "Teacher profile not found"));
  }

  res.json(new ApiResponse(200, profile, "Teacher profile fetched successfully"));
});

// ================= TEACHER SELF PROFILE (UPDATE) =================
// Access: TEACHER only — sirf SELF_EDITABLE_FIELDS.
// Admin-only fields (qualification, status, employeeId, subjects,
// classTeacherOf, joiningDate, experienceYears, ...) yahan se change nahi
// ho sakti chahe body me bhej bhi de.

exports.updateMyTeacherProfile = asyncHandler(async (req, res) => {
  const updates = pickAllowedUpdates(
    req.body,
    TeacherProfile.SELF_EDITABLE_FIELDS,
  );

  if (Object.keys(updates).length === 0) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "No editable fields provided"));
  }

  const profile = await TeacherProfile.findOneAndUpdate(
    { user: req.user._id },
    { $set: updates },
    { new: true, runValidators: true },
  )
    .populate("user", "name email role")
    .populate("classTeacherOf", "className section");

  if (!profile) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Teacher profile not found"));
  }

  res.json(new ApiResponse(200, profile, "Profile updated successfully"));
});

// ================= UPDATE TEACHER — ADMIN/PRINCIPAL =================
// Access: SUPER_ADMIN, ADMIN, PRINCIPAL
// Admin-only fields ke liye (qualification, status, employeeId, joiningDate,
// experienceYears, subjects, classTeacherOf, leftReason, leftDate).

exports.updateTeacherByAdmin = asyncHandler(async (req, res) => {
  const { teacherId } = req.params;

  const updates = pickAllowedUpdates(req.body, TeacherProfile.ADMIN_ONLY_FIELDS);

  if (Object.keys(updates).length === 0) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "No admin-editable fields provided"));
  }

  const profile = await TeacherProfile.findByIdAndUpdate(
    teacherId,
    { $set: updates },
    { new: true, runValidators: true },
  )
    .populate("user", "name email role")
    .populate("classTeacherOf", "className section");

  if (!profile) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Teacher profile not found"));
  }

  res.json(new ApiResponse(200, profile, "Teacher updated successfully"));
});

exports.getAllTeachers = asyncHandler(async (req, res) => {
  const teachers = await User.find({ role: "TEACHER", isActive: true }).select("name email");
  res.json(new ApiResponse(200, teachers, "Teachers fetched successfully"));
});


exports.uploadTeacherAadhar = asyncHandler(async (req, res) => {
  const { teacherId } = req.params;

  if (!req.file) {
    return res.status(400).json(new ApiResponse(400, null, "No file uploaded"));
  }

  const profile = await TeacherProfile.findById(teacherId);
  if (!profile) {
    return res.status(404).json(new ApiResponse(404, null, "Teacher profile not found"));
  }

  const result = await uploadToCloudinary(req.file, {
    folder: "school-website/aadhar-cards/teachers",
    resourceType: "auto",
  });

  profile.aadharCardUrl = result.secure_url;
  await profile.save();

  res.json(new ApiResponse(200, { aadharCardUrl: profile.aadharCardUrl }, "Aadhar card uploaded successfully"));
});

// ================= UPLOAD MY PROFILE PHOTO =================
// Access: TEACHER only
// multipart/form-data
// field name: file

exports.uploadMyTeacherProfilePhoto = asyncHandler(
  async (req, res) => {
    if (!req.file) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            null,
            "No profile photo uploaded"
          )
        );
    }

    const profile = await TeacherProfile.findOne({
      user: req.user._id,
    });

    if (!profile) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            null,
            "Teacher profile not found"
          )
        );
    }

    const result = await uploadToCloudinary(req.file, {
      folder: "school-website/profile-photos/teachers",
      resourceType: "image",
    });

    profile.profilePhoto = result.secure_url;

    await profile.save();

    res.json(
      new ApiResponse(
        200,
        {
          profilePhoto: profile.profilePhoto,
        },
        "Profile photo uploaded successfully"
      )
    );
  }
);