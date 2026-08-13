const mongoose = require("mongoose");

const StudentFee = require("../models/StudentFee");
const FeePayment = require("../models/FeePayment");
const { generateReceiptNumber } = require("../utils/feeHelpers");

const asyncHandler = require("../helpers/asyncHandler");
const ApiResponse = require("../helpers/ApiResponse");
const ApiError = require("../helpers/ApiError");

// ================= COLLECT PAYMENT =================
// body: { componentId, installmentNo?, amountPaid, paymentMode?, remarks? }
// If installmentNo is omitted, the amount auto-allocates across that
// component's earliest unpaid installments in order — handy for "student
// paid a lump sum, split it across whatever's due."
exports.collectPayment = asyncHandler(async (req, res) => {
  const { componentId, installmentNo, amountPaid, paymentMode, remarks } = req.body;

  if (!componentId) throw new ApiError(400, "componentId is required");
  if (typeof amountPaid !== "number" || amountPaid <= 0) {
    throw new ApiError(400, "amountPaid must be a positive number");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const studentFee = await StudentFee.findById(req.params.id).session(session);
    if (!studentFee) throw new ApiError(404, "Student fee record not found");

    const component = studentFee.components.find((c) => c.componentId === componentId);
    if (!component) throw new ApiError(404, "Fee component not found on this student's record");
    if (component.waived) throw new ApiError(400, "This fee component is waived — no payment needed");

    const paymentsCreated = [];
    let remaining = amountPaid;

    const targetInstallments = installmentNo
      ? component.installments.filter((i) => i.installmentNo === installmentNo)
      : component.installments
          .filter((i) => i.paidAmount < i.amount)
          .sort((a, b) => a.installmentNo - b.installmentNo);

    if (!targetInstallments.length) throw new ApiError(400, "No matching unpaid installment found");

    for (const inst of targetInstallments) {
      if (remaining <= 0) break;

      const due = Math.round((inst.amount - inst.paidAmount) * 100) / 100;
      if (due <= 0) continue;

      const applied = Math.min(due, remaining);
      inst.paidAmount = Math.round((inst.paidAmount + applied) * 100) / 100;
      remaining = Math.round((remaining - applied) * 100) / 100;

      const receiptNumber = await generateReceiptNumber(studentFee.academicYear);

      const [payment] = await FeePayment.create(
        [
          {
            studentFee: studentFee._id,
            student: studentFee.student,
            componentId,
            componentName: component.name,
            installmentNo: inst.installmentNo,
            amountPaid: applied,
            paymentMode: paymentMode || "CASH",
            receiptNumber,
            remarks: remarks || "",
            collectedBy: req.user._id,
          },
        ],
        { session },
      );

      paymentsCreated.push(payment);
    }

    if (remaining > 0.01) {
      throw new ApiError(400, `Amount exceeds total due for this component by ${remaining}`);
    }

    studentFee.recomputeTotals();
    await studentFee.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json(
      new ApiResponse(201, { studentFee, payments: paymentsCreated }, "Payment collected successfully"),
    );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

// ================= PAYMENT HISTORY FOR A STUDENT FEE RECORD =================
exports.getPaymentHistory = asyncHandler(async (req, res) => {
  const payments = await FeePayment.find({ studentFee: req.params.id })
    .populate("collectedBy", "name email")
    .sort({ paymentDate: -1 });

  return res.json(new ApiResponse(200, payments, "Payment history fetched successfully"));
});

// ================= ALL PAYMENTS (admin audit — who collected what) =================
exports.getAllPayments = asyncHandler(async (req, res) => {
  const { collectedBy, from, to, paymentMode } = req.query;

  const filter = {};
  if (collectedBy) filter.collectedBy = collectedBy;
  if (paymentMode) filter.paymentMode = paymentMode;
  if (from || to) {
    filter.paymentDate = {};
    if (from) filter.paymentDate.$gte = new Date(from);
    if (to) filter.paymentDate.$lte = new Date(to);
  }

  const payments = await FeePayment.find(filter)
    .populate("collectedBy", "name email")
    .populate({ path: "student", select: "rollNumber user", populate: { path: "user", select: "name" } })
    .sort({ paymentDate: -1 });

  const totalCollected = payments.reduce((sum, p) => sum + p.amountPaid, 0);

  return res.json(
    new ApiResponse(200, { payments, totalCollected, count: payments.length }, "Payments fetched successfully"),
  );
});

// ================= SINGLE RECEIPT =================
exports.getReceiptByNumber = asyncHandler(async (req, res) => {
  const payment = await FeePayment.findOne({ receiptNumber: req.params.receiptNumber })
    .populate("collectedBy", "name email")
    .populate({ path: "student", select: "rollNumber user", populate: { path: "user", select: "name email" } });

  if (!payment) throw new ApiError(404, "Receipt not found");

  return res.json(new ApiResponse(200, payment, "Receipt fetched successfully"));
});