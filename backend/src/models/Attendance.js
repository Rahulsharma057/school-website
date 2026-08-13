const mongoose = require("mongoose");

const attendanceRecordSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["PRESENT", "ABSENT", "LEAVE"],
      required: true,
    },
  },
  { _id: false }
);

const attendanceSchema = new mongoose.Schema(
  {
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    records: [attendanceRecordSchema], // saare students ek hi document mein
  },
  { timestamps: true }
);

// ek class ki ek din mein sirf ek hi attendance document bane
attendanceSchema.index({ class: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);