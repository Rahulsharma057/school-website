const mongoose = require("mongoose");

/* =========================================================
   SUBTOPIC
========================================================= */

const subtopicSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    order: {
      type: Number,
      default: 0,
    },
  },
  {
    _id: false,
  }
);

/* =========================================================
   TOPIC
========================================================= */

const topicSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    order: {
      type: Number,
      default: 0,
    },

    subtopics: {
      type: [subtopicSchema],
      default: [],
    },
  },
  {
    _id: false,
  }
);

/* =========================================================
   SUBJECT
========================================================= */

const subjectSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    order: {
      type: Number,
      default: 0,
    },

    topics: {
      type: [topicSchema],
      default: [],
    },
  },
  {
    _id: false,
  }
);

/* =========================================================
   ROLES
========================================================= */

const ROLE_VALUES = [
  "SUPER_ADMIN",
  "ADMIN",
  "EDITOR",
  "VIEWER",
];

/* =========================================================
   PLACEMENTS
========================================================= */

const PLACEMENT_VALUES = [
  "homepage",
  "academics-page",
  "navbar-dropdown",
  "footer",
  "notice-board",
];

/* =========================================================
   SYLLABUS
========================================================= */

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

    /* =====================================================
       IMPORTANT
       Actual Class model:
       mongoose.model("Class", ...)
    ===================================================== */

    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },

    /* =====================================================
       CLASS SNAPSHOT
    ===================================================== */

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
      trim: true,
    },

    /* =====================================================
       SUBJECTS
    ===================================================== */

    subjects: {
      type: [subjectSchema],
      default: [],
    },

    /* =====================================================
       SLUG
    ===================================================== */

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    /* =====================================================
       STATUS
    ===================================================== */

    status: {
      type: Boolean,
      default: true,
    },

    /* =====================================================
       PLACEMENTS
    ===================================================== */

    placements: {
      type: [String],
      enum: PLACEMENT_VALUES,
      default: [],
    },

    /* =====================================================
       PDF
    ===================================================== */

    pdf: {
      url: {
        type: String,
        default: "",
      },

      public_id: {
        type: String,
        default: "",
      },

      generatedAt: {
        type: Date,
        default: null,
      },
    },

    /* =====================================================
       ACCESS CONTROL
    ===================================================== */

    accessControl: {
      viewRoles: {
        type: [String],
        enum: ROLE_VALUES,
        default: [],
      },
    },
  },
  {
    timestamps: true,
  }
);

/* =========================================================
   INDEXES
========================================================= */

syllabusSchema.index({
  classId: 1,
  status: 1,
});

syllabusSchema.index({
  title: "text",
  schoolName: "text",
  className: "text",
});

module.exports =
  mongoose.models.Syllabus ||
  mongoose.model("Syllabus", syllabusSchema);

module.exports.PLACEMENT_VALUES = PLACEMENT_VALUES;