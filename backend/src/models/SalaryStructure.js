const mongoose = require("mongoose");

const salaryStructureSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    basicSalary: { type: Number, required: true },
    joiningDate: { type: Date, required: true },
    effectiveFrom: { type: Date, required: true, default: Date.now },
    effectiveTo: { type: Date, default: null }, // null = currently active
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SalaryStructure", salaryStructureSchema);