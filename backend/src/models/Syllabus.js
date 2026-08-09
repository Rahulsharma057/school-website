const mongoose = require("mongoose");

const topicSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
  },
  { _id: false },
);

const subjectSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
    topics: [topicSchema],
  },
  { _id: false },
);

const ROLE_VALUES = ["SUPER_ADMIN", "ADMIN", "EDITOR", "VIEWER"];

// Where this syllabus should be surfaced across the site — purely a
// frontend hint; whatever section renders (homepage widget, footer
// links, etc.) queries by this key. Add new spots here as needed.
const PLACEMENT_VALUES = [
  "homepage",
  "academics-page",
  "navbar-dropdown",
  "footer",
  "notice-board",
];

const syllabusSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: 200,
    },

    schoolName: {
      type: String,
      required: [true, "School name is required"],
      trim: true,
    },

    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SchoolClass",
      required: true,
    },

    // snapshot — survives the class being renamed/deleted later
    className: {
      type: String,
      required: true,
      trim: true,
    },

    academicYear: {
      type: String,
      default: "",
      trim: true,
    },

    description: {
      type: String,
      default: "",
      maxlength: 500,
    },

    subjects: [subjectSchema],

    // Public route: /syllabus/:slug
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    status: {
      type: Boolean,
      default: true,
    },

    placements: {
      type: [String],
      enum: PLACEMENT_VALUES,
      default: [],
    },

    // Regenerated on every create/update
    pdf: {
      url: { type: String, default: "" },
      public_id: { type: String, default: "" },
      generatedAt: { type: Date, default: null },
    },

    accessControl: {
      viewRoles: {
        type: [String],
        enum: ROLE_VALUES,
        default: [], // empty = public
      },
    },
  },
  { timestamps: true },
);

syllabusSchema.index({ classId: 1, status: 1 });
syllabusSchema.index({ title: "text", schoolName: "text", className: "text" });

module.exports = mongoose.model("Syllabus", syllabusSchema);
module.exports.PLACEMENT_VALUES = PLACEMENT_VALUES;