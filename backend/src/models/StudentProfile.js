const mongoose = require("mongoose");

const studentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    rollNumber: {
      type: String,
      required: true,
    },
    address: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      pincode: { type: String, default: "" },
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "LEFT", "GRADUATED"],
      default: "ACTIVE",
    },
    leftReason: {
      type: String,
      default: "",
    },
    leftDate: {
      type: Date,
      default: null,
    },

    // ===== SELF-EDITABLE (student apne aap update kar sakta hai) =====
    // NOTE: phone yahan se hata diya gaya — ab contact info sirf admin change kar sakta hai
    bloodGroup: {
      type: String,
      enum: ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      default: "",
    },
    profilePhoto: {
      type: String, // URL
      default: "",
    },
    bio: {
      type: String,
      default: "",
      maxlength: 300,
    },

    // ===== ADMIN-ONLY (sirf SUPER_ADMIN / ADMIN / PRINCIPAL set/edit karenge) =====
    phone: {
      type: String,
      default: "",
    },
    emergencyContact: {
      name: { type: String, default: "" },
      phone: { type: String, default: "" },
      relation: { type: String, default: "" },
    },
    admissionNumber: {
      type: String,
      default: "",
    },
    admissionDate: {
      type: Date,
      default: null,
    },
    previousSchool: {
      type: String,
      default: "",
    },
    house: {
      type: String,
      default: "",
    },

    // ---- Identity document (Aadhar) ----
    aadharNumber: {
      type: String,
      default: "",
      // 12-digit numeric; kept as string to preserve leading behaviour and formatting
    },
    aadharCardUrl: {
      type: String, // Cloudinary secure_url
      default: "",
    },

    // ---- Parent / guardian details (govt-record + emergency use) ----
    fatherName: {
      type: String,
      default: "",
    },
    motherName: {
      type: String,
      default: "",
    },
    guardianOccupation: {
      type: String,
      default: "",
    },

    // ---- Statutory / demographic fields (common in Indian school records) ----
    category: {
      type: String,
      enum: ["", "GENERAL", "OBC", "SC", "ST", "EWS"],
      default: "",
    },
    religion: {
      type: String,
      default: "",
    },
    nationality: {
      type: String,
      default: "Indian",
    },
  },
  { timestamps: true }
);

studentProfileSchema.index({ class: 1, rollNumber: 1 }, { unique: true });

// Fields jo student khud apni /my-profile PATCH request se edit kar sakta hai
// — sirf non-official, cosmetic/optional info. Contact info (phone), Aadhar,
// parent details, sab admin-only hain taaki koi galat/fraud data na daal sake.
studentProfileSchema.statics.SELF_EDITABLE_FIELDS = [
  "bloodGroup",
  "profilePhoto",
  "bio",
];

// Fields jo sirf admin/super_admin/principal edit kar sakte hain
studentProfileSchema.statics.ADMIN_ONLY_FIELDS = [
  "class",
  "rollNumber",
  "status",
  "leftReason",
  "leftDate",
  "dateOfBirth",
  "admissionNumber",
  "admissionDate",
  "previousSchool",
  "house",
  "parent",
  "phone",
  "address",
  "emergencyContact",
  "aadharNumber",
  "aadharCardUrl",
  "fatherName",
  "motherName",
  "guardianOccupation",
  "category",
  "religion",
  "nationality",
];

module.exports = mongoose.model("StudentProfile", studentProfileSchema);