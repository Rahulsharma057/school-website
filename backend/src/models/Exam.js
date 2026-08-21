const mongoose = require("mongoose");

const examComponentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    maxMarks: { type: Number, required: true, min: 0 },
    passingMarks: { type: Number, default: 0, min: 0 },
    weightage: { type: Number, default: 0, min: 0, max: 100 },
  },
  { _id: false }
);

const examSubjectSchema = new mongoose.Schema(
  {
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    subjectName: { type: String, required: true, trim: true },
    subjectCode: { type: String, trim: true, uppercase: true, default: "" },
    subjectType: {
      type: String,
      enum: ["COMPULSORY", "OPTIONAL", "ELECTIVE", "ADDITIONAL"],
      default: "COMPULSORY",
    },
    optionalGroup: { type: String, trim: true, default: null },
    components: { type: [examComponentSchema], default: [] },
    maxMarks: { type: Number, required: true, min: 0 },
    passingMarks: { type: Number, default: 0, min: 0 },
    weightage: { type: Number, default: 100, min: 0, max: 100 },
    isOptional: { type: Boolean, default: false },
  },
  { _id: false }
);

const examSchema = new mongoose.Schema(
  {
    examName: { type: String, required: true, trim: true },
    examCode: { type: String, trim: true, uppercase: true, default: "" },
    academicYear: { type: String, required: true, trim: true },

    institutionType: { type: String, enum: ["SCHOOL", "COLLEGE"], required: true },

    class: { type: mongoose.Schema.Types.ObjectId, ref: "Class", default: null },

    program: { type: mongoose.Schema.Types.ObjectId, ref: "Program", default: null },
    semester: { type: Number, default: null, min: 1 },
    totalSemesters: { type: Number, default: null, min: 1 },

    examCategory: {
      type: String,
      enum: [
        "PERIODIC_TEST", "UNIT_TEST", "INTERNAL", "MID_TERM", "MID_SEMESTER",
        "HALF_YEARLY", "PRE_ANNUAL", "ANNUAL", "END_SEMESTER", "PRACTICAL",
        "PROJECT", "ASSIGNMENT", "OTHER",
      ],
      default: "OTHER",
    },

    periodName: { type: String, trim: true, default: null },

    syllabusType: {
      type: String,
      enum: ["FULL_SYLLABUS", "PARTIAL_SYLLABUS", "CUSTOM"],
      default: "FULL_SYLLABUS",
    },
    syllabusDescription: { type: String, trim: true, default: "" },

    subjects: { type: [examSubjectSchema], default: [] },

    calculationMethod: { type: String, enum: ["DIRECT_TOTAL", "WEIGHTED"], default: "DIRECT_TOTAL" },
    passingType: { type: String, enum: ["NONE", "PERCENTAGE", "MARKS"], default: "NONE" },
    passingPercentage: { type: Number, default: 0, min: 0, max: 100 },

    // NEW — final-result combination ke liye zaroori (resultController isko use karta hai)
    resultContribution: {
      type: Boolean,
      default: true, // false = ye exam sirf practice hai, final result mein count nahi hoga
    },

    weightage: {
      type: Number,
      default: 100, // is exam ka final/annual result mein kitna weightage hai (e.g. Half Yearly 30%, Annual 70%)
      min: 0,
      max: 100,
    },

    isFinal: {
      type: Boolean,
      default: false, // true = ye saal/semester ka aakhri exam hai (Annual / End Semester)
    },

    status: { type: String, enum: ["DRAFT", "OPEN", "PUBLISHED", "LOCKED"], default: "DRAFT" },

    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

examSchema.index({ institutionType: 1, academicYear: 1 });
examSchema.index({ institutionType: 1, class: 1, academicYear: 1 });
examSchema.index({ institutionType: 1, program: 1, semester: 1, academicYear: 1 });
examSchema.index({ examCategory: 1 });

module.exports = mongoose.models.Exam || mongoose.model("Exam", examSchema);