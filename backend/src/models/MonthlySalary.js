const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    note: { type: String, default: "" },
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { _id: false }
);

const monthlySalarySchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    month: { type: Number, required: true }, // 1-12
    year: { type: Number, required: true },

    basicSalary: { type: Number, required: true }, // us mahine ki structure snapshot
    workingDays: { type: Number, required: true },
    presentDays: { type: Number, required: true },
    absentDays: { type: Number, required: true },
    leaveDays: { type: Number, required: true },

    calculatedSalary: { type: Number, required: true }, // total banti hui salary
    payments: [paymentSchema],
    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["PENDING", "PARTIAL", "PAID"],
      default: "PENDING",
    },

    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// ek teacher ki ek mahine ki sirf ek hi salary entry
monthlySalarySchema.index({ teacher: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model("MonthlySalary", monthlySalarySchema);