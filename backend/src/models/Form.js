const mongoose = require("mongoose");

const DEFAULT_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const DEFAULT_MAX_FILE_SIZE_MB = 5;

// FIX: conditional logic now supports MULTIPLE rules (AND/OR) instead of
// a single rule — "show Field C only if A=X AND B=Y" is now expressible.
// requiredWhenVisible lets a field stay visible but only become required
// once its condition is true ("Cheque Number required only if Payment
// Method = Cheque").
const conditionalRuleSchema = new mongoose.Schema(
  {
    fieldName: { type: String, required: true, trim: true },
    operator: { type: String, enum: ["equals", "notEquals", "contains"], default: "equals" },
    value: { type: String, default: "" },
  },
  { _id: false },
);

const fieldSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: [
        "text",
        "textarea",
        "email",
        "phone",
        "number",
        "date",
        "select",
        "radio",
        "checkbox",
        "file",
        // FIX: a visual-only heading/divider, used to break long forms
        // into sections. Never stored on FormEntry.data, never required.
        "section",
      ],
      required: true,
    },

    dataType: {
      type: String,
      enum: ["String", "Number", "Boolean", "Date", "Array"],
      default: "String",
    },

    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    placeholder: {
      type: String,
      default: "",
    },

    helpText: {
      type: String,
      default: "",
    },

    required: {
      type: Boolean,
      default: false,
    },

    options: [
      {
        type: String,
        trim: true,
      },
    ],

    minLength: {
      type: Number,
      default: null,
    },
    maxLength: {
      type: Number,
      default: 500,
    },

    min: {
      type: Number,
      default: null,
    },
    max: {
      type: Number,
      default: null,
    },

    accept: {
      type: [String],
      default: () => [...DEFAULT_IMAGE_MIME_TYPES],
    },
    maxFileSizeMB: {
      type: Number,
      default: DEFAULT_MAX_FILE_SIZE_MB,
    },
    maxFiles: {
      type: Number,
      default: 1,
    },

    width: {
      type: String,
      enum: ["full", "half", "third", "quarter"],
      default: "full",
    },

    order: {
      type: Number,
      default: 0,
    },

    showInTable: {
      type: Boolean,
      default: true,
    },

    // FIX: rewritten to a rule-set instead of a single rule.
    conditional: {
      enabled: { type: Boolean, default: false },
      logic: { type: String, enum: ["AND", "OR"], default: "AND" },
      rules: [conditionalRuleSchema],
      // If true, this field becomes required ONLY while its condition
      // is true. If false, `required` above is used as-is regardless of
      // visibility.
      requiredWhenVisible: { type: Boolean, default: false },
    },
  },
  { _id: false },
);

const ROLE_VALUES = ["SUPER_ADMIN", "ADMIN", "EDITOR", "VIEWER"];

const formSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: 150,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    description: {
      type: String,
      default: "",
      maxlength: 500,
    },

    fields: [fieldSchema],

    submitButtonText: {
      type: String,
      default: "Submit",
    },

    successMessage: {
      type: String,
      default: "Thank you! Your response has been submitted.",
    },

    // Admin's own notification email — kept as-is; actually wired to send
    // now (see formEntry.controller's sendSubmissionNotifications).
    notifyEmail: {
      type: String,
      default: "",
    },

    status: {
      type: Boolean,
      default: true,
    },

    layout: {
      columns: {
        type: Number,
        enum: [1, 2],
        default: 1,
      },
      style: {
        type: String,
        enum: ["card", "plain", "minimal"],
        default: "card",
      },
      primaryColor: {
        type: String,
        default: "#18181b",
      },
    },

    adminTableSlug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    accessControl: {
      viewRoles: {
        type: [String],
        enum: ROLE_VALUES,
        default: [],
      },
      tableViewRoles: {
        type: [String],
        enum: ROLE_VALUES,
        default: ["SUPER_ADMIN", "ADMIN", "EDITOR"],
      },
    },

    entryCount: {
      type: Number,
      default: 0,
    },

    submission: {
      requireConfirmation: { type: Boolean, default: false },
      confirmationMessage: {
        type: String,
        default: "Are you sure you want to submit this form?",
      },
      allowSubmitterEdit: { type: Boolean, default: false },
      editWindowHours: { type: Number, default: 72 },

      // FIX: auto-responder sent to the SUBMITTER's own email, separate
      // from notifyEmail (which notifies the admin).
      autoResponder: {
        enabled: { type: Boolean, default: false },
        subject: { type: String, default: "We received your submission" },
        message: {
          type: String,
          default: "Thanks for submitting {{formTitle}}. We'll be in touch soon.",
        },
      },
    },

    // FIX: opt-in third-party notification on every new submission —
    // works with Slack/Discord incoming webhooks or any custom endpoint.
    notifications: {
      webhookEnabled: { type: Boolean, default: false },
      webhookUrl: { type: String, default: "" },
    },

    // FIX: spam/abuse controls. Honeypot is a hidden trap field the
    // renderer injects; a filled value silently no-ops the submission.
    // Duplicate check blocks the same submitter (by email/phone) from
    // submitting the same form again within a time window.
    antiSpam: {
      honeypotEnabled: { type: Boolean, default: true },
      duplicateCheck: {
        enabled: { type: Boolean, default: false },
        windowHours: { type: Number, default: 24 },
      },
    },
  },
  { timestamps: true },
);

formSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Form", formSchema);
module.exports.ROLE_VALUES = ROLE_VALUES;
module.exports.DEFAULT_IMAGE_MIME_TYPES = DEFAULT_IMAGE_MIME_TYPES;
module.exports.DEFAULT_MAX_FILE_SIZE_MB = DEFAULT_MAX_FILE_SIZE_MB;