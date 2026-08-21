const mongoose = require("mongoose");

const programSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true, uppercase: true, default: "" },
    durationYears: { type: Number, required: true, min: 1, max: 6 },
    totalSemesters: { type: Number, required: true, min: 1 },
    programCoordinator: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
  },
  { timestamps: true }
);

programSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.models.Program || mongoose.model("Program", programSchema);