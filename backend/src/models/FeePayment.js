const mongoose = require("mongoose");

const feePaymentSchema = new mongoose.Schema(
  {
    studentFee: { type: mongoose.Schema.Types.ObjectId, ref: "StudentFee", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "StudentProfile", required: true },

    componentId: { type: String, required: true },
    componentName: { type: String, required: true },
    installmentNo: { type: Number, default: null }, // null for a ONE_TIME component

    amountPaid: { type: Number, required: true, min: 1 },
    paymentMode: {
      type: String,
      enum: ["CASH", "CARD", "UPI", "BANK_TRANSFER", "CHEQUE", "OTHER"],
      default: "CASH",
    },
    receiptNumber: { type: String, required: true, unique: true },
    remarks: { type: String, default: "" },

    collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    paymentDate: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

feePaymentSchema.index({ student: 1, paymentDate: -1 });
feePaymentSchema.index({ collectedBy: 1, paymentDate: -1 });

module.exports = mongoose.model("FeePayment", feePaymentSchema);