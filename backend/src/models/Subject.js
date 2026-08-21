const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true, uppercase: true, default: "" },
    level: { type: String, enum: ["SCHOOL", "COLLEGE", "BOTH"], default: "BOTH" },
    hasPractical: { type: Boolean, default: false },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
  },
  { timestamps: true }
);

subjectSchema.index({ name: 1, level: 1 }, { unique: true });

module.exports = mongoose.models.Subject || mongoose.model("Subject", subjectSchema);