const mongoose = require("mongoose");
const { randomUUID } = require("crypto");

const FEE_CATEGORIES = [
  "TUITION", "EXAM", "REGISTRATION", "UNIFORM", "TRANSPORT",
  "LIBRARY", "LAB", "SPORTS", "ADMISSION", "OTHER",
];

const feeComponentSchema = new mongoose.Schema(
  {
    id: { type: String, default: () => randomUUID() },
    name: { type: String, required: true, trim: true }, // "Tuition Fee", "Exam Fee", "Dress Fee"
    category: { type: String, enum: FEE_CATEGORIES, default: "OTHER" },
    paymentType: { type: String, enum: ["ONE_TIME", "INSTALLMENT"], required: true },
    amount: { type: Number, required: true, min: 0 }, // total amount for the full academic year
    installmentCount: { type: Number, default: 1, min: 1 }, // only meaningful when paymentType = INSTALLMENT
    mandatory: { type: Boolean, default: true }, // false = admin can waive per student
  },
  { _id: false },
);

const feeStructureSchema = new mongoose.Schema(
  {
    class: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    academicYear: { type: String, required: true, trim: true }, // "2026-27"
    components: {
      type: [feeComponentSchema],
      validate: (arr) => Array.isArray(arr) && arr.length > 0,
    },
    status: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

feeStructureSchema.index({ class: 1, academicYear: 1 }, { unique: true });

module.exports = mongoose.model("FeeStructure", feeStructureSchema);
module.exports.FEE_CATEGORIES = FEE_CATEGORIES;