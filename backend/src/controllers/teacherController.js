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

  address: [
    "street",
    "city",
    "state",
    "pincode",
  ],
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
// ======================================================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PHONE_REGEX = /^[0-9+\-\s()]{7,20}$/;

const PINCODE_REGEX = /^[0-9]{6}$/;

const AADHAR_REGEX = /^\d{12}$/;

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

const ALLOWED_EMPLOYMENT_TYPES = [
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "GUEST",
];

const ALLOWED_STATUS = [
  "ACTIVE",
  "LEFT",
];

const ALLOWED_CATEGORY = [
  "",
  "GENERAL",
  "OBC",
  "SC",
  "ST",
  "EWS",
];

const ALLOWED_GENDER = [
  "",
  "MALE",
  "FEMALE",
  "OTHER",
];

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
    return `${fieldName} is invalid`;
  }

  return null;
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
    "Alternate phone"
  );

  if (alternatePhoneError) {
    errors.push(alternatePhoneError);
  }

  if (data.emergencyContact?.phone) {
    const emergencyPhoneError = validatePhone(
      data.emergencyContact.phone,
      "Emergency contact phone"
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

  if (
    data.status &&
    !ALLOWED_STATUS.includes(data.status)
  ) {
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

    if (
      Number.isNaN(experience) ||
      experience < 0 ||
      experience > 60
    ) {
      errors.push(
        "Experience years must be between 0 and 60"
      );
    }
  }

  // ==================================================
  // PINCODE
  // ==================================================

  if (data.address?.pincode) {
    if (
      !PINCODE_REGEX.test(
        String(data.address.pincode).trim()
      )
    ) {
      errors.push("Invalid address pincode");
    }
  }

  // ==================================================
  // AADHAR
  // ==================================================

  if (data.aadharNumber) {
    if (
      !AADHAR_REGEX.test(
        String(data.aadharNumber).replace(/\s/g, "")
      )
    ) {
      errors.push("Aadhar number must contain exactly 12 digits");
    }
  }

  // ==================================================
  // PAN
  // ==================================================

  if (data.panNumber) {
    if (
      !PAN_REGEX.test(
        String(data.panNumber)
          .trim()
          .toUpperCase()
      )
    ) {
      errors.push("Invalid PAN number");
    }
  }

  // ==================================================
  // IFSC
  // ==================================================

  if (data.ifsc) {
    if (
      !IFSC_REGEX.test(
        String(data.ifsc)
          .trim()
          .toUpperCase()
      )
    ) {
      errors.push("Invalid IFSC code");
    }
  }

  // ==================================================
  // ENUMS
  // ==================================================

  if (
    data.category !== undefined &&
    !ALLOWED_CATEGORY.includes(data.category)
  ) {
    errors.push("Invalid category");
  }

  if (
    data.gender !== undefined &&
    !ALLOWED_GENDER.includes(data.gender)
  ) {
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
// PICK ALLOWED UPDATES
// IMPORTANT:
// Nested fields use dot notation so existing fields
// don't accidentally get deleted.
// ======================================================

function pickAllowedUpdates(
  body = {},
  allowedFields = []
) {
  const updates = {};

  for (const field of allowedFields) {
    if (
      !Object.prototype.hasOwnProperty.call(
        body,
        field
      )
    ) {
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
          if (
            Object.prototype.hasOwnProperty.call(
              incoming,
              key
            )
          ) {
            updates[`${field}.${key}`] =
              incoming[key];
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

exports.createTeacher = asyncHandler(
  async (req, res) => {
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

    const validationErrors =
      validateTeacherData(req.body, {
        create: true,
      });

    if (validationErrors.length > 0) {
      return res.status(400).json(
        new ApiResponse(
          400,
          null,
          validationErrors.join(", ")
        )
      );
    }

    if (
      previousInstitutions !== undefined &&
      !Array.isArray(previousInstitutions)
    ) {
      return res.status(400).json(
        new ApiResponse(
          400,
          null,
          "previousInstitutions must be an array"
        )
      );
    }

    const normalizedEmail = String(email)
      .trim()
      .toLowerCase();

    const session =
      await mongoose.startSession();

    try {
      session.startTransaction();

      // ==================================================
      // CHECK EMAIL
      // ==================================================

      const existingUser =
        await User.findOne({
          email: normalizedEmail,
        }).session(session);

      if (existingUser) {
        await session.abortTransaction();

        return res.status(400).json(
          new ApiResponse(
            400,
            null,
            "Email already registered"
          )
        );
      }

      // ==================================================
      // HASH PASSWORD
      // ==================================================

      const hashedPassword =
        await hashPassword(password);

      // ==================================================
      // CREATE USER
      // ==================================================

      const newUser =
        await User.create(
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
          { session }
        );

      const createdUser = newUser[0];

      // ==================================================
      // CREATE TEACHER PROFILE
      // ==================================================

      const newProfile =
        await TeacherProfile.create(
          [
            {
              user: createdUser._id,

              // Professional
              qualification:
                qualification || "",

              specialization:
                specialization || "",

              employmentType:
                employmentType ||
                "FULL_TIME",

              previousInstitutions:
                Array.isArray(
                  previousInstitutions
                )
                  ? previousInstitutions
                  : [],

              // Contact
              address: address || {},

              phone: phone || "",

              alternatePhone:
                alternatePhone || "",

              personalEmail:
                personalEmail || "",

              emergencyContact:
                emergencyContact || {},

              // Employment
              employeeId:
                employeeId || "",

              joiningDate:
                joiningDate || null,

              experienceYears:
                Number(experienceYears) || 0,

              // Identity
              aadharNumber:
                aadharNumber || "",

              panNumber:
                panNumber || "",

              nationality:
                nationality || "Indian",

              category:
                category || "",

              religion:
                religion || "",

              dateOfBirth:
                dateOfBirth || null,

              gender:
                gender || "",

              bloodGroup:
                bloodGroup || "",

              maritalStatus:
                maritalStatus || "",

              // Payroll
              bankAccount:
                bankAccount || "",

              ifsc:
                ifsc || "",

              bankName:
                bankName || "",

              accountHolderName:
                accountHolderName || "",

              status: "ACTIVE",
            },
          ],
          { session }
        );

      await session.commitTransaction();

      createdUser.password = undefined;

      return res.status(201).json(
        new ApiResponse(
          201,
          {
            user: createdUser,
            profile: newProfile[0],
          },
          "Teacher created successfully"
        )
      );
    } catch (error) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }

      if (error?.code === 11000) {
        return res.status(409).json(
          new ApiResponse(
            409,
            null,
            "Teacher email or profile already exists"
          )
        );
      }

      throw error;
    } finally {
      await session.endSession();
    }
  }
);

// ======================================================
// GET MY TEACHER PROFILE
// ======================================================

exports.getMyTeacherProfile =
  asyncHandler(async (req, res) => {
    const profile =
      await TeacherProfile.findOne({
        user: req.user._id,
      }).populate(
        TEACHER_POPULATE
      );

    if (!profile) {
      return res.status(404).json(
        new ApiResponse(
          404,
          null,
          "Teacher profile not found"
        )
      );
    }

    return res.json(
      new ApiResponse(
        200,
        profile,
        "Teacher profile fetched successfully"
      )
    );
  });

// ======================================================
// TEACHER SELF UPDATE
// ======================================================

exports.updateMyTeacherProfile =
  asyncHandler(async (req, res) => {
    const updates =
      pickAllowedUpdates(
        req.body,
        TeacherProfile.SELF_EDITABLE_FIELDS
      );

    if (
      Object.keys(updates).length === 0
    ) {
      return res.status(400).json(
        new ApiResponse(
          400,
          null,
          "No editable fields provided"
        )
      );
    }

    // bio validation
    if (
      updates.bio !== undefined &&
      String(updates.bio).length > 300
    ) {
      return res.status(400).json(
        new ApiResponse(
          400,
          null,
          "Bio cannot exceed 300 characters"
        )
      );
    }

    const profile =
      await TeacherProfile.findOneAndUpdate(
        {
          user: req.user._id,
        },
        {
          $set: updates,
        },
        {
          new: true,
          runValidators: true,
        }
      ).populate(
        TEACHER_POPULATE
      );

    if (!profile) {
      return res.status(404).json(
        new ApiResponse(
          404,
          null,
          "Teacher profile not found"
        )
      );
    }

    return res.json(
      new ApiResponse(
        200,
        profile,
        "Profile updated successfully"
      )
    );
  });

// ======================================================
// ADMIN UPDATE TEACHER
// SUPER_ADMIN / ADMIN / PRINCIPAL
// ======================================================

exports.updateTeacherByAdmin =
  asyncHandler(async (req, res) => {
    const { teacherId } =
      req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        teacherId
      )
    ) {
      return res.status(400).json(
        new ApiResponse(
          400,
          null,
          "Invalid teacher ID"
        )
      );
    }

    // ==================================================
    // VALIDATE ONLY FIELDS THAT ARE BEING UPDATED
    // ==================================================

    const validationErrors =
      validateTeacherData(req.body);

    if (validationErrors.length > 0) {
      return res.status(400).json(
        new ApiResponse(
          400,
          null,
          validationErrors.join(", ")
        )
      );
    }

    if (
      req.body.previousInstitutions !==
        undefined &&
      !Array.isArray(
        req.body.previousInstitutions
      )
    ) {
      return res.status(400).json(
        new ApiResponse(
          400,
          null,
          "previousInstitutions must be an array"
        )
      );
    }

    const updates =
      pickAllowedUpdates(
        req.body,
        TeacherProfile.ADMIN_ONLY_FIELDS
      );

    if (
      Object.keys(updates).length === 0
    ) {
      return res.status(400).json(
        new ApiResponse(
          400,
          null,
          "No admin-editable fields provided"
        )
      );
    }

    // ==================================================
    // STATUS CONSISTENCY
    // ==================================================

    if (
      updates.status === "ACTIVE"
    ) {
      updates.leftDate = null;
      updates.leftReason = "";
    }

    if (
      updates.status === "LEFT"
    ) {
      if (!updates.leftDate) {
        updates.leftDate =
          new Date();
      }
    }

    const session =
      await mongoose.startSession();

    try {
      session.startTransaction();

      const profile =
        await TeacherProfile.findByIdAndUpdate(
          teacherId,
          {
            $set: updates,
          },
          {
            new: true,
            runValidators: true,
            session,
          }
        );

      if (!profile) {
        await session.abortTransaction();

        return res.status(404).json(
          new ApiResponse(
            404,
            null,
            "Teacher profile not found"
          )
        );
      }

      // ==================================================
      // LOGIN STATUS SYNC
      // ==================================================

      if (
        updates.status === "LEFT"
      ) {
        await User.findByIdAndUpdate(
          profile.user,
          {
            isActive: false,
          },
          { session }
        );
      }

      if (
        updates.status === "ACTIVE"
      ) {
        await User.findByIdAndUpdate(
          profile.user,
          {
            isActive: true,
          },
          { session }
        );
      }

      await session.commitTransaction();

      const populated =
        await TeacherProfile.findById(
          profile._id
        ).populate(
          TEACHER_POPULATE
        );

      return res.json(
        new ApiResponse(
          200,
          populated,
          "Teacher updated successfully"
        )
      );
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
// GET ALL TEACHERS
// ADMIN / PRINCIPAL / SUPER_ADMIN
// ======================================================

exports.getAllTeachers =
  asyncHandler(async (req, res) => {
    const teachers =
      await TeacherProfile.find()
        .populate(
          TEACHER_POPULATE
        )
        .sort({
          createdAt: -1,
        });

    return res.json(
      new ApiResponse(
        200,
        teachers,
        "Teachers fetched successfully"
      )
    );
  });

// ======================================================
// GET TEACHER BY ID
// ======================================================

exports.getTeacherById =
  asyncHandler(async (req, res) => {
    const { teacherId } =
      req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        teacherId
      )
    ) {
      return res.status(400).json(
        new ApiResponse(
          400,
          null,
          "Invalid teacher ID"
        )
      );
    }

    const profile =
      await TeacherProfile.findById(
        teacherId
      ).populate(
        TEACHER_POPULATE
      );

    if (!profile) {
      return res.status(404).json(
        new ApiResponse(
          404,
          null,
          "Teacher profile not found"
        )
      );
    }

    return res.json(
      new ApiResponse(
        200,
        profile,
        "Teacher profile fetched successfully"
      )
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

// ======================================================
// UPLOAD TEACHER DOCUMENT
// ADMIN / PRINCIPAL / SUPER_ADMIN
// ======================================================

exports.uploadTeacherDocument =
  asyncHandler(async (req, res) => {
    const { teacherId } =
      req.params;

    const {
      documentType,
      documentName,
    } = req.body;

    // ==================================================
    // VALIDATE TEACHER ID
    // ==================================================

    if (
      !mongoose.Types.ObjectId.isValid(
        teacherId
      )
    ) {
      return res.status(400).json(
        new ApiResponse(
          400,
          null,
          "Invalid teacher ID"
        )
      );
    }

    // ==================================================
    // VALIDATE DOCUMENT TYPE
    // ==================================================

    if (
      !documentType ||
      !ALLOWED_DOCUMENTS.includes(
        documentType
      )
    ) {
      return res.status(400).json(
        new ApiResponse(
          400,
          null,
          `Invalid document type. Allowed: ${ALLOWED_DOCUMENTS.join(
            ", "
          )}`
        )
      );
    }

    // ==================================================
    // OTHER DOCUMENT NAME
    // ==================================================

    if (
      documentType ===
      "otherDocuments" &&
      (!documentName ||
        !String(documentName).trim())
    ) {
      return res.status(400).json(
        new ApiResponse(
          400,
          null,
          "documentName is required for otherDocuments"
        )
      );
    }

    // ==================================================
    // FILE
    // ==================================================

    if (!req.file) {
      return res.status(400).json(
        new ApiResponse(
          400,
          null,
          "No file uploaded"
        )
      );
    }

    // ==================================================
    // FIND PROFILE
    // ==================================================

    const profile =
      await TeacherProfile.findById(
        teacherId
      );

    if (!profile) {
      return res.status(404).json(
        new ApiResponse(
          404,
          null,
          "Teacher profile not found"
        )
      );
    }

    // ==================================================
    // CLOUDINARY
    // ==================================================

    const result =
      await uploadToCloudinary(
        req.file,
        {
          folder:
            `school-website/teacher-documents/${documentType}`,
          resourceType: "auto",
        }
      );

    const uploadedAt =
      new Date();

    // ==================================================
    // SAVE DOCUMENT
    // ==================================================

    if (
      documentType ===
        "degreeCertificates" ||
      documentType ===
        "experienceCertificates"
    ) {
      if (
        !Array.isArray(
          profile.documents[
            documentType
          ]
        )
      ) {
        profile.documents[
          documentType
        ] = [];
      }

      profile.documents[
        documentType
      ].push({
        url: result.secure_url,
        uploadedAt,
      });
    } else if (
      documentType ===
      "otherDocuments"
    ) {
      if (
        !Array.isArray(
          profile.documents
            .otherDocuments
        )
      ) {
        profile.documents.otherDocuments =
          [];
      }

      profile.documents.otherDocuments.push(
        {
          name: String(
            documentName
          ).trim(),
          url: result.secure_url,
          uploadedAt,
        }
      );
    } else {
      // Single document
      profile.documents[
        documentType
      ] = {
        url: result.secure_url,
        uploadedAt,
      };
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
        "Teacher document uploaded successfully"
      )
    );
  });

// ======================================================
// UPLOAD MY PROFILE PHOTO
// TEACHER ONLY
// ======================================================

exports.uploadMyTeacherProfilePhoto =
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json(
        new ApiResponse(
          400,
          null,
          "No profile photo uploaded"
        )
      );
    }

    const profile =
      await TeacherProfile.findOne({
        user: req.user._id,
      });

    if (!profile) {
      return res.status(404).json(
        new ApiResponse(
          404,
          null,
          "Teacher profile not found"
        )
      );
    }

    const result =
      await uploadToCloudinary(
        req.file,
        {
          folder:
            "school-website/profile-photos/teachers",
          resourceType: "image",
        }
      );

    profile.profilePhoto =
      result.secure_url;

    await profile.save();

    return res.json(
      new ApiResponse(
        200,
        {
          profilePhoto:
            profile.profilePhoto,
        },
        "Profile photo uploaded successfully"
      )
    );
  });