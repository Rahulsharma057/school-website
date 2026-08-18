const mongoose = require("mongoose");

// ======================================================
// DOCUMENT TYPES
// ======================================================

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
    type: {
      type: String,
      enum: DOCUMENT_TYPES,
      default: "OTHER",
    },

    label: {
      type: String,
      trim: true,
      default: "",
      maxlength: 100,
    },

    url: {
      type: String,
      required: true,
      trim: true,
    },

    originalName: {
      type: String,
      default: "",
      trim: true,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true,
  },
);

// FIX: enforce the "label required when type === OTHER" rule at the schema
// level too (previously only checked in the controller, so any other code
// path that pushes into `documents` could silently save an unlabeled OTHER doc).
//
// FIX (500 error — "documents: next is not a function"): this hook used to
// take a `next` callback param:
//
//   documentSchema.pre("validate", function (next) {
//     if (...) return next(new Error(...));
//     next();
//   });
//
// Mongoose decides whether a pre-hook is callback-style or sync/promise-style
// based on the function's declared arity (fn.length). For SUBDOCUMENT
// pre-validate hooks specifically, Mongoose does not reliably invoke the
// hook with a `next` argument on every code path (e.g. push()'ing into the
// array and then calling the parent document's .save(), especially outside
// a transaction session) — so `next` came through as undefined and calling
// it threw "next is not a function", which is what surfaced as a 500 on
// document upload. Declaring the hook as plain synchronous (no `next`
// param, just throw on failure) sidesteps that ambiguity entirely and is
// fully supported by Mongoose 5.10+ / 6.x / 7.x / 8.x.
documentSchema.pre("validate", function () {
  if (this.type === "OTHER" && (!this.label || !this.label.trim())) {
    throw new Error("Label is required when document type is OTHER");
  }
});

// ======================================================
// VALIDATORS
// ======================================================

const PINCODE_REGEX = /^[1-9][0-9]{5}$/;
const AADHAR_REGEX = /^\d{12}$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;

// ======================================================
// STUDENT PROFILE
// ======================================================

const studentProfileSchema = new mongoose.Schema(
  {
    // ==================================================
    // USER
    // ==================================================

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    // ==================================================
    // CLASS
    // ==================================================

    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },

    rollNumber: {
      type: String,
      required: true,
      trim: true,
    },

    // ==================================================
    // ADDRESS
    // ==================================================

    address: {
      street: {
        type: String,
        default: "",
        trim: true,
      },

      city: {
        type: String,
        default: "",
        trim: true,
      },

      state: {
        type: String,
        default: "",
        trim: true,
      },

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

    // ==================================================
    // PARENT
    // ==================================================

    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    // ==================================================
    // BASIC DETAILS
    // ==================================================

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

    leftReason: {
      type: String,
      default: "",
      trim: true,
      maxlength: 300,
    },

    leftDate: {
      type: Date,
      default: null,
    },

    // ==================================================
    // SELF EDITABLE
    // ==================================================

    bloodGroup: {
      type: String,
      enum: ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      default: "",
    },

    profilePhoto: {
      type: String,
      default: "",
      trim: true,
    },

    bio: {
      type: String,
      default: "",
      trim: true,
      maxlength: 300,
    },

    // ==================================================
    // ADMIN ONLY
    // ==================================================

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
      name: {
        type: String,
        default: "",
        trim: true,
      },

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

      relation: {
        type: String,
        default: "",
        trim: true,
      },
    },

    admissionNumber: {
      type: String,
      default: "",
      trim: true,
    },

    admissionDate: {
      type: Date,
      default: null,
    },

    previousSchool: {
      type: String,
      default: "",
      trim: true,
    },

    house: {
      type: String,
      default: "",
      trim: true,
    },

    // ==================================================
    // TRANSPORT
    // ==================================================

    transportMode: {
      type: String,
      enum: ["", "SCHOOL_BUS", "SELF", "WALKING"],
      default: "",
    },

    busRoute: {
      type: String,
      default: "",
      trim: true,
    },

    // ==================================================
    // MEDICAL
    // ==================================================

    medicalConditions: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    // ==================================================
    // AADHAR
    // ==================================================

    aadharNumber: {
      type: String,
      default: "",
      trim: true,
      validate: {
        validator: (v) => !v || AADHAR_REGEX.test(v),
        message: "Aadhar number must be exactly 12 digits",
      },
    },

    aadharFrontUrl: {
      type: String,
      default: "",
      trim: true,
    },

    aadharBackUrl: {
      type: String,
      default: "",
      trim: true,
    },

    // ==================================================
    // OTHER DOCUMENTS
    // ==================================================

    documents: {
      type: [documentSchema],
      default: [],
    },

    // ==================================================
    // PARENT / GUARDIAN DETAILS
    // ==================================================

    fatherName: {
      type: String,
      default: "",
      trim: true,
    },

    motherName: {
      type: String,
      default: "",
      trim: true,
    },

    guardianOccupation: {
      type: String,
      default: "",
      trim: true,
    },

    // ==================================================
    // DEMOGRAPHIC
    // ==================================================

    category: {
      type: String,
      enum: ["", "GENERAL", "OBC", "SC", "ST", "EWS"],
      default: "",
    },

    religion: {
      type: String,
      default: "",
      trim: true,
    },

    nationality: {
      type: String,
      default: "Indian",
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

// ======================================================
// PERFORMANCE INDEXES
// ======================================================

// Same class me same roll number allowed nahi
studentProfileSchema.index(
  {
    class: 1,
    rollNumber: 1,
  },
  {
    unique: true,
  },
);

// Fast class + status listing + roll sorting
studentProfileSchema.index({
  class: 1,
  status: 1,
  rollNumber: 1,
});

// user already has unique:true + index:true

// ======================================================
// SELF EDITABLE FIELDS
// ======================================================

studentProfileSchema.statics.SELF_EDITABLE_FIELDS = [
  "bloodGroup",
  "profilePhoto",
  "bio",
];

// ======================================================
// ADMIN EDITABLE FIELDS
// ======================================================

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

// ======================================================
// DOCUMENT TYPES
// ======================================================

studentProfileSchema.statics.DOCUMENT_TYPES = DOCUMENT_TYPES;

module.exports = mongoose.model("StudentProfile", studentProfileSchema);
