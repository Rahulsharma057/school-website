const mongoose = require("mongoose");

const timetableSchema = new mongoose.Schema(
  {
    class: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    day: {
      type: String,
      enum: ["MON", "TUE", "WED", "THU", "FRI", "SAT"],
      required: true,
    },
    period: { type: mongoose.Schema.Types.ObjectId, ref: "PeriodSlot", required: true },
    subject: { type: String, required: true, trim: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    hasConflict: { type: Boolean, default: false }, // true = teacher double-booked (override se bana)
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

// HARD RULE: ek class ke ek din ke ek period mein sirf ek hi entry ho sakti hai
timetableSchema.index({ class: 1, day: 1, period: 1 }, { unique: true });

module.exports = mongoose.model("Timetable", timetableSchema);