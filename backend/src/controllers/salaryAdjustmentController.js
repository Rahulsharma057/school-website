const SalaryAdjustment = require("../models/SalaryAdjustment");
const MonthlySalary = require("../models/MonthlySalary");
const asyncHandler = require("../helpers/asyncHandler");
const ApiResponse = require("../helpers/ApiResponse");

// ================= ADD ADJUSTMENT (Deduction/Bonus) =================
// Access: SUPER_ADMIN, ADMIN, PRINCIPAL

exports.addAdjustment = asyncHandler(async (req, res) => {
  const { monthlySalaryId, type, amount, reason } = req.body;

  const salary = await MonthlySalary.findById(monthlySalaryId);
  if (!salary) {
    return res.status(404).json(new ApiResponse(404, null, "Salary record not found"));
  }

  const adjustment = await SalaryAdjustment.create({
    monthlySalary: monthlySalaryId,
    type,
    amount,
    reason,
    addedBy: req.user._id,
  });

  // netSalary recalculate karo
  if (type === "DEDUCTION") {
    salary.totalDeductions += amount;
  } else {
    salary.totalBonus += amount;
  }
  salary.netSalary = salary.calculatedSalary - salary.totalDeductions + salary.totalBonus;
  salary.dueAmount = salary.netSalary - salary.paidAmount;
  await salary.save();

  res.status(201).json(new ApiResponse(201, { adjustment, salary }, "Adjustment added successfully"));
});

// ================= GET ADJUSTMENTS FOR A SALARY RECORD =================

exports.getAdjustments = asyncHandler(async (req, res) => {
  const adjustments = await SalaryAdjustment.find({ monthlySalary: req.params.salaryId }).sort({ createdAt: -1 });
  res.json(new ApiResponse(200, adjustments, "Adjustments fetched successfully"));
});