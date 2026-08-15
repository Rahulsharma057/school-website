const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema(
  {
    questionIndex: { type: Number, required: true },
    selectedOptionIndex: { type: Number, default: null }, // MCQ
    textAnswer: { type: String, default: "" }, // SHORT/LONG answer
    marksAwarded: { type: Number, default: 0 },
    isCorrect: { type: Boolean, default: null }, // MCQ ke liye auto-set, baaki ke liye teacher decide
  },
  { _id: false }
);

const submissionSchema = new mongoose.Schema(
  {
    assessment: { type: mongoose.Schema.Types.ObjectId, ref: "Assessment", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    answers: [answerSchema],

    totalScore: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["IN_PROGRESS", "SUBMITTED", "CHECKED"],
      default: "IN_PROGRESS",
    },

    submittedAt: { type: Date, default: null },
    checkedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    checkedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// ek student ka ek assessment mein sirf ek hi submission
submissionSchema.index({ assessment: 1, student: 1 }, { unique: true });

module.exports = mongoose.model("Submission", submissionSchema);