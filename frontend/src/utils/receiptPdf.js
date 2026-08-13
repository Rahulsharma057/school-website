import { jsPDF } from "jspdf";

// Generates and downloads a clean A5 receipt PDF entirely client-side —
// no server round-trip, no extra cost. `payment` is a FeePayment record;
// `meta` fills in context the payment object itself doesn't carry
// (student name / roll / class / academic year), since different tables
// populate slightly different fields.
export function downloadReceiptPdf(payment, meta = {}) {
  const doc = new jsPDF({ unit: "mm", format: "a5" });
  const marginX = 15;
  const rightEdge = 133;
  let y = 18;

  doc.setFontSize(16);
  doc.setFont(undefined, "bold");
  doc.text(meta.schoolName || "Fee Payment Receipt", marginX, y);

  y += 8;
  doc.setDrawColor(200);
  doc.line(marginX, y, rightEdge, y);
  y += 10;

  doc.setFontSize(11);

  const rows = [
    ["Receipt No.", payment.receiptNumber],
    ["Date", payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString("en-IN") : "—"],
    ["Student", meta.studentName || "—"],
    ["Roll No.", meta.rollNumber || "—"],
    ["Class", meta.className || "—"],
    ["Academic Year", meta.academicYear || "—"],
    [
      "Fee Component",
      `${payment.componentName || "—"}${payment.installmentNo ? ` (Installment #${payment.installmentNo})` : ""}`,
    ],
    ["Payment Mode", payment.paymentMode || "—"],
    ["Collected By", payment.collectedBy?.name || "—"],
  ];

  rows.forEach(([label, value]) => {
    doc.setFont(undefined, "bold");
    doc.text(`${label}:`, marginX, y);
    doc.setFont(undefined, "normal");
    doc.text(String(value ?? "—"), marginX + 42, y);
    y += 7;
  });

  y += 3;
  doc.setDrawColor(200);
  doc.line(marginX, y, rightEdge, y);
  y += 10;

  doc.setFontSize(14);
  doc.setFont(undefined, "bold");
  doc.text(`Amount Paid: Rs. ${Number(payment.amountPaid || 0).toLocaleString("en-IN")}`, marginX, y);

  y += 15;
  doc.setFontSize(9);
  doc.setFont(undefined, "italic");
  doc.text("This is a computer-generated receipt.", marginX, y);

  doc.save(`Receipt-${payment.receiptNumber || "payment"}.pdf`);
}
