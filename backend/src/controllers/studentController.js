const mongoose = require("mongoose");

const User = require("../models/User");
const StudentProfile = require("../models/StudentProfile");

const generateRollNumber = require("../utils/generateRollNumber");
const { hashPassword } = require("../services/authService");
const asyncHandler = require("../helpers/asyncHandler");
const ApiResponse = require("../helpers/ApiResponse");
const uploadToCloudinary = require("../utils/uploadToCloudinary");
const {
  streamStudentProfilePdf,
} = require("../utils/generateStudentProfilePdf");

// ======================================================
// NESTED FIELDS
// ======================================================

const NESTED_FIELD_KEYS = {
  emergencyContact: ["name", "phone", "relation"],
  address: ["street", "city", "state", "pincode"],
};

// ======================================================
// SAFE UPDATE PICKER
// IMPORTANT:
// Nested objects are converted to dot notation so existing
// fields do not get accidentally deleted.
// ======================================================

function pickAllowedUpdates(body = {}, allowedFields = []) {
  const updates = {};

  for (const field of allowedFields) {
    if (!Object.prototype.hasOwnProperty.call(body, field)) {
      continue;
    }

    if (NESTED_FIELD_KEYS[field]) {
      const incoming = body[field];

      if (
        incoming &&
        typeof incoming === "object" &&
        !Array.isArray(incoming)
      ) {
        for (const key of NESTED_FIELD_KEYS[field]) {
          if (Object.prototype.hasOwnProperty.call(incoming, key)) {
            updates[`${field}.${key}`] = incoming[key];
          }
        }
      }

      continue;
    }

    updates[field] = body[field];
  }

  return updates;
}

// ======================================================
// COMMON POPULATE
// ======================================================

const PROFILE_POPULATE = [
  {
    path: "class",
    select: "className section",
  },
  {
    path: "user",
    select: "name email role isActive createdAt",
  },
  {
    path: "parent",
    select: "name email phone",
  },
];

// ======================================================
// CREATE STUDENT
// ======================================================

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

    admissionNumber,
    admissionDate,
    previousSchool,
    house,
  } = req.body;

  if (!name || !email || !password || !classId) {
    return res.status(400).json(
      new ApiResponse(400, null, "name, email, password and classId are required"),
    );
  }

  // FIX: classId must be a real ObjectId, otherwise the later
  // StudentProfile.create() throws a raw CastError instead of a clean 400.
  if (!mongoose.Types.ObjectId.isValid(classId)) {
    return res.status(400).json(new ApiResponse(400, null, "Invalid class ID"));
  }

  // FIX: if an existing parentId is passed, it must actually exist and be
  // a PARENT user. Previously this was never checked, so a typo'd or
  // wrong-role ID would silently get saved as the student's parent ref.
  if (parentId) {
    if (!mongoose.Types.ObjectId.isValid(parentId)) {
      return res.status(400).json(new ApiResponse(400, null, "Invalid parent ID"));
    }
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // ==================================================
    // CHECK STUDENT USER
    // ==================================================

    const existingUser = await User.findOne({
      email: email.trim().toLowerCase(),
    }).session(session);

    if (existingUser) {
      await session.abortTransaction();
      return res.status(400).json(new ApiResponse(400, null, "Email already registered"));
    }

    // ==================================================
    // CREATE STUDENT USER
    // ==================================================

    const hashedPassword = await hashPassword(password);

    const newUser = await User.create(
      [
        {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password: hashedPassword,
          role: "STUDENT",
          createdBy: req.user._id,
        },
      ],
      { session },
    );

    const createdUser = newUser[0];

    // ==================================================
    // PARENT
    // ==================================================

    let resolvedParentId = null;

    if (parentId) {
      // FIX: validate the parent actually exists and has role PARENT
      const existingParentUser = await User.findOne({
        _id: parentId,
        role: "PARENT",
      }).session(session);

      if (!existingParentUser) {
        await session.abortTransaction();
        return res.status(400).json(
          new ApiResponse(400, null, "Parent not found with the given parentId"),
        );
      }

      resolvedParentId = existingParentUser._id;
    } else if (parentName && parentEmail) {
      const normalizedParentEmail = parentEmail.trim().toLowerCase();

      const existingParent = await User.findOne({
        email: normalizedParentEmail,
      }).session(session);

      if (existingParent) {
        await session.abortTransaction();
        return res.status(400).json(
          new ApiResponse(
            400,
            null,
            "A user with this parent email already exists. Please select the existing parent.",
          ),
        );
      }

      const parentHashedPassword = await hashPassword(
        parentPassword || Math.random().toString(36).slice(-10),
      );

      const newParent = await User.create(
        [
          {
            name: parentName.trim(),
            email: normalizedParentEmail,
            phone: parentPhone || "",
            password: parentHashedPassword,
            role: "PARENT",
            createdBy: req.user._id,
          },
        ],
        { session },
      );

      resolvedParentId = newParent[0]._id;
    }

    // ==================================================
    // EXISTING PARENT PHONE UPDATE
    // ==================================================

    if (parentId && parentPhone && resolvedParentId) {
      await User.updateOne(
        { _id: resolvedParentId, role: "PARENT" },
        { $set: { phone: parentPhone } },
        { session },
      );
    }

    // ==================================================
    // GENERATE ROLL NUMBER
    // ==================================================

    const rollNumber = await generateRollNumber(classId);

    // ==================================================
    // CREATE STUDENT PROFILE
    // ==================================================

    const newProfile = await StudentProfile.create(
      [
        {
          user: createdUser._id,
          class: classId,
          rollNumber,

          address: address || {},
          dateOfBirth: dateOfBirth || null,
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

    return res.status(201).json(
      new ApiResponse(
        201,
        { user: createdUser, profile: newProfile[0] },
        "Student created successfully",
      ),
    );
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    // FIX: duplicate roll number / duplicate class+roll can also happen here
    if (error?.code === 11000) {
      return res.status(409).json(
        new ApiResponse(409, null, "This roll number is already assigned in this class"),
      );
    }

    throw error;
  } finally {
    await session.endSession();
  }
});

// ======================================================
// GET MY PROFILE
// ======================================================

exports.getMyProfile = asyncHandler(async (req, res) => {
  const profile = await StudentProfile.findOne({
    user: req.user._id,
  }).populate(PROFILE_POPULATE);

  if (!profile) {
    return res.status(404).json(new ApiResponse(404, null, "Student profile not found"));
  }

  return res.json(new ApiResponse(200, profile, "Student profile fetched successfully"));
});

// ======================================================
// UPDATE MY PROFILE
// ======================================================

exports.updateMyProfile = asyncHandler(async (req, res) => {
  const updates = pickAllowedUpdates(req.body, StudentProfile.SELF_EDITABLE_FIELDS);

  if (Object.keys(updates).length === 0) {
    return res.status(400).json(new ApiResponse(400, null, "No editable fields provided"));
  }

  const profile = await StudentProfile.findOneAndUpdate(
    { user: req.user._id },
    { $set: updates },
    { new: true, runValidators: true },
  ).populate(PROFILE_POPULATE);

  if (!profile) {
    return res.status(404).json(new ApiResponse(404, null, "Student profile not found"));
  }

  return res.json(new ApiResponse(200, profile, "Profile updated successfully"));
});

// ======================================================
// UPDATE STUDENT BY ADMIN
// ======================================================

exports.updateStudentByAdmin = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    return res.status(400).json(new ApiResponse(400, null, "Invalid student ID"));
  }

  const updates = pickAllowedUpdates(req.body, StudentProfile.ADMIN_ONLY_FIELDS);

  if (Object.keys(updates).length === 0) {
    return res.status(400).json(new ApiResponse(400, null, "No admin-editable fields provided"));
  }

  // FIX: if `parent` is being reassigned here, validate it exists and is a PARENT
  // (same rule createStudent enforces — previously this route had no such check).
  if (Object.prototype.hasOwnProperty.call(updates, "parent") && updates.parent) {
    if (!mongoose.Types.ObjectId.isValid(updates.parent)) {
      return res.status(400).json(new ApiResponse(400, null, "Invalid parent ID"));
    }
    const parentUser = await User.findOne({ _id: updates.parent, role: "PARENT" });
    if (!parentUser) {
      return res.status(400).json(new ApiResponse(400, null, "Parent not found with the given ID"));
    }
  }

  // ==================================================
  // STATUS CONSISTENCY
  // ==================================================

  if (updates.status === "ACTIVE") {
    updates.leftDate = null;
    updates.leftReason = "";
  }

  if (updates.status === "LEFT" && !updates.leftDate) {
    updates.leftDate = new Date();
  }

  // ==================================================
  // UPDATE
  // FIX: wrapped in a transaction so the profile update and the linked
  // User.isActive toggle either both happen or neither does. Previously,
  // changing `status` here (e.g. PATCH /:studentId { status: "LEFT" })
  // updated the profile but left the student's login (User.isActive)
  // untouched — only the separate mark-left endpoint did that, so the
  // two "leave a student" code paths disagreed with each other.
  // ==================================================

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const profile = await StudentProfile.findByIdAndUpdate(
      studentId,
      { $set: updates },
      { new: true, runValidators: true, session },
    );

    if (!profile) {
      await session.abortTransaction();
      return res.status(404).json(new ApiResponse(404, null, "Student profile not found"));
    }

    if (updates.status === "LEFT") {
      await User.findByIdAndUpdate(profile.user, { isActive: false }, { session });
    } else if (updates.status === "ACTIVE") {
      await User.findByIdAndUpdate(profile.user, { isActive: true }, { session });
    }

    await session.commitTransaction();

    const populated = await StudentProfile.findById(profile._id).populate(PROFILE_POPULATE);

    return res.json(new ApiResponse(200, populated, "Student updated successfully"));
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    if (error?.code === 11000) {
      return res.status(409).json(
        new ApiResponse(409, null, "This roll number is already assigned in this class"),
      );
    }

    throw error;
  } finally {
    await session.endSession();
  }
});

// ======================================================
// GET ALL STUDENTS (admin, paginated + search + filters)
// FIX: the frontend studentService already called GET "/students" with
// page/limit/search/classId/status params, but no route or controller
// for it existed on the backend — every call would have 404'd. Added here.
// ======================================================

exports.getAllStudents = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const { search = "", classId = "", status = "" } = req.query;

  const filter = {};

  if (classId) {
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json(new ApiResponse(400, null, "Invalid class ID"));
    }
    filter.class = classId;
  }

  if (status) {
    filter.status = status;
  }

  if (search && search.trim()) {
    // Escape regex special characters so a search term like "a.b" or "(x)"
    // can't break the query or be (ab)used as a regex-injection.
    const term = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(term, "i");

    const matchingUsers = await User.find({
      role: "STUDENT",
      $or: [{ name: regex }, { email: regex }],
    }).select("_id");

    filter.$or = [
      { rollNumber: regex },
      { user: { $in: matchingUsers.map((u) => u._id) } },
    ];
  }

  const [students, total] = await Promise.all([
    StudentProfile.find(filter)
      .populate("user", "name email role isActive")
      .populate("parent", "name email phone")
      .populate("class", "className section")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    StudentProfile.countDocuments(filter),
  ]);

  return res.json(
    new ApiResponse(
      200,
      {
        students,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 0,
        },
      },
      "Students fetched successfully",
    ),
  );
});

// ======================================================
// GET STUDENTS BY CLASS
// ======================================================

exports.getStudentsByClass = asyncHandler(async (req, res) => {
  const { classId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(classId)) {
    return res.status(400).json(new ApiResponse(400, null, "Invalid class ID"));
  }

  const students = await StudentProfile.find({
    class: classId,
    status: "ACTIVE",
  })
    .populate("user", "name email role isActive")
    .populate("parent", "name email phone")
    .populate("class", "className section")
    .sort({ rollNumber: 1 });

  return res.json(new ApiResponse(200, students, "Students fetched successfully"));
});

// ======================================================
// GET STUDENT BY ID
// ======================================================

exports.getStudentById = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    return res.status(400).json(new ApiResponse(400, null, "Invalid student ID"));
  }

  const profile = await StudentProfile.findById(studentId).populate(PROFILE_POPULATE);

  if (!profile) {
    return res.status(404).json(new ApiResponse(404, null, "Student profile not found"));
  }

  return res.json(new ApiResponse(200, profile, "Student profile fetched successfully"));
});

// ======================================================
// UPLOAD AADHAR FRONT/BACK
// ======================================================

exports.uploadStudentAadhar = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    return res.status(400).json(new ApiResponse(400, null, "Invalid student ID"));
  }

  const frontFile = req.files?.aadharFront?.[0];
  const backFile = req.files?.aadharBack?.[0];

  if (!frontFile && !backFile) {
    return res.status(400).json(
      new ApiResponse(400, null, "Upload at least one of: aadharFront, aadharBack"),
    );
  }

  const profile = await StudentProfile.findById(studentId);

  if (!profile) {
    return res.status(404).json(new ApiResponse(404, null, "Student profile not found"));
  }

  if (frontFile) {
    const result = await uploadToCloudinary(frontFile, {
      folder: "school-website/aadhar-cards/students",
      resourceType: "auto",
    });
    profile.aadharFrontUrl = result.secure_url;
  }

  if (backFile) {
    const result = await uploadToCloudinary(backFile, {
      folder: "school-website/aadhar-cards/students",
      resourceType: "auto",
    });
    profile.aadharBackUrl = result.secure_url;
  }

  await profile.save();

  return res.json(
    new ApiResponse(
      200,
      { aadharFrontUrl: profile.aadharFrontUrl, aadharBackUrl: profile.aadharBackUrl },
      "Aadhar card uploaded successfully",
    ),
  );
});

// ======================================================
// UPLOAD OTHER DOCUMENTS (admin, on behalf of a student)
// ======================================================

exports.uploadStudentDocument = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  const type = req.body.type || "OTHER";
  const label = req.body.label || "";

  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    return res.status(400).json(new ApiResponse(400, null, "Invalid student ID"));
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json(new ApiResponse(400, null, "No files uploaded"));
  }

  if (!StudentProfile.DOCUMENT_TYPES.includes(type)) {
    return res.status(400).json(
      new ApiResponse(400, null, `Invalid document type. Allowed: ${StudentProfile.DOCUMENT_TYPES.join(", ")}`),
    );
  }

  if (type === "OTHER" && label.trim().length === 0) {
    return res.status(400).json(new ApiResponse(400, null, "Label is required when document type is OTHER"));
  }

  const profile = await StudentProfile.findById(studentId);

  if (!profile) {
    return res.status(404).json(new ApiResponse(404, null, "Student profile not found"));
  }

  const uploaded = [];

  for (const file of req.files) {
    const result = await uploadToCloudinary(file, {
      folder: "school-website/documents/students",
      resourceType: "auto",
    });

    const doc = {
      type,
      label: label.trim(),
      url: result.secure_url,
      originalName: file.originalname || "",
      uploadedBy: req.user._id,
      uploadedAt: new Date(),
    };

    profile.documents.push(doc);
    uploaded.push(doc);
  }

  await profile.save();

  return res.status(201).json(
    new ApiResponse(201, { documents: profile.documents, uploaded }, "Document(s) uploaded successfully"),
  );
});

// ======================================================
// DELETE OTHER DOCUMENT (admin)
// ======================================================

exports.deleteStudentDocument = asyncHandler(async (req, res) => {
  const { studentId, documentId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(studentId) || !mongoose.Types.ObjectId.isValid(documentId)) {
    return res.status(400).json(new ApiResponse(400, null, "Invalid student ID or document ID"));
  }

  const profile = await StudentProfile.findById(studentId);

  if (!profile) {
    return res.status(404).json(new ApiResponse(404, null, "Student profile not found"));
  }

  const doc = profile.documents.id(documentId);

  if (!doc) {
    return res.status(404).json(new ApiResponse(404, null, "Document not found"));
  }

  doc.deleteOne();
  await profile.save();

  return res.json(new ApiResponse(200, { documents: profile.documents }, "Document removed successfully"));
});

// ======================================================
// MY DOCUMENTS — student self-service (view / add / remove own uploads)
// FIX: previously students could only *see* their documents indirectly
// through getMyProfile, and had no way to add or remove one themselves.
// ======================================================

exports.getMyDocuments = asyncHandler(async (req, res) => {
  const profile = await StudentProfile.findOne({ user: req.user._id }).select("documents");

  if (!profile) {
    return res.status(404).json(new ApiResponse(404, null, "Student profile not found"));
  }

  return res.json(new ApiResponse(200, profile.documents, "Documents fetched successfully"));
});

exports.uploadMyDocument = asyncHandler(async (req, res) => {
  const type = req.body.type || "OTHER";
  const label = req.body.label || "";

  if (!req.files || req.files.length === 0) {
    return res.status(400).json(new ApiResponse(400, null, "No files uploaded"));
  }

  if (!StudentProfile.DOCUMENT_TYPES.includes(type)) {
    return res.status(400).json(
      new ApiResponse(400, null, `Invalid document type. Allowed: ${StudentProfile.DOCUMENT_TYPES.join(", ")}`),
    );
  }

  if (type === "OTHER" && label.trim().length === 0) {
    return res.status(400).json(new ApiResponse(400, null, "Label is required when document type is OTHER"));
  }

  const profile = await StudentProfile.findOne({ user: req.user._id });

  if (!profile) {
    return res.status(404).json(new ApiResponse(404, null, "Student profile not found"));
  }

  const uploaded = [];

  for (const file of req.files) {
    const result = await uploadToCloudinary(file, {
      folder: "school-website/documents/students",
      resourceType: "auto",
    });

    const doc = {
      type,
      label: label.trim(),
      url: result.secure_url,
      originalName: file.originalname || "",
      uploadedBy: req.user._id,
      uploadedAt: new Date(),
    };

    profile.documents.push(doc);
    uploaded.push(doc);
  }

  await profile.save();

  return res.status(201).json(
    new ApiResponse(201, { documents: profile.documents, uploaded }, "Document(s) uploaded successfully"),
  );
});

exports.deleteMyDocument = asyncHandler(async (req, res) => {
  const { documentId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(documentId)) {
    return res.status(400).json(new ApiResponse(400, null, "Invalid document ID"));
  }

  const profile = await StudentProfile.findOne({ user: req.user._id });

  if (!profile) {
    return res.status(404).json(new ApiResponse(404, null, "Student profile not found"));
  }

  const doc = profile.documents.id(documentId);

  if (!doc) {
    return res.status(404).json(new ApiResponse(404, null, "Document not found"));
  }

  // FIX: a student may only delete a document they themselves uploaded —
  // not admin-uploaded/verified certificates (birth certificate, marksheet, etc).
  if (String(doc.uploadedBy) !== String(req.user._id)) {
    return res.status(403).json(new ApiResponse(403, null, "You can only delete documents you uploaded"));
  }

  doc.deleteOne();
  await profile.save();

  return res.json(new ApiResponse(200, { documents: profile.documents }, "Document removed successfully"));
});

// ======================================================
// DOWNLOAD STUDENT PROFILE PDF — ADMIN
// ======================================================

exports.downloadStudentProfileByAdmin = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    return res.status(400).json(new ApiResponse(400, null, "Invalid student ID"));
  }

  const profile = await StudentProfile.findById(studentId).populate(PROFILE_POPULATE);

  if (!profile) {
    return res.status(404).json(new ApiResponse(404, null, "Student profile not found"));
  }

  const safeName = (profile.user?.name || "student")
    .replace(/[^a-z0-9]/gi, "_")
    .slice(0, 100);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${safeName}_profile.pdf"`);

  await streamStudentProfilePdf(profile.toObject(), res, {
    schoolName: process.env.SCHOOL_NAME || "School",
  });
});

// ======================================================
// DOWNLOAD MY PROFILE PDF
// ======================================================

exports.downloadMyProfile = asyncHandler(async (req, res) => {
  const profile = await StudentProfile.findOne({ user: req.user._id }).populate(PROFILE_POPULATE);

  if (!profile) {
    return res.status(404).json(new ApiResponse(404, null, "Student profile not found"));
  }

  const safeName = (profile.user?.name || "my_profile")
    .replace(/[^a-z0-9]/gi, "_")
    .slice(0, 100);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${safeName}_profile.pdf"`);

  await streamStudentProfilePdf(profile.toObject(), res, {
    schoolName: process.env.SCHOOL_NAME || "School",
  });
});

// ======================================================
// UPLOAD MY PROFILE PHOTO
// ======================================================

exports.uploadMyProfilePhoto = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json(new ApiResponse(400, null, "No profile photo uploaded"));
  }

  const profile = await StudentProfile.findOne({ user: req.user._id });

  if (!profile) {
    return res.status(404).json(new ApiResponse(404, null, "Student profile not found"));
  }

  const result = await uploadToCloudinary(req.file, {
    folder: "school-website/profile-photos/students",
    resourceType: "image",
  });

  profile.profilePhoto = result.secure_url;
  await profile.save();

  return res.json(
    new ApiResponse(200, { profilePhoto: profile.profilePhoto }, "Profile photo uploaded successfully"),
  );
});

// ======================================================
// DELETE STUDENT
// ======================================================

exports.deleteStudent = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    return res.status(400).json(new ApiResponse(400, null, "Invalid student ID"));
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const profile = await StudentProfile.findById(studentId).session(session);

    if (!profile) {
      await session.abortTransaction();
      return res.status(404).json(new ApiResponse(404, null, "Student profile not found"));
    }

    const userId = profile.user;

    await StudentProfile.deleteOne({ _id: profile._id }).session(session);
    await User.deleteOne({ _id: userId, role: "STUDENT" }).session(session);

    await session.commitTransaction();

    return res.json(new ApiResponse(200, null, "Student deleted successfully"));
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    await session.endSession();
  }
});

// ======================================================
// LIFECYCLE — MARK LEFT / REACTIVATE / LIST LEFT STUDENTS
// FIX: merged in from the separate studentLifecycleController so status
// changes and the linked User.isActive toggle always happen atomically
// (previously two sequential, non-transactional writes — if the second
// one failed, the profile and the login state could end up out of sync).
// ======================================================

exports.markStudentLeft = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json(new ApiResponse(400, null, "Invalid student ID"));
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const profile = await StudentProfile.findById(id).session(session);

    if (!profile) {
      await session.abortTransaction();
      return res.status(404).json(new ApiResponse(404, null, "Student profile not found"));
    }

    if (profile.status === "LEFT") {
      await session.abortTransaction();
      return res.status(400).json(new ApiResponse(400, null, "Student already marked as left"));
    }

    profile.status = "LEFT";
    profile.leftReason = reason || "";
    profile.leftDate = new Date();
    await profile.save({ session });

    await User.findByIdAndUpdate(profile.user, { isActive: false }, { session });

    await session.commitTransaction();

    return res.json(new ApiResponse(200, profile, "Student marked as left successfully"));
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    await session.endSession();
  }
});

exports.reactivateStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json(new ApiResponse(400, null, "Invalid student ID"));
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const profile = await StudentProfile.findById(id).session(session);

    if (!profile) {
      await session.abortTransaction();
      return res.status(404).json(new ApiResponse(404, null, "Student profile not found"));
    }

    if (profile.status === "ACTIVE") {
      await session.abortTransaction();
      return res.status(400).json(new ApiResponse(400, null, "Student is already active"));
    }

    profile.status = "ACTIVE";
    profile.leftReason = "";
    profile.leftDate = null;
    await profile.save({ session });

    await User.findByIdAndUpdate(profile.user, { isActive: true }, { session });

    await session.commitTransaction();

    return res.json(new ApiResponse(200, profile, "Student reactivated successfully"));
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    await session.endSession();
  }
});

exports.getLeftStudents = asyncHandler(async (req, res) => {
  const students = await StudentProfile.find({ status: "LEFT" })
    .populate("user", "name email")
    .populate("class", "className section")
    .sort({ leftDate: -1 });

  return res.json(new ApiResponse(200, students, "Left students fetched successfully"));
});
