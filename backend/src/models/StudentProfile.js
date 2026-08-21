const mongoose = require("mongoose");

const DOCUMENT_TYPES = [
  "BIRTH_CERTIFICATE",
  "TRANSFER_CERTIFICATE",
  "MARKSHEET",
  "CASTE_CERTIFICATE",
  "MEDICAL_CERTIFICATE",
  "OTHER",
];

const documentSchema = new mongoose.Schema(
  {
    type: { type: String, enum: DOCUMENT_TYPES, default: "OTHER" },
    label: { type: String, trim: true, default: "", maxlength: 100 },
    url: { type: String, required: true, trim: true },
    originalName: { type: String, default: "", trim: true },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

documentSchema.pre("validate", function () {
  if (this.type === "OTHER" && (!this.label || !this.label.trim())) {
    throw new Error("Label is required when document type is OTHER");
  }
});

const PINCODE_REGEX = /^[1-9][0-9]{5}$/;
const AADHAR_REGEX = /^\d{12}$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;

const studentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    // NEW — decides class vs program flow
    institutionType: {
      type: String,
      enum: ["SCHOOL", "COLLEGE"],
      required: true,
      default: "SCHOOL",
      index: true,
    },

    // SCHOOL — ab required nahi (institutionType-based validation neeche hai)
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      default: null,
      index: true,
    },

    // NEW — COLLEGE
    program: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      default: null,
      index: true,
    },
    currentSemester: { type: Number, default: null, min: 1 },

    rollNumber: { type: String, required: true, trim: true },

    address: {
      street: { type: String, default: "", trim: true },
      city: { type: String, default: "", trim: true },
      state: { type: String, default: "", trim: true },
      pincode: {
        type: String,
        default: "",
        trim: true,
        validate: {
          validator: (v) => !v || PINCODE_REGEX.test(v),
          message: "Pincode must be a valid 6-digit Indian pincode",
        },
      },
    },

    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    dateOfBirth: {
      type: Date,
      default: null,
      validate: {
        validator: (v) => !v || v < new Date(),
        message: "Date of birth cannot be in the future",
      },
    },

    status: {
      type: String,
      enum: ["ACTIVE", "LEFT", "GRADUATED"],
      default: "ACTIVE",
      index: true,
    },
    leftReason: { type: String, default: "", trim: true, maxlength: 300 },
    leftDate: { type: Date, default: null },

    bloodGroup: {
      type: String,
      enum: ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      default: "",
    },
    profilePhoto: { type: String, default: "", trim: true },
    bio: { type: String, default: "", trim: true, maxlength: 300 },

    phone: {
      type: String,
      default: "",
      trim: true,
      validate: {
        validator: (v) => !v || PHONE_REGEX.test(v),
        message: "Phone must be a valid 10-digit Indian mobile number",
      },
    },

    emergencyContact: {
      name: { type: String, default: "", trim: true },
      phone: {
        type: String,
        default: "",
        trim: true,
        validate: {
          validator: (v) => !v || PHONE_REGEX.test(v),
          message:
            "Emergency contact phone must be a valid 10-digit Indian mobile number",
        },
      },
      relation: { type: String, default: "", trim: true },
    },

    admissionNumber: { type: String, default: "", trim: true },
    admissionDate: { type: Date, default: null },
    previousSchool: { type: String, default: "", trim: true },
    house: { type: String, default: "", trim: true },

    transportMode: {
      type: String,
      enum: ["", "SCHOOL_BUS", "SELF", "WALKING"],
      default: "",
    },
    busRoute: { type: String, default: "", trim: true },

    medicalConditions: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    aadharNumber: {
      type: String,
      default: "",
      trim: true,
      validate: {
        validator: (v) => !v || AADHAR_REGEX.test(v),
        message: "Aadhar number must be exactly 12 digits",
      },
    },
    aadharFrontUrl: { type: String, default: "", trim: true },
    aadharBackUrl: { type: String, default: "", trim: true },

    documents: { type: [documentSchema], default: [] },

    fatherName: { type: String, default: "", trim: true },
    motherName: { type: String, default: "", trim: true },
    guardianOccupation: { type: String, default: "", trim: true },

    category: {
      type: String,
      enum: ["", "GENERAL", "OBC", "SC", "ST", "EWS"],
      default: "",
    },
    religion: { type: String, default: "", trim: true },
    nationality: { type: String, default: "Indian", trim: true },
  },
  { timestamps: true },
);

// NEW — institutionType ke hisaab se class/program required karta hai
studentProfileSchema.pre("validate", function () {
  if (this.institutionType === "SCHOOL" && !this.class) {
    throw new Error("Class is required for a school student");
  }
  if (
    this.institutionType === "COLLEGE" &&
    (!this.program || !this.currentSemester)
  ) {
    throw new Error(
      "Program and currentSemester are required for a college student",
    );
  }
});

studentProfileSchema.index(
  { class: 1, rollNumber: 1 },
  { unique: true, partialFilterExpression: { class: { $type: "objectId" } } },
);
studentProfileSchema.index(
  { program: 1, rollNumber: 1 },
  { unique: true, partialFilterExpression: { program: { $type: "objectId" } } },
);
studentProfileSchema.index({ class: 1, status: 1, rollNumber: 1 });
studentProfileSchema.index({ program: 1, currentSemester: 1, status: 1 });

studentProfileSchema.statics.SELF_EDITABLE_FIELDS = [
  "bloodGroup",
  "profilePhoto",
  "bio",
];

studentProfileSchema.statics.ADMIN_ONLY_FIELDS = [
  "class",
  "program",
  "currentSemester",
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
  "fatherName",
  "motherName",
  "guardianOccupation",
  "category",
  "religion",
  "nationality",
  "transportMode",
  "busRoute",
  "medicalConditions",
];

studentProfileSchema.statics.DOCUMENT_TYPES = DOCUMENT_TYPES;

module.exports =
  mongoose.models.StudentProfile ||
  mongoose.model("StudentProfile", studentProfileSchema);
