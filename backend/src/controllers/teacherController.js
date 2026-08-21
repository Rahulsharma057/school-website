const mongoose = require("mongoose");

const User = require("../models/User");
const TeacherProfile = require("../models/TeacherProfile");

const { hashPassword } = require("../services/authService");
const asyncHandler = require("../helpers/asyncHandler");
const ApiResponse = require("../helpers/ApiResponse");

const uploadToCloudinary = require("../utils/uploadToCloudinary");

// ======================================================
// NESTED FIELD KEYS
// ======================================================

const NESTED_FIELD_KEYS = {
  emergencyContact: ["name", "phone", "relation"],

  address: ["street", "city", "state", "pincode"],
};

// ======================================================
// COMMON POPULATE
// ======================================================

const TEACHER_POPULATE = {
  path: "user",
  select: "name email role phone isActive createdAt",
};

// ======================================================
// VALIDATION HELPERS
// FIX: PHONE_REGEX and PINCODE_REGEX previously did NOT match the
// validators on the TeacherProfile model. A value could pass every check
// here, get sent to TeacherProfile.create()/findByIdAndUpdate(), and then
// fail Mongoose's own schema validation — surfacing as a raw, unhandled
// ValidationError (typically a confusing 500) instead of the clean 400
// this function exists to produce. Aligned both regexes to the model's.
// ======================================================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PHONE_REGEX = /^[6-9]\d{9}$/;

const PINCODE_REGEX = /^[1-9]\d{5}$/;

const AADHAR_REGEX = /^\d{12}$/;

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

const ALLOWED_EMPLOYMENT_TYPES = [
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "GUEST",
];

const ALLOWED_STATUS = ["ACTIVE", "LEFT"];

const ALLOWED_CATEGORY = ["", "GENERAL", "OBC", "SC", "ST", "EWS"];

const ALLOWED_GENDER = ["", "MALE", "FEMALE", "OTHER"];

const ALLOWED_BLOOD_GROUP = [
  "",
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
];

const ALLOWED_MARITAL_STATUS = [
  "",
  "SINGLE",
  "MARRIED",
  "DIVORCED",
  "WIDOWED",
];

function isValidDate(value) {
  if (!value) return true;

  const date = new Date(value);

  return !Number.isNaN(date.getTime());
}

function validatePhone(value, fieldName = "phone") {
  if (!value) return null;

  if (!PHONE_REGEX.test(String(value).trim())) {
    return `${fieldName} must be a valid 10-digit Indian mobile number`;
  }

  return null;
}

// ======================================================
// NORMALIZE IDENTITY / CONTACT FIELDS
// FIX: was missing entirely. Aadhar numbers are very commonly typed or
// pasted with spaces ("1234 5678 9012") — the model's schema only
// auto-trims leading/trailing whitespace, not internal spaces, so a
// spaced Aadhar would previously pass this controller's validation
// (which stripped spaces only for the *check*) and then fail at the
// database layer when the *unstripped* value was actually saved.
// Mutates `data` in place so both validation and the later
// pickAllowedUpdates()/direct-assignment code paths see the same
// cleaned value.
// ======================================================

function normalizeTeacherData(data = {}) {
  if (data.aadharNumber) {
    data.aadharNumber = String(data.aadharNumber).replace(/\s+/g, "");
  }

  if (data.phone) {
    data.phone = String(data.phone).trim();
  }

  if (data.alternatePhone) {
    data.alternatePhone = String(data.alternatePhone).trim();
  }

  if (data.emergencyContact?.phone) {
    data.emergencyContact.phone = String(
      data.emergencyContact.phone,
    ).trim();
  }

  if (data.panNumber) {
    data.panNumber = String(data.panNumber).trim().toUpperCase();
  }

  if (data.ifsc) {
    data.ifsc = String(data.ifsc).trim().toUpperCase();
  }

  return data;
}

function validateTeacherData(data = {}, { create = false } = {}) {
  const errors = [];

  // ==================================================
  // REQUIRED CREATE FIELDS
  // ==================================================

  if (create) {
    if (!data.name || !String(data.name).trim()) {
      errors.push("Name is required");
    }

    if (!data.email || !String(data.email).trim()) {
      errors.push("Email is required");
    }

    if (!data.password || String(data.password).length < 6) {
      errors.push("Password must be at least 6 characters");
    }
  }

  // ==================================================
  // EMAIL
  // ==================================================

  if (data.email && !EMAIL_REGEX.test(String(data.email).trim())) {
    errors.push("Invalid email address");
  }

  if (
    data.personalEmail &&
    !EMAIL_REGEX.test(String(data.personalEmail).trim())
  ) {
    errors.push("Invalid personal email address");
  }

  // ==================================================
  // PHONE
  // ==================================================

  const phoneError = validatePhone(data.phone, "Phone");
  if (phoneError) errors.push(phoneError);

  const alternatePhoneError = validatePhone(
    data.alternatePhone,
    "Alternate phone",
  );

  if (alternatePhoneError) {
    errors.push(alternatePhoneError);
  }

  if (data.emergencyContact?.phone) {
    const emergencyPhoneError = validatePhone(
      data.emergencyContact.phone,
      "Emergency contact phone",
    );

    if (emergencyPhoneError) {
      errors.push(emergencyPhoneError);
    }
  }

  // ==================================================
  // EMPLOYMENT TYPE
  // ==================================================

  if (
    data.employmentType &&
    !ALLOWED_EMPLOYMENT_TYPES.includes(data.employmentType)
  ) {
    errors.push("Invalid employment type");
  }

  // ==================================================
  // STATUS
  // ==================================================

  if (data.status && !ALLOWED_STATUS.includes(data.status)) {
    errors.push("Invalid teacher status");
  }

  // ==================================================
  // EXPERIENCE
  // ==================================================

  if (
    data.experienceYears !== undefined &&
    data.experienceYears !== null &&
    data.experienceYears !== ""
  ) {
    const experience = Number(data.experienceYears);

    if (Number.isNaN(experience) || experience < 0 || experience > 60) {
      errors.push("Experience years must be between 0 and 60");
    }
  }

  // ==================================================
  // PINCODE
  // ==================================================

  if (data.address?.pincode) {
    if (!PINCODE_REGEX.test(String(data.address.pincode).trim())) {
      errors.push("Invalid address pincode");
    }
  }

  // ==================================================
  // AADHAR
  // ==================================================

  if (data.aadharNumber) {
    if (!AADHAR_REGEX.test(String(data.aadharNumber).replace(/\s/g, ""))) {
      errors.push("Aadhar number must contain exactly 12 digits");
    }
  }

  // ==================================================
  // PAN
  // ==================================================

  if (data.panNumber) {
    if (!PAN_REGEX.test(String(data.panNumber).trim().toUpperCase())) {
      errors.push("Invalid PAN number");
    }
  }

  // ==================================================
  // IFSC
  // ==================================================

  if (data.ifsc) {
    if (!IFSC_REGEX.test(String(data.ifsc).trim().toUpperCase())) {
      errors.push("Invalid IFSC code");
    }
  }

  // ==================================================
  // ENUMS
  // ==================================================

  if (data.category !== undefined && !ALLOWED_CATEGORY.includes(data.category)) {
    errors.push("Invalid category");
  }

  if (data.gender !== undefined && !ALLOWED_GENDER.includes(data.gender)) {
    errors.push("Invalid gender");
  }

  if (
    data.bloodGroup !== undefined &&
    !ALLOWED_BLOOD_GROUP.includes(data.bloodGroup)
  ) {
    errors.push("Invalid blood group");
  }

  if (
    data.maritalStatus !== undefined &&
    !ALLOWED_MARITAL_STATUS.includes(data.maritalStatus)
  ) {
    errors.push("Invalid marital status");
  }

  // ==================================================
  // DATES
  // ==================================================

  if (data.joiningDate && !isValidDate(data.joiningDate)) {
    errors.push("Invalid joining date");
  }

  if (data.dateOfBirth && !isValidDate(data.dateOfBirth)) {
    errors.push("Invalid date of birth");
  }

  if (data.leftDate && !isValidDate(data.leftDate)) {
    errors.push("Invalid left date");
  }

  // ==================================================
  // DOB SHOULD NOT BE FUTURE
  // ==================================================

  if (data.dateOfBirth) {
    const dob = new Date(data.dateOfBirth);

    if (dob > new Date()) {
      errors.push("Date of birth cannot be in the future");
    }
  }

  return errors;
}

// ======================================================
// DUPLICATE-KEY ERROR MESSAGE
// FIX: TeacherProfile now has partial-unique indexes on employeeId,
// aadharNumber and panNumber (in addition to the existing email/user
// uniqueness). Previously every 11000 error was reported with the same
// generic "Teacher email or profile already exists" message — which
// would now be actively misleading if, say, an admin re-used an existing
// employeeId. This inspects which key collided and reports that.
// ======================================================

const DUPLICATE_FIELD_LABELS = {
  email: "Email",
  user: "This user",
  employeeId: "Employee ID",
  aadharNumber: "Aadhar number",
  panNumber: "PAN number",
};

function duplicateKeyMessage(error) {
  const field = error?.keyPattern
    ? Object.keys(error.keyPattern)[0]
    : null;

  const label = DUPLICATE_FIELD_LABELS[field] || "This value";

  return `${label} is already in use by another teacher`;
}

// ======================================================
// PICK ALLOWED UPDATES
// IMPORTANT:
// Nested fields use dot notation so existing fields
// don't accidentally get deleted.
// ======================================================

function pickAllowedUpdates(body = {}, allowedFields = []) {
  const updates = {};

  for (const field of allowedFields) {
    if (!Object.prototype.hasOwnProperty.call(body, field)) {
      continue;
    }

    // Nested object
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
// CREATE TEACHER
// SUPER_ADMIN / ADMIN / PRINCIPAL
// ======================================================

exports.createTeacher = asyncHandler(async (req, res) => {
  // FIX: normalize before validating, so the value validated is the
  // same value that ends up saved.
  normalizeTeacherData(req.body);

  const {
    name,
    email,
    password,

    qualification,
    specialization,
    employmentType,
    previousInstitutions,

    address,
    phone,
    alternatePhone,
    personalEmail,
    emergencyContact,

    employeeId,
    joiningDate,
    experienceYears,

    aadharNumber,
    panNumber,
    nationality,
    category,
    religion,
    dateOfBirth,
    gender,
    bloodGroup,
    maritalStatus,

    bankAccount,
    ifsc,
    bankName,
    accountHolderName,
  } = req.body;

  // ==================================================
  // VALIDATION
  // ==================================================

  const validationErrors = validateTeacherData(req.body, { create: true });

  if (validationErrors.length > 0) {
    return res.status(400).json(
      new ApiResponse(400, null, validationErrors.join(", ")),
    );
  }

  if (
    previousInstitutions !== undefined &&
    !Array.isArray(previousInstitutions)
  ) {
    return res.status(400).json(
      new ApiResponse(400, null, "previousInstitutions must be an array"),
    );
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // ==================================================
    // CHECK EMAIL
    // ==================================================

    const existingUser = await User.findOne({
      email: normalizedEmail,
    }).session(session);

    if (existingUser) {
      await session.abortTransaction();

      return res.status(400).json(
        new ApiResponse(400, null, "Email already registered"),
      );
    }

    // ==================================================
    // HASH PASSWORD
    // ==================================================

    const hashedPassword = await hashPassword(password);

    // ==================================================
    // CREATE USER
    // ==================================================

    const newUser = await User.create(
      [
        {
          name: String(name).trim(),
          email: normalizedEmail,
          password: hashedPassword,
          role: "TEACHER",
          createdBy: req.user._id,
          isActive: true,
        },
      ],
      { session },
    );

    const createdUser = newUser[0];

    // ==================================================
    // CREATE TEACHER PROFILE
    // ==================================================

    const newProfile = await TeacherProfile.create(
      [
        {
          user: createdUser._id,

          // Professional
          qualification: qualification || "",
          specialization: specialization || "",
          employmentType: employmentType || "FULL_TIME",

          previousInstitutions: Array.isArray(previousInstitutions)
            ? previousInstitutions
            : [],

          // Contact
          address: address || {},
          phone: phone || "",
          alternatePhone: alternatePhone || "",
          personalEmail: personalEmail || "",
          emergencyContact: emergencyContact || {},

          // Employment
          employeeId: employeeId || "",
          joiningDate: joiningDate || null,
          experienceYears: Number(experienceYears) || 0,

          // Identity
          aadharNumber: aadharNumber || "",
          panNumber: panNumber || "",
          nationality: nationality || "Indian",
          category: category || "",
          religion: religion || "",
          dateOfBirth: dateOfBirth || null,
          gender: gender || "",
          bloodGroup: bloodGroup || "",
          maritalStatus: maritalStatus || "",

          // Payroll
          bankAccount: bankAccount || "",
          ifsc: ifsc || "",
          bankName: bankName || "",
          accountHolderName: accountHolderName || "",

          status: "ACTIVE",
        },
      ],
      { session },
    );

    await session.commitTransaction();

    createdUser.password = undefined;

    return res.status(201).json(
      new ApiResponse(
        201,
        { user: createdUser, profile: newProfile[0] },
        "Teacher created successfully",
      ),
    );
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    if (error?.code === 11000) {
      return res.status(409).json(
        new ApiResponse(409, null, duplicateKeyMessage(error)),
      );
    }

    throw error;
  } finally {
    await session.endSession();
  }
});

// ======================================================
// GET MY TEACHER PROFILE
// ======================================================

exports.getMyTeacherProfile = asyncHandler(async (req, res) => {
  const profile = await TeacherProfile.findOne({
    user: req.user._id,
  }).populate(TEACHER_POPULATE);

  if (!profile) {
    return res.status(404).json(
      new ApiResponse(404, null, "Teacher profile not found"),
    );
  }

  return res.json(
    new ApiResponse(200, profile, "Teacher profile fetched successfully"),
  );
});

// ======================================================
// TEACHER SELF UPDATE
// ======================================================

exports.updateMyTeacherProfile = asyncHandler(async (req, res) => {
  const updates = pickAllowedUpdates(
    req.body,
    TeacherProfile.SELF_EDITABLE_FIELDS,
  );

  if (Object.keys(updates).length === 0) {
    return res.status(400).json(
      new ApiResponse(400, null, "No editable fields provided"),
    );
  }

  // bio validation
  if (updates.bio !== undefined && String(updates.bio).length > 300) {
    return res.status(400).json(
      new ApiResponse(400, null, "Bio cannot exceed 300 characters"),
    );
  }

  const profile = await TeacherProfile.findOneAndUpdate(
    { user: req.user._id },
    { $set: updates },
    { new: true, runValidators: true },
  ).populate(TEACHER_POPULATE);

  if (!profile) {
    return res.status(404).json(
      new ApiResponse(404, null, "Teacher profile not found"),
    );
  }

  return res.json(
    new ApiResponse(200, profile, "Profile updated successfully"),
  );
});

// ======================================================
// ADMIN UPDATE TEACHER
// SUPER_ADMIN / ADMIN / PRINCIPAL
// ======================================================

exports.updateTeacherByAdmin = asyncHandler(async (req, res) => {
  const { teacherId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(teacherId)) {
    return res.status(400).json(
      new ApiResponse(400, null, "Invalid teacher ID"),
    );
  }

  // FIX: normalize before validating/picking, same reasoning as createTeacher.
  normalizeTeacherData(req.body);

  // ==================================================
  // VALIDATE ONLY FIELDS THAT ARE BEING UPDATED
  // ==================================================

  const validationErrors = validateTeacherData(req.body);

  if (validationErrors.length > 0) {
    return res.status(400).json(
      new ApiResponse(400, null, validationErrors.join(", ")),
    );
  }

  if (
    req.body.previousInstitutions !== undefined &&
    !Array.isArray(req.body.previousInstitutions)
  ) {
    return res.status(400).json(
      new ApiResponse(400, null, "previousInstitutions must be an array"),
    );
  }

  const updates = pickAllowedUpdates(
    req.body,
    TeacherProfile.ADMIN_ONLY_FIELDS,
  );

  if (Object.keys(updates).length === 0) {
    return res.status(400).json(
      new ApiResponse(400, null, "No admin-editable fields provided"),
    );
  }

  // ==================================================
  // STATUS CONSISTENCY
  // ==================================================

  if (updates.status === "ACTIVE") {
    updates.leftDate = null;
    updates.leftReason = "";
  }

  if (updates.status === "LEFT") {
    if (!updates.leftDate) {
      updates.leftDate = new Date();
    }
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const profile = await TeacherProfile.findByIdAndUpdate(
      teacherId,
      { $set: updates },
      { new: true, runValidators: true, session },
    );

    if (!profile) {
      await session.abortTransaction();

      return res.status(404).json(
        new ApiResponse(404, null, "Teacher profile not found"),
      );
    }

    // ==================================================
    // LOGIN STATUS SYNC
    // ==================================================

    if (updates.status === "LEFT") {
      await User.findByIdAndUpdate(
        profile.user,
        { isActive: false },
        { session },
      );
    }

    if (updates.status === "ACTIVE") {
      await User.findByIdAndUpdate(
        profile.user,
        { isActive: true },
        { session },
      );
    }

    await session.commitTransaction();

    const populated = await TeacherProfile.findById(profile._id).populate(
      TEACHER_POPULATE,
    );

    return res.json(
      new ApiResponse(200, populated, "Teacher updated successfully"),
    );
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    // FIX: was missing here (only createTeacher handled 11000). An admin
    // editing an existing teacher's employeeId/aadhar/pan into a value
    // that collides with another teacher would previously bubble up as
    // an unhandled 500.
    if (error?.code === 11000) {
      return res.status(409).json(
        new ApiResponse(409, null, duplicateKeyMessage(error)),
      );
    }

    throw error;
  } finally {
    await session.endSession();
  }
});

// ======================================================
// GET ALL TEACHERS
// ADMIN / PRINCIPAL / SUPER_ADMIN
// ======================================================

exports.getAllTeachers = asyncHandler(async (req, res) => {
  const teachers = await TeacherProfile.find()
    .populate(TEACHER_POPULATE)
    .sort({ createdAt: -1 });

  return res.json(
    new ApiResponse(200, teachers, "Teachers fetched successfully"),
  );
});

// ======================================================
// GET TEACHER BY ID
// ======================================================

exports.getTeacherById = asyncHandler(async (req, res) => {
  const { teacherId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(teacherId)) {
    return res.status(400).json(
      new ApiResponse(400, null, "Invalid teacher ID"),
    );
  }

  const profile = await TeacherProfile.findById(teacherId).populate(
    TEACHER_POPULATE,
  );

  if (!profile) {
    return res.status(404).json(
      new ApiResponse(404, null, "Teacher profile not found"),
    );
  }

  return res.json(
    new ApiResponse(200, profile, "Teacher profile fetched successfully"),
  );
});

// ======================================================
// TEACHER DOCUMENT TYPES
// IMPORTANT: EXACTLY MATCH SCHEMA
// ======================================================

const ALLOWED_DOCUMENTS = [
  "aadharCard",
  "panCard",
  "resume",
  "degreeCertificates",
  "experienceCertificates",
  "offerLetter",
  "joiningLetter",
  "appointmentLetter",
  "otherDocuments",
];

const ARRAY_DOCUMENT_TYPES = [
  "degreeCertificates",
  "experienceCertificates",
  "otherDocuments",
];

// ======================================================
// UPLOAD TEACHER DOCUMENT
// ADMIN / PRINCIPAL / SUPER_ADMIN
// ======================================================

exports.uploadTeacherDocument = asyncHandler(async (req, res) => {
  const { teacherId } = req.params;

  const { documentType, documentName } = req.body;

  // ==================================================
  // VALIDATE TEACHER ID
  // ==================================================

  if (!mongoose.Types.ObjectId.isValid(teacherId)) {
    return res.status(400).json(
      new ApiResponse(400, null, "Invalid teacher ID"),
    );
  }

  // ==================================================
  // VALIDATE DOCUMENT TYPE
  // ==================================================

  if (!documentType || !ALLOWED_DOCUMENTS.includes(documentType)) {
    return res.status(400).json(
      new ApiResponse(
        400,
        null,
        `Invalid document type. Allowed: ${ALLOWED_DOCUMENTS.join(", ")}`,
      ),
    );
  }

  // ==================================================
  // OTHER DOCUMENT NAME
  // ==================================================

  if (
    documentType === "otherDocuments" &&
    (!documentName || !String(documentName).trim())
  ) {
    return res.status(400).json(
      new ApiResponse(400, null, "documentName is required for otherDocuments"),
    );
  }

  // ==================================================
  // FILE
  // ==================================================

  if (!req.file) {
    return res.status(400).json(new ApiResponse(400, null, "No file uploaded"));
  }

  // ==================================================
  // FIND PROFILE
  // ==================================================

  const profile = await TeacherProfile.findById(teacherId);

  if (!profile) {
    return res.status(404).json(
      new ApiResponse(404, null, "Teacher profile not found"),
    );
  }

  // ==================================================
  // CLOUDINARY
  // ==================================================

  const result = await uploadToCloudinary(req.file, {
    folder: `school-website/teacher-documents/${documentType}`,
    resourceType: "auto",
  });

  const uploadedAt = new Date();

  // FIX: none of the three branches below previously set `uploadedBy` or
  // `originalName`, even though documentItemSchema defines both fields.
  // That meant every teacher document permanently lost its "who uploaded
  // this" audit trail and its original filename the moment it was saved.
  const commonDocFields = {
    url: result.secure_url,
    originalName: req.file.originalname || "",
    uploadedBy: req.user._id,
    uploadedAt,
  };

  // ==================================================
  // SAVE DOCUMENT
  // ==================================================

  if (
    documentType === "degreeCertificates" ||
    documentType === "experienceCertificates"
  ) {
    if (!Array.isArray(profile.documents[documentType])) {
      profile.documents[documentType] = [];
    }

    profile.documents[documentType].push(commonDocFields);
  } else if (documentType === "otherDocuments") {
    if (!Array.isArray(profile.documents.otherDocuments)) {
      profile.documents.otherDocuments = [];
    }

    profile.documents.otherDocuments.push({
      name: String(documentName).trim(),
      ...commonDocFields,
    });
  } else {
    // Single document
    profile.documents[documentType] = commonDocFields;
  }

  await profile.save();

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        documentType,
        url: result.secure_url,
        uploadedAt,
        profile: profile.documents,
      },
      "Teacher document uploaded successfully",
    ),
  );
});

// ======================================================
// DELETE TEACHER DOCUMENT
// ADMIN / PRINCIPAL / SUPER_ADMIN
// FIX: this endpoint didn't exist at all — there was no way to remove a
// wrongly-uploaded or duplicate teacher document short of editing the
// database directly. Handles both the single-slot documents (aadharCard,
// panCard, resume, offerLetter, joiningLetter, appointmentLetter) and the
// array-based ones (degreeCertificates, experienceCertificates,
// otherDocuments).
// ======================================================

exports.deleteTeacherDocument = asyncHandler(async (req, res) => {
  const { teacherId, documentType, documentId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(teacherId)) {
    return res.status(400).json(
      new ApiResponse(400, null, "Invalid teacher ID"),
    );
  }

  if (!ALLOWED_DOCUMENTS.includes(documentType)) {
    return res.status(400).json(
      new ApiResponse(
        400,
        null,
        `Invalid document type. Allowed: ${ALLOWED_DOCUMENTS.join(", ")}`,
      ),
    );
  }

  const isArrayType = ARRAY_DOCUMENT_TYPES.includes(documentType);

  if (isArrayType && !mongoose.Types.ObjectId.isValid(documentId || "")) {
    return res.status(400).json(
      new ApiResponse(400, null, "A valid documentId is required for this document type"),
    );
  }

  const profile = await TeacherProfile.findById(teacherId);

  if (!profile) {
    return res.status(404).json(
      new ApiResponse(404, null, "Teacher profile not found"),
    );
  }

  if (isArrayType) {
    const subdoc = profile.documents[documentType]?.id?.(documentId);

    if (!subdoc) {
      return res.status(404).json(new ApiResponse(404, null, "Document not found"));
    }

    subdoc.deleteOne();
  } else {
    if (!profile.documents[documentType]) {
      return res.status(404).json(new ApiResponse(404, null, "Document not found"));
    }

    profile.documents[documentType] = null;
  }

  await profile.save();

  return res.json(
    new ApiResponse(200, { documents: profile.documents }, "Document removed successfully"),
  );
});

// ======================================================
// MY DOCUMENTS — teacher self-service
// FIX: previously teachers had NO way to upload/view/delete their own
// documents at all. The only upload endpoint was admin-only
// (uploadTeacherDocument, gated to SUPER_ADMIN/ADMIN/PRINCIPAL), and the
// frontend's "self profile" page was incorrectly calling that admin
// endpoint directly — which would always fail for a logged-in teacher
// (wrong role, and the mutation didn't even supply a teacherId).
//
// Self-uploads always land in the `otherDocuments` bucket rather than
// the admin-managed single slots (aadharCard, panCard, etc.) — those
// stay admin-controlled, matching how identity/compliance documents are
// typically verified by an admin rather than self-attested.
// ======================================================

exports.getMyTeacherDocuments = asyncHandler(async (req, res) => {
  const profile = await TeacherProfile.findOne({ user: req.user._id }).select(
    "documents",
  );

  if (!profile) {
    return res.status(404).json(
      new ApiResponse(404, null, "Teacher profile not found"),
    );
  }

  return res.json(
    new ApiResponse(200, profile.documents, "Documents fetched successfully"),
  );
});

exports.uploadMyTeacherDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json(new ApiResponse(400, null, "No file uploaded"));
  }

  const profile = await TeacherProfile.findOne({ user: req.user._id });

  if (!profile) {
    return res.status(404).json(
      new ApiResponse(404, null, "Teacher profile not found"),
    );
  }

  const result = await uploadToCloudinary(req.file, {
    folder: "school-website/teacher-documents/otherDocuments",
    resourceType: "auto",
  });

  const name = (
    req.body.documentName ||
    req.file.originalname ||
    "Document"
  ).trim();

  if (!Array.isArray(profile.documents.otherDocuments)) {
    profile.documents.otherDocuments = [];
  }

  profile.documents.otherDocuments.push({
    name,
    url: result.secure_url,
    originalName: req.file.originalname || "",
    uploadedBy: req.user._id,
    uploadedAt: new Date(),
  });

  await profile.save();

  return res.status(201).json(
    new ApiResponse(
      201,
      { documents: profile.documents },
      "Document uploaded successfully",
    ),
  );
});

exports.deleteMyTeacherDocument = asyncHandler(async (req, res) => {
  const { documentId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(documentId)) {
    return res.status(400).json(
      new ApiResponse(400, null, "Invalid document ID"),
    );
  }

  const profile = await TeacherProfile.findOne({ user: req.user._id });

  if (!profile) {
    return res.status(404).json(
      new ApiResponse(404, null, "Teacher profile not found"),
    );
  }

  const doc = profile.documents.otherDocuments?.id?.(documentId);

  if (!doc) {
    return res.status(404).json(new ApiResponse(404, null, "Document not found"));
  }

  // A teacher may only delete a document they themselves uploaded —
  // not anything an admin uploaded to their profile.
  if (String(doc.uploadedBy) !== String(req.user._id)) {
    return res.status(403).json(
      new ApiResponse(403, null, "You can only delete documents you uploaded"),
    );
  }

  doc.deleteOne();
  await profile.save();

  return res.json(
    new ApiResponse(200, { documents: profile.documents }, "Document removed successfully"),
  );
});

// ======================================================
// UPLOAD MY PROFILE PHOTO
// TEACHER ONLY
// ======================================================

exports.uploadMyTeacherProfilePhoto = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json(
      new ApiResponse(400, null, "No profile photo uploaded"),
    );
  }

  const profile = await TeacherProfile.findOne({ user: req.user._id });

  if (!profile) {
    return res.status(404).json(
      new ApiResponse(404, null, "Teacher profile not found"),
    );
  }

  const result = await uploadToCloudinary(req.file, {
    folder: "school-website/profile-photos/teachers",
    resourceType: "image",
  });

  profile.profilePhoto = result.secure_url;

  await profile.save();

  return res.json(
    new ApiResponse(
      200,
      { profilePhoto: profile.profilePhoto },
      "Profile photo uploaded successfully",
    ),
  );
});
