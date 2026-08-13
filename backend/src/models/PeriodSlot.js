const mongoose = require("mongoose");

const periodSlotSchema = new mongoose.Schema(
  {
    periodNumber: { type: Number, required: true }, // 1, 2, 3...
    label: { type: String, default: "" }, // e.g. "Lunch Break", "Period 1" (optional custom name)
    startTime: { type: String, required: true }, // "09:00" (24hr format string, simple to store/compare)
    endTime: { type: String, required: true }, // "09:45"
    isBreak: { type: Boolean, default: false }, // true = Lunch/Recess, subject/teacher assign nahi hoga
  },
  { timestamps: true }
);

periodSlotSchema.index({ periodNumber: 1 }, { unique: true });

module.exports = mongoose.model("PeriodSlot", periodSlotSchema);