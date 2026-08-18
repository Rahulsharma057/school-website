const mongoose = require("mongoose");

// ======================================================
// VALIDATORS
// ======================================================

const phoneValidator = {
  validator: function (value) {
    if (!value) return true;
    return /^[6-9]\d{9}$/.test(value);
  },
  message: "Phone number must be a valid 10-digit Indian mobile number",
};

const emailValidator = {
  validator: function (value) {
    if (!value) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  },
  message: "Please provide a valid email address",
};

const pincodeValidator = {
  validator: function (value) {
    if (!value) return true;
    return /^\d{6}$/.test(value);
  },
  message: "Pincode must be exactly 6 digits",
};

const aadharValidator = {
  validator: function (value) {
    if (!value) return true;
    return /^\d{12}$/.test(value);
  },
  message: "Aadhar number must be exactly 12 digits",
};

const panValidator = {
  validator: function (value) {
    if (!value) return true;
    return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(value);
  },
  message: "Invalid PAN number",
};

// ======================================================
// DOCUMENT SUB-SCHEMA
// ======================================================

const documentItemSchema = new mongoose.Schema(
  {
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
  }
);

// ======================================================
// TEACHER PROFILE
// ======================================================

const teacherProfileSchema = new mongoose.Schema(
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
    // PROFESSIONAL
    // ==================================================

    qualification: {
      type: String,
      default: "",
      trim: true,
      maxlength: 150,
    },

    specialization: {
      type: String,
      default: "",
      trim: true,
      maxlength: 150,
    },

    employmentType: {
      type: String,
      enum: ["FULL_TIME", "PART_TIME", "CONTRACT", "GUEST"],
      default: "FULL_TIME",
    },

    previousInstitutions: {
      type: [String],
      default: [],
      validate: {
        validator: function (arr) {
          return arr.every(
            (item) =>
              typeof item === "string" &&
              item.trim().length > 0 &&
              item.trim().length <= 200
          );
        },
        message: "Invalid previous institution",
      },
    },

    status: {
      type: String,
      enum: ["ACTIVE", "LEFT"],
      default: "ACTIVE",
      index: true,
    },

    employeeId: {
      type: String,
      default: "",
      trim: true,
      maxlength: 50,
    },

    joiningDate: {
      type: Date,
      default: null,
    },

    experienceYears: {
      type: Number,
      default: 0,
      min: [0, "Experience cannot be negative"],
      max: [60, "Experience cannot exceed 60 years"],
    },

    // ==================================================
    // SELF EDITABLE
    // ==================================================

    profilePhoto: {
      type: String,
      default: "",
      trim: true,
    },

    bio: {
      type: String,
      default: "",
      trim: true,
      maxlength: [300, "Bio cannot exceed 300 characters"],
    },

    // ==================================================
    // CONTACT
    // ==================================================

    phone: {
      type: String,
      default: "",
      trim: true,
      validate: phoneValidator,
    },

    alternatePhone: {
      type: String,
      default: "",
      trim: true,
      validate: phoneValidator,
    },

    personalEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
      validate: emailValidator,
    },

    address: {
      street: {
        type: String,
        default: "",
        trim: true,
        maxlength: 200,
      },

      city: {
        type: String,
        default: "",
        trim: true,
        maxlength: 100,
      },

      state: {
        type: String,
        default: "",
        trim: true,
        maxlength: 100,
      },

      pincode: {
        type: String,
        default: "",
        trim: true,
        validate: pincodeValidator,
      },
    },

    emergencyContact: {
      name: {
        type: String,
        default: "",
        trim: true,
        maxlength: 100,
      },

      phone: {
        type: String,
        default: "",
        trim: true,
        validate: phoneValidator,
      },

      relation: {
        type: String,
        default: "",
        trim: true,
        maxlength: 50,
      },
    },

    // ==================================================
    // IDENTITY / COMPLIANCE
    // ==================================================

    aadharNumber: {
      type: String,
      default: "",
      trim: true,
      validate: aadharValidator,
    },

    panNumber: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
      validate: panValidator,
    },

    nationality: {
      type: String,
      default: "Indian",
      trim: true,
      maxlength: 50,
    },

    category: {
      type: String,
      enum: ["", "GENERAL", "OBC", "SC", "ST", "EWS"],
      default: "",
    },

    religion: {
      type: String,
      default: "",
      trim: true,
      maxlength: 50,
    },

    dateOfBirth: {
      type: Date,
      default: null,
      validate: {
        validator: function (value) {
          if (!value) return true;
          return value <= new Date();
        },
        message: "Date of birth cannot be in the future",
      },
    },

    gender: {
      type: String,
      enum: ["", "MALE", "FEMALE", "OTHER"],
      default: "",
    },

    bloodGroup: {
      type: String,
      enum: ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      default: "",
    },

    maritalStatus: {
      type: String,
      enum: ["", "SINGLE", "MARRIED", "DIVORCED", "WIDOWED"],
      default: "",
    },

    // ==================================================
    // DOCUMENTS
    // ==================================================

    documents: {
      aadharCard: {
        type: documentItemSchema,
        default: null,
      },

      panCard: {
        type: documentItemSchema,
        default: null,
      },

      resume: {
        type: documentItemSchema,
        default: null,
      },

      degreeCertificates: {
        type: [documentItemSchema],
        default: [],
      },

      experienceCertificates: {
        type: [documentItemSchema],
        default: [],
      },

      offerLetter: {
        type: documentItemSchema,
        default: null,
      },

      joiningLetter: {
        type: documentItemSchema,
        default: null,
      },

      appointmentLetter: {
        type: documentItemSchema,
        default: null,
      },

      otherDocuments: {
        type: [
          new mongoose.Schema(
            {
              name: {
                type: String,
                required: true,
                trim: true,
                maxlength: 150,
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
            }
          ),
        ],
        default: [],
      },
    },

    // ==================================================
    // PAYROLL
    // ==================================================

    bankAccount: {
      type: String,
      default: "",
      trim: true,
      maxlength: 30,
    },

    ifsc: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
      validate: {
        validator: function (value) {
          if (!value) return true;
          return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(value);
        },
        message: "Invalid IFSC code",
      },
    },

    bankName: {
      type: String,
      default: "",
      trim: true,
      maxlength: 100,
    },

    accountHolderName: {
      type: String,
      default: "",
      trim: true,
      maxlength: 100,
    },

    // ==================================================
    // ADMIN / LEFT
    // ==================================================

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
  },
  {
    timestamps: true,
  }
);

teacherProfileSchema.statics.SELF_EDITABLE_FIELDS = [
  "profilePhoto",
  "bio",
];

teacherProfileSchema.statics.ADMIN_ONLY_FIELDS = [
  // Professional
  "qualification",
  "specialization",
  "employmentType",
  "previousInstitutions",
  "status",
  "employeeId",
  "joiningDate",
  "experienceYears",

  // Contact
  "phone",
  "alternatePhone",
  "personalEmail",
  "address",
  "emergencyContact",

  // Identity
  "aadharNumber",
  "panNumber",
  "nationality",
  "category",
  "religion",
  "dateOfBirth",
  "gender",
  "bloodGroup",
  "maritalStatus",

  // Payroll
  "bankAccount",
  "ifsc",
  "bankName",
  "accountHolderName",

  // Leaving
  "leftReason",
  "leftDate",
];
teacherProfileSchema.statics.DOCUMENT_TYPES = [
  "AADHAR",
  "PAN",
  "RESUME",
  "DEGREE_CERTIFICATE",
  "EXPERIENCE_CERTIFICATE",
  "OFFER_LETTER",
  "JOINING_LETTER",
  "APPOINTMENT_LETTER",
  "OTHER",
];

// ======================================================
// INDEXES
// ======================================================

/* teacherProfileSchema.index({ status: 1 }); */
teacherProfileSchema.index({ employeeId: 1 });

module.exports = mongoose.model(
  "TeacherProfile",
  teacherProfileSchema
);