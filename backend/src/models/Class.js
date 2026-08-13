const mongoose = require("mongoose");

const classSchema = new mongoose.Schema(
  {
    className: {
      type: String,
      required: true,
      trim: true, // e.g. "10"
    },
    section: {
      type: String,
      required: true,
      trim: true, // e.g. "A"
    },
    classTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// same class-section combo dobara na bane
classSchema.index({ className: 1, section: 1 }, { unique: true });

module.exports = mongoose.model("Class", classSchema);