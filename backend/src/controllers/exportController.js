const ExcelJS = require("exceljs");
const TeacherAttendance = require("../models/TeacherAttendance");
const MonthlySalary = require("../models/MonthlySalary");
const asyncHandler = require("../helpers/asyncHandler");

// ================= EXPORT ATTENDANCE (monthly, teacher-wise) =================
// Access: SUPER_ADMIN, ADMIN, PRINCIPAL

exports.exportTeacherAttendance = asyncHandler(async (req, res) => {
  const { teacherId, month, year } = req.query;

  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59);

  const records = await TeacherAttendance.find({
    teacher: teacherId,
    date: { $gte: monthStart, $lte: monthEnd },
  }).populate("teacher", "name email").sort({ date: 1 });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Attendance");

  sheet.columns = [
    { header: "Date", key: "date", width: 15 },
    { header: "Teacher", key: "teacher", width: 25 },
    { header: "Status", key: "status", width: 15 },
  ];

  records.forEach((r) => {
    sheet.addRow({
      date: new Date(r.date).toLocaleDateString("en-IN"),
      teacher: r.teacher?.name || "—",
      status: r.status,
    });
  });

  sheet.getRow(1).font = { bold: true };

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename=attendance-${month}-${year}.xlsx`);

  await workbook.xlsx.write(res);
  res.end();
});

// ================= EXPORT SALARY (yearly, teacher-wise) =================

exports.exportTeacherSalary = asyncHandler(async (req, res) => {
  const { teacherId, year } = req.query;

  const records = await MonthlySalary.find({ teacher: teacherId, year }).populate("teacher", "name email").sort({ month: 1 });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Salary");

  sheet.columns = [
    { header: "Month", key: "month", width: 12 },
    { header: "Working Days", key: "workingDays", width: 14 },
    { header: "Present", key: "presentDays", width: 12 },
    { header: "Half Day", key: "halfDays", width: 12 },
    { header: "Paid Leave", key: "paidLeaveDays", width: 12 },
    { header: "Unpaid Leave", key: "unpaidLeaveDays", width: 14 },
    { header: "Calculated Salary", key: "calculatedSalary", width: 18 },
    { header: "Deductions", key: "totalDeductions", width: 14 },
    { header: "Bonus", key: "totalBonus", width: 12 },
    { header: "Net Salary", key: "netSalary", width: 14 },
    { header: "Paid Amount", key: "paidAmount", width: 14 },
    { header: "Status", key: "status", width: 12 },
  ];

  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  records.forEach((r) => {
    sheet.addRow({
      month: months[r.month - 1],
      workingDays: r.workingDays,
      presentDays: r.presentDays,
      halfDays: r.halfDays,
      paidLeaveDays: r.paidLeaveDays,
      unpaidLeaveDays: r.unpaidLeaveDays,
      calculatedSalary: r.calculatedSalary,
      totalDeductions: r.totalDeductions,
      totalBonus: r.totalBonus,
      netSalary: r.netSalary,
      paidAmount: r.paidAmount,
      status: r.status,
    });
  });

  sheet.getRow(1).font = { bold: true };

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename=salary-${year}.xlsx`);

  await workbook.xlsx.write(res);
  res.end();
});