const mongoose = require("mongoose");

const subjectMarksSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true },
    marksObtained: { type: Number, required: true },
    maxMarks: { type: Number, required: true },
  },
  { _id: false }
);

const resultSchema = new mongoose.Schema(
  {
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    marks: [subjectMarksSchema],
    totalObtained: { type: Number, default: 0 },
    totalMax: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    enteredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// ek student ka ek exam mein sirf ek hi result document
resultSchema.index({ exam: 1, student: 1 }, { unique: true });

module.exports = mongoose.model("Result", resultSchema);