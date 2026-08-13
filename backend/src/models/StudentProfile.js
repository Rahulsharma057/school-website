const mongoose = require("mongoose");

const studentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // ek User ka ek hi StudentProfile
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    rollNumber: {
      type: String,
      required: true,
    },
    address: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      pincode: { type: String, default: "" },
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "LEFT", "GRADUATED"], // Module 6 me use hoga
      default: "ACTIVE",
    },
    leftReason: {
  type: String,
  default: "",
},
leftDate: {
  type: Date,
  default: null,
},
  },
  { timestamps: true }
);

// ek class ke andar roll number unique ho (globally unique nahi hona chahiye)
studentProfileSchema.index({ class: 1, rollNumber: 1 }, { unique: true });

module.exports = mongoose.model("StudentProfile", studentProfileSchema);