const mongoose = require("mongoose");

const salaryAdjustmentSchema = new mongoose.Schema(
  {
    monthlySalary: { type: mongoose.Schema.Types.ObjectId, ref: "MonthlySalary", required: true },
    type: { type: String, enum: ["DEDUCTION", "BONUS"], required: true },
    amount: { type: Number, required: true },
    reason: { type: String, required: true },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SalaryAdjustment", salaryAdjustmentSchema);