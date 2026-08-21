const mongoose = require("mongoose");

// =====================================================
// COMPONENT MARKS
// =====================================================

const componentMarksSchema = new mongoose.Schema(
  {
    component: { type: String, required: true, trim: true },
    marksObtained: { type: Number, default: 0, min: 0 },
    maxMarks: { type: Number, required: true, min: 0 },
    passingMarks: { type: Number, default: 0, min: 0 },

    weightage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    status: {
      type: String,
      enum: ["PRESENT", "ABSENT", "EXEMPTED"],
      default: "PRESENT",
    },
  },
  { _id: false }
);

// =====================================================
// SUBJECT MARKS
// =====================================================

const subjectMarksSchema = new mongoose.Schema(
  {
    // FIX (issue #2): pehle String (subjectName) tha - teacher ka
    // ek chhota typo ("Maths" vs "Mathematics") do exams ke result
    // ko silently alag subject bana deta tha, final-merge me miss
    // ho jaate the. Ab ObjectId hai - Exam.subjects[].subject se
    // seedha, unambiguous match hota hai. subjectName sirf display
    // ke liye alag se store hota hai.
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },

    subjectName: { type: String, trim: true, default: "" },

    subjectType: {
      type: String,
      enum: ["COMPULSORY", "OPTIONAL", "ELECTIVE", "ADDITIONAL"],
      default: "COMPULSORY",
    },

    optionalGroup: { type: String, trim: true, default: null },

    components: { type: [componentMarksSchema], default: [] },

    marksObtained: { type: Number, default: 0, min: 0 },
    maxMarks: { type: Number, required: true, min: 0 },
    passingMarks: { type: Number, default: 0, min: 0 },
    percentage: { type: Number, default: 0, min: 0, max: 100 },

    grade: { type: String, trim: true, default: null },
    gradePoint: { type: Number, default: null },

    status: {
      type: String,
      enum: ["PASS", "FAIL", "ABSENT", "EXEMPTED", "PENDING"],
      default: "PENDING",
    },
  },
  { _id: false }
);

// =====================================================
// RESULT SCHEMA
// =====================================================

const resultSchema = new mongoose.Schema(
  {
    exam: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // School-only abhi (controller explicitly college ko block karta
    // hai - college ke liye Result ka poora program/semester support
    // alag phase me banega, taaki scope tight rahe).
    class: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },

    academicYear: { type: String, trim: true, default: null },

    periodType: { type: String, enum: ["YEARLY", "TERM", "SEMESTER", "OTHER"], default: "YEARLY" },
    periodName: { type: String, trim: true, default: null },

    marks: { type: [subjectMarksSchema], default: [] },

    selectedOptionalSubjects: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Subject",
      default: [],
    },

    failedSubjects: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Subject",
      default: [],
    },

    totalObtained: { type: Number, default: 0, min: 0 },
    totalMax: { type: Number, default: 0, min: 0 },
    percentage: { type: Number, default: 0, min: 0, max: 100 },

    grade: { type: String, trim: true, default: null },
    gradePoint: { type: Number, default: null },

    status: {
      type: String,
      enum: ["PASS", "FAIL", "ABSENT", "COMPARTMENT", "WITHHELD", "INCOMPLETE", "PENDING"],
      default: "PENDING",
    },

    isFinal: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: false },

    remarks: { type: String, trim: true, default: "" },

    enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

resultSchema.index({ exam: 1, student: 1 }, { unique: true });
resultSchema.index({ student: 1, academicYear: 1 });
resultSchema.index({ class: 1, exam: 1 });

module.exports = mongoose.models.Result || mongoose.model("Result", resultSchema);
