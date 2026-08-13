const mongoose = require("mongoose");

const leaveQuotaSchema = new mongoose.Schema(
  {
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    year: { type: Number, required: true },
    totalPaidLeaves: { type: Number, required: true, default: 12 }, // saal ki kul paid leaves
    usedPaidLeaves: { type: Number, default: 0 }, // approved+paid leaves ka running total
  },
  { timestamps: true }
);

leaveQuotaSchema.index({ teacher: 1, year: 1 }, { unique: true });

module.exports = mongoose.model("LeaveQuota", leaveQuotaSchema);