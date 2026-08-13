const mongoose = require("mongoose");

const academicHistorySchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true, // us saal jis class mein tha
    },
    rollNumber: {
      type: String,
      required: true,
    },
    academicYear: {
      type: String,
      required: true, // e.g. "2025-2026"
    },
    result: {
      type: String,
      enum: ["PROMOTED", "HOLD_BACK", "GRADUATED"],
      required: true,
    },
    promotedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AcademicHistory", academicHistorySchema);