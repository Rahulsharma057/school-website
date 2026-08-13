const FeePayment = require("../models/FeePayment");

// Splits a total amount into N installments, evenly — last installment absorbs
// any rounding remainder so the sum always equals totalAmount exactly.
function splitIntoInstallments(totalAmount, count, startDate = new Date(), frequencyMonths = 1) {
  const n = Math.max(1, Number(count) || 1);
  const base = Math.floor((totalAmount / n) * 100) / 100;
  const installments = [];
  let allocated = 0;

  for (let i = 0; i < n; i++) {
    const isLast = i === n - 1;
    const amount = isLast ? Math.round((totalAmount - allocated) * 100) / 100 : base;
    allocated += amount;

    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i * frequencyMonths);

    installments.push({ installmentNo: i + 1, dueDate, amount, paidAmount: 0, status: "PENDING" });
  }

  return installments;
}

// Builds a StudentFee component from a structure component, applying any
// per-student override (custom amount / installment count / start date).
function buildComponentFromStructure(structureComponent, override = {}) {
  const totalAmount = override.totalAmount ?? structureComponent.amount;
  const installmentCount = override.installmentCount ?? structureComponent.installmentCount ?? 1;

  const installments =
    structureComponent.paymentType === "ONE_TIME"
      ? [{ installmentNo: 1, dueDate: override.dueDate || null, amount: totalAmount, paidAmount: 0, status: "PENDING" }]
      : splitIntoInstallments(totalAmount, installmentCount, override.installmentStartDate || new Date(), override.frequencyMonths || 1);

  return {
    componentId: structureComponent.id,
    name: structureComponent.name,
    category: structureComponent.category,
    paymentType: structureComponent.paymentType,
    totalAmount,
    waived: override.waived ?? false,
    isCustom: false,
    installments,
  };
}

// Receipt number: RCPT-<academicYear>-<sequence>. Sequence is per academic
// year (not globally), so numbering restarts each year.
async function generateReceiptNumber(academicYear) {
  const yearTag = academicYear.replace(/[^0-9]/g, "").slice(0, 4) || new Date().getFullYear();
  const count = await FeePayment.countDocuments({
    receiptNumber: { $regex: `^RCPT-${yearTag}-` },
  });
  return `RCPT-${yearTag}-${String(count + 1).padStart(5, "0")}`;
}

module.exports = { splitIntoInstallments, buildComponentFromStructure, generateReceiptNumber };