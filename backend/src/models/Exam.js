const mongoose = require("mongoose");

const examSubjectSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true, trim: true },
    maxMarks: { type: Number, required: true },
  },
  { _id: false }
);

const examSchema = new mongoose.Schema(
  {
    examName: {
      type: String,
      required: true,
      trim: true, // e.g. "Half Yearly 2026"
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    subjects: [examSubjectSchema], // list of subject + maxMarks
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Exam", examSchema);