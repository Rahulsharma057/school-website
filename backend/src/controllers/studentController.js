const mongoose = require("mongoose");
const User = require("../models/User");
const StudentProfile = require("../models/StudentProfile");
const generateRollNumber = require("../utils/generateRollNumber");
const { hashPassword } = require("../services/authService");
const asyncHandler = require("../helpers/asyncHandler");
const ApiResponse = require("../helpers/ApiResponse");
const documentUpload = require("../middlewares/documentUpload");
const uploadToCloudinary = require("../utils/uploadToCloudinary"); // ← existing helper, default export
// Nested-object fields jinke andar sirf specific keys allow karni hain
// (taaki koi extra/unwanted key body se slip na kare)
const NESTED_FIELD_KEYS = {
  emergencyContact: ["name", "phone", "relation"],
  address: ["street", "city", "state", "pincode"],
};

// body se sirf `allowedFields` list wale keys nikaal ke ek clean $set object banata hai.
// Nested objects (emergencyContact, address) ke liye sirf whitelisted sub-keys allow karta hai.
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
    // Admin-set-at-creation extras (optional, all admin-only fields anyway)
    admissionNumber,
    admissionDate,
    previousSchool,
    house,
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
          admissionNumber: admissionNumber || "",
          admissionDate: admissionDate || null,
          previousSchool: previousSchool || "",
          house: house || "",
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

// ================= STUDENT SELF PROFILE (VIEW) =================
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

// ================= STUDENT SELF PROFILE (UPDATE) =================
// Sirf STUDENT role — sirf apni profile, sirf SELF_EDITABLE_FIELDS.
// Koi admin-only field (class, rollNumber, status, admissionNumber, ...)
// is route se change nahi ho sakti, chahe body me bhej bhi de.

exports.updateMyProfile = asyncHandler(async (req, res) => {
  const updates = pickAllowedUpdates(
    req.body,
    StudentProfile.SELF_EDITABLE_FIELDS,
  );

  if (Object.keys(updates).length === 0) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "No editable fields provided"));
  }

  const profile = await StudentProfile.findOneAndUpdate(
    { user: req.user._id },
    { $set: updates },
    { new: true, runValidators: true },
  )
    .populate("class", "className section")
    .populate("user", "name email role")
    .populate("parent", "name email phone");

  if (!profile) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Student profile not found"));
  }

  res.json(new ApiResponse(200, profile, "Profile updated successfully"));
});

// ================= UPDATE STUDENT — ADMIN/PRINCIPAL =================
// Access: SUPER_ADMIN, ADMIN, PRINCIPAL
// Yeh admin-only fields ke liye hai (class, rollNumber, status, admissionNumber,
// admissionDate, previousSchool, house, dateOfBirth, leftReason, leftDate, parent).
// Agar rollNumber ya class change ho rahi hai to duplicate-index error
// (class+rollNumber unique) automatically Mongo se aayega — asyncHandler pakdega.

exports.updateStudentByAdmin = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  const updates = pickAllowedUpdates(req.body, StudentProfile.ADMIN_ONLY_FIELDS);

  if (Object.keys(updates).length === 0) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "No admin-editable fields provided"));
  }

  const profile = await StudentProfile.findByIdAndUpdate(
    studentId,
    { $set: updates },
    { new: true, runValidators: true },
  )
    .populate("class", "className section")
    .populate("user", "name email role")
    .populate("parent", "name email phone");

  if (!profile) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Student profile not found"));
  }

  res.json(new ApiResponse(200, profile, "Student updated successfully"));
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

// ================= UPLOAD AADHAR CARD (Student) =================
// Access: SUPER_ADMIN, ADMIN, PRINCIPAL only
// multipart/form-data: file (jpg/png/webp/pdf)

exports.uploadStudentAadhar = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  if (!req.file) {
    return res.status(400).json(new ApiResponse(400, null, "No file uploaded"));
  }

  const profile = await StudentProfile.findById(studentId);
  if (!profile) {
    return res.status(404).json(new ApiResponse(404, null, "Student profile not found"));
  }

  const result = await uploadToCloudinary(req.file, {
    folder: "school-website/aadhar-cards/students",
    resourceType: "auto", // image ya PDF, dono handle ho jayega
  });

  profile.aadharCardUrl = result.secure_url;
  await profile.save();

  res.json(new ApiResponse(200, { aadharCardUrl: profile.aadharCardUrl }, "Aadhar card uploaded successfully"));
});

// ================= UPLOAD MY PROFILE PHOTO =================
// Access: STUDENT only
// multipart/form-data: file

exports.uploadMyProfilePhoto = asyncHandler(async (req, res) => {
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

  const profile = await StudentProfile.findOne({
    user: req.user._id,
  });

  if (!profile) {
    return res
      .status(404)
      .json(
        new ApiResponse(
          404,
          null,
          "Student profile not found"
        )
      );
  }

  const result = await uploadToCloudinary(req.file, {
    folder: "school-website/profile-photos/students",
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
});