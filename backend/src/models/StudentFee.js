const mongoose = require("mongoose");

const installmentSchema = new mongoose.Schema(
  {
    installmentNo: { type: Number, required: true },
    dueDate: { type: Date, default: null },
    amount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["PENDING", "PARTIAL", "PAID", "OVERDUE"],
      default: "PENDING",
    },
  },
  { _id: false },
);

const studentFeeComponentSchema = new mongoose.Schema(
  {
    componentId: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, default: "OTHER" },
    paymentType: { type: String, enum: ["ONE_TIME", "INSTALLMENT"], required: true },
    totalAmount: { type: Number, required: true, min: 0 }, // per-student — can differ from structure (discount/customization)
    waived: { type: Boolean, default: false }, // admin ne is student ke liye maaf kar di
    isCustom: { type: Boolean, default: false }, // structure me nahi thi, is student ke liye alag se add hui
    installments: [installmentSchema],
  },
  { _id: false },
);

const studentFeeSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "StudentProfile", required: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    feeStructure: { type: mongoose.Schema.Types.ObjectId, ref: "FeeStructure", required: true },
    academicYear: { type: String, required: true },
    components: [studentFeeComponentSchema],

    totalAmount: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },
    totalDue: { type: Number, default: 0 },
    status: { type: String, enum: ["PENDING", "PARTIAL", "PAID"], default: "PENDING" },
  },
  { timestamps: true },
);

studentFeeSchema.index({ student: 1, academicYear: 1 }, { unique: true });

// Recompute totals + per-component/installment status whenever this doc is saved.
studentFeeSchema.methods.recomputeTotals = function () {
  const now = new Date();
  let totalAmount = 0;
  let totalPaid = 0;

  for (const comp of this.components) {
    if (comp.waived) continue;

    for (const inst of comp.installments) {
      totalAmount += inst.amount;
      totalPaid += inst.paidAmount;

      if (inst.paidAmount >= inst.amount) {
        inst.status = "PAID";
      } else if (inst.paidAmount > 0) {
        inst.status = "PARTIAL";
      } else if (inst.dueDate && inst.dueDate < now) {
        inst.status = "OVERDUE";
      } else {
        inst.status = "PENDING";
      }
    }
  }

  this.totalAmount = Math.round(totalAmount * 100) / 100;
  this.totalPaid = Math.round(totalPaid * 100) / 100;
  this.totalDue = Math.round((totalAmount - totalPaid) * 100) / 100;

  this.status = this.totalDue <= 0 ? "PAID" : this.totalPaid > 0 ? "PARTIAL" : "PENDING";
};

module.exports = mongoose.model("StudentFee", studentFeeSchema);