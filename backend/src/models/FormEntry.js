const mongoose = require("mongoose");

// ================= UPLOADED FILE SCHEMA =================

const uploadedFileSchema = new mongoose.Schema(
  {
    fieldName: { type: String, required: true },
    url: { type: String, required: true },
    public_id: { type: String, required: true },
    originalName: { type: String, default: "" },
    mimeType: { type: String, default: "" },
    size: { type: Number, default: 0 },
  },
  { _id: false },
);

// ================= FORM ENTRY SCHEMA =================

const formEntrySchema = new mongoose.Schema(
  {
    // Now that Form is a registered model, this can safely `ref` it —
    // enables .populate("formId") when needed, while formTitle/formSlug
    // below stay as a snapshot for fast listing without populating.
    formId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Form",
      required: true,
      index: true,
    },

    formTitle: {
      type: String,
      default: "",
    },

    formSlug: {
      type: String,
      default: "",
      index: true,
    },

    // The actual submitted values, keyed by field name.
    // Mixed because fields are fully dynamic per form.
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: {},
    },

    files: [uploadedFileSchema],

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "archived"],
      default: "pending",
      index: true,
    },

    submitterName: {
      type: String,
      default: "",
      trim: true,
    },

    submitterEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },

    submitterPhone: {
      type: String,
      default: "",
      trim: true,
    },

    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    source: {
      type: String,
      default: "route",
    },

    ip: {
      type: String,
      default: "",
    },

    userAgent: {
      type: String,
      default: "",
    },

    deviceType: {
      type: String,
      enum: ["desktop", "mobile", "tablet", "unknown"],
      default: "unknown",
    },

    // ---- Review workflow ----

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewNote: {
      type: String,
      default: "",
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    // ---- Soft delete ----

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
// FIX: private, unguessable capability token — lets the original
    // submitter edit their own entry later without needing an account.
    // Only issued when the form's submission.allowSubmitterEdit is on.
    editToken: {
      type: String,
      default: null,
      index: true,
      sparse: true,
    },

    editTokenExpiresAt: {
      type: Date,
      default: null,
    },
    // Room for referrer/UTM/locale etc. without a schema migration.
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

formEntrySchema.index({ formId: 1, createdAt: -1 });
formEntrySchema.index({ formId: 1, status: 1, createdAt: -1 });
formEntrySchema.index({ isDeleted: 1, createdAt: -1 });

formEntrySchema.index({
  formTitle: "text",
  submitterName: "text",
  submitterEmail: "text",
  submitterPhone: "text",
});

module.exports = mongoose.model("FormEntry", formEntrySchema);