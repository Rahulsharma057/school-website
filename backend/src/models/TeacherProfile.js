const mongoose = require("mongoose");

const teacherProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    qualification: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["ACTIVE", "LEFT"],
      default: "ACTIVE",
    },

    // ===== SELF-EDITABLE (teacher apne aap update kar sakta hai) =====
    profilePhoto: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
      maxlength: 300,
    },

    // ===== ADMIN-ONLY =====
    address: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      pincode: { type: String, default: "" },
    },
    phone: {
      type: String,
      default: "",
    },
    emergencyContact: {
      name: { type: String, default: "" },
      phone: { type: String, default: "" },
      relation: { type: String, default: "" },
    },
    employeeId: {
      type: String,
      default: "",
    },
    joiningDate: {
      type: Date,
      default: null,
    },
    experienceYears: {
      type: Number,
      default: 0,
      min: 0,
    },
    subjects: {
      type: [String],
      default: [],
    },
    classTeacherOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      default: null,
    },
    leftReason: {
      type: String,
      default: "",
    },
    leftDate: {
      type: Date,
      default: null,
    },

    // ---- Identity document (Aadhar) ----
    aadharNumber: {
      type: String,
      default: "",
    },
    aadharCardUrl: {
      type: String,
      default: "",
    },

    // ---- Statutory / demographic fields ----
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

// Fields jo teacher khud apni /my-profile PATCH request se edit kar sakta hai
teacherProfileSchema.statics.SELF_EDITABLE_FIELDS = [
  "profilePhoto",
  "bio",
];

// Fields jo sirf admin/super_admin/principal edit kar sakte hain
teacherProfileSchema.statics.ADMIN_ONLY_FIELDS = [
  "qualification",
  "status",
  "employeeId",
  "joiningDate",
  "experienceYears",
  "subjects",
  "classTeacherOf",
  "leftReason",
  "leftDate",
  "phone",
  "address",
  "emergencyContact",
  "aadharNumber",
  "aadharCardUrl",
  "category",
  "religion",
  "nationality",
];

module.exports = mongoose.model("TeacherProfile", teacherProfileSchema);