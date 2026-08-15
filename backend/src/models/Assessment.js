const mongoose = require("mongoose");

const optionSchema = new mongoose.Schema(
  { text: { type: String, required: true } },
  { _id: false }
);

const questionSchema = new mongoose.Schema({
  type: { type: String, enum: ["MCQ", "SHORT_ANSWER", "LONG_ANSWER"], required: true },
  text: { type: String, required: true },
  options: [optionSchema], // sirf MCQ ke liye
  correctOptionIndex: { type: Number, default: null }, // sirf MCQ ke liye (0-based)
  marks: { type: Number, required: true, default: 1 },
});

const assessmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    subject: { type: String, required: true, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    questions: [questionSchema],
    totalMarks: { type: Number, default: 0 },

    durationMinutes: { type: Number, default: 30 },
    dueDate: { type: Date, default: null },

    // agar checked results ko Exam/Result module mein push karna ho
    linkedExam: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", default: null },

    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "CLOSED"],
      default: "DRAFT",
    },
  },
  { timestamps: true }
);

assessmentSchema.index({ class: 1, status: 1, createdAt: -1 });
assessmentSchema.index({ createdBy: 1, createdAt: -1 });

// save se pehle totalMarks auto-calculate
assessmentSchema.pre("save", function () {
  this.totalMarks = this.questions.reduce(
    (sum, q) => sum + (q.marks || 0),
    0
  );
});

module.exports = mongoose.model("Assessment", assessmentSchema);