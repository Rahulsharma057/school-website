const SalaryStructure = require("../models/SalaryStructure");
const MonthlySalary = require("../models/MonthlySalary");
const TeacherAttendance = require("../models/TeacherAttendance");
const Holiday = require("../models/Holiday");
const asyncHandler = require("../helpers/asyncHandler");
const ApiResponse = require("../helpers/ApiResponse");

// ================= SET / UPDATE SALARY STRUCTURE =================
// Access: SUPER_ADMIN, ADMIN, PRINCIPAL
// Purani structure ko close karke nayi banayenge (history preserve)

exports.setSalaryStructure = asyncHandler(async (req, res) => {
  const { teacherId, basicSalary, joiningDate, effectiveFrom } = req.body;

  const startDate = effectiveFrom ? new Date(effectiveFrom) : new Date();

  // purani active structure ko close karo
  await SalaryStructure.updateMany(
    { teacher: teacherId, effectiveTo: null },
    { $set: { effectiveTo: startDate } }
  );

  const newStructure = await SalaryStructure.create({
    teacher: teacherId,
    basicSalary,
    joiningDate,
    effectiveFrom: startDate,
    effectiveTo: null,
    createdBy: req.user._id,
  });

  res.status(201).json(new ApiResponse(201, newStructure, "Salary structure updated successfully"));
});

// ================= GET CURRENT SALARY STRUCTURE =================

exports.getCurrentSalaryStructure = asyncHandler(async (req, res) => {
  const { teacherId } = req.params;

  const structure = await SalaryStructure.findOne({ teacher: teacherId, effectiveTo: null });

  if (!structure) {
    return res.status(404).json(new ApiResponse(404, null, "No active salary structure found"));
  }

  res.json(new ApiResponse(200, structure, "Salary structure fetched successfully"));
});

// ================= GENERATE MONTHLY SALARY (calculation core) =================
// Access: SUPER_ADMIN, ADMIN, PRINCIPAL

exports.generateMonthlySalary = asyncHandler(async (req, res) => {
  const { teacherId, month, year } = req.body;

  const structure = await SalaryStructure.findOne({ teacher: teacherId, effectiveTo: null });
  if (!structure) {
    return res.status(400).json(new ApiResponse(400, null, "No salary structure set for this teacher"));
  }

  const totalDaysInMonth = new Date(year, month, 0).getDate();

  let sundays = 0;
  for (let d = 1; d <= totalDaysInMonth; d++) {
    if (new Date(year, month - 1, d).getDay() === 0) sundays++;
  }

  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month - 1, totalDaysInMonth, 23, 59, 59);

  const holidays = await Holiday.countDocuments({ date: { $gte: monthStart, $lte: monthEnd } });
  const workingDays = totalDaysInMonth - sundays - holidays;

  // Attendance records
  const attendanceRecords = await TeacherAttendance.find({
    teacher: teacherId,
    date: { $gte: monthStart, $lte: monthEnd },
  });

  const presentDays = attendanceRecords.filter((a) => a.status === "PRESENT").length;
  const absentDays = attendanceRecords.filter((a) => a.status === "ABSENT").length;
  const halfDays = attendanceRecords.filter((a) => a.status === "HALF_DAY").length;

  // Approved leaves (paid/unpaid) is month ke
  const LeaveRequest = require("../models/LeaveRequest");
  const approvedLeaves = await LeaveRequest.find({
    teacher: teacherId,
    status: "APPROVED",
    fromDate: { $lte: monthEnd },
    toDate: { $gte: monthStart },
  });

  let paidLeaveDays = 0;
  let unpaidLeaveDays = 0;

  approvedLeaves.forEach((leave) => {
    // overlap ke din count karo is month ke andar
    const start = new Date(Math.max(new Date(leave.fromDate), monthStart));
    const end = new Date(Math.min(new Date(leave.toDate), monthEnd));
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    if (leave.leaveType === "PAID") paidLeaveDays += days;
    else unpaidLeaveDays += days;
  });

  // Paid days = Present + Half(0.5 each) + Paid Leave
  const paidDayUnits = presentDays + halfDays * 0.5 + paidLeaveDays;

  const perDaySalary = structure.basicSalary / workingDays;
  const calculatedSalary = Math.round(perDaySalary * paidDayUnits);

  const salaryRecord = await MonthlySalary.findOneAndUpdate(
    { teacher: teacherId, month, year },
    {
      teacher: teacherId,
      month,
      year,
      basicSalary: structure.basicSalary,
      workingDays,
      presentDays,
      absentDays,
      leaveDays: paidLeaveDays + unpaidLeaveDays,
      halfDays,
      paidLeaveDays,
      unpaidLeaveDays,
      calculatedSalary,
      netSalary: calculatedSalary, // adjustments baad mein isko badlenge
      totalDeductions: 0,
      totalBonus: 0,
      dueAmount: calculatedSalary,
      status: "PENDING",
      generatedBy: req.user._id,
    },
    { new: true, upsert: true }
  );

  res.json(new ApiResponse(200, salaryRecord, "Monthly salary generated successfully"));
});
// ================= ADD PAYMENT (installment) =================
// Access: SUPER_ADMIN, ADMIN, PRINCIPAL

exports.addPayment = asyncHandler(async (req, res) => {
  const { id } = req.params; // MonthlySalary id
  const { amount, note } = req.body;

  const salary = await MonthlySalary.findById(id);
  if (!salary) {
    return res.status(404).json(new ApiResponse(404, null, "Salary record not found"));
  }

  if (amount <= 0) {
    return res.status(400).json(new ApiResponse(400, null, "Payment amount must be greater than 0"));
  }

  const remainingDue = salary.calculatedSalary - salary.paidAmount;
  if (amount > remainingDue) {
    return res.status(400).json(
      new ApiResponse(400, null, `Payment exceeds due amount (₹${remainingDue} remaining)`)
    );
  }

  salary.payments.push({ amount, note, paidBy: req.user._id });
  salary.paidAmount += amount;
  salary.dueAmount = salary.calculatedSalary - salary.paidAmount;

  salary.status =
    salary.dueAmount === 0 ? "PAID" : salary.paidAmount > 0 ? "PARTIAL" : "PENDING";

  await salary.save();

  res.json(new ApiResponse(200, salary, "Payment recorded successfully"));
});

// ================= GET SALARY HISTORY (staff view) =================

exports.getTeacherSalaryHistory = asyncHandler(async (req, res) => {
  const { teacherId } = req.params;

  const records = await MonthlySalary.find({ teacher: teacherId }).sort({ year: -1, month: -1 });

  res.json(new ApiResponse(200, records, "Salary history fetched successfully"));
});

// ================= GET MY SALARY (Teacher self) =================

exports.getMySalary = asyncHandler(async (req, res) => {
  const records = await MonthlySalary.find({ teacher: req.user._id }).sort({ year: -1, month: -1 });

  res.json(new ApiResponse(200, records, "Salary fetched successfully"));
});