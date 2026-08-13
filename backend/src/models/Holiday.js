const mongoose = require("mongoose");

const holidaySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true }, // e.g. "Diwali"
    date: { type: Date, required: true },
    type: {
      type: String,
      enum: ["NATIONAL", "SCHOOL", "OTHER"],
      default: "SCHOOL",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// ek din ka ek hi holiday entry ho
holidaySchema.index({ date: 1 }, { unique: true });

module.exports = mongoose.model("Holiday", holidaySchema);