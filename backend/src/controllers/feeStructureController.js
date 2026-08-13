const { randomUUID } = require("crypto");
const FeeStructure = require("../models/FeeStructure");
const asyncHandler = require("../helpers/asyncHandler");
const ApiResponse = require("../helpers/ApiResponse");
const ApiError = require("../helpers/ApiError");

const VALID_PAYMENT_TYPES = ["ONE_TIME", "INSTALLMENT"];

const validateComponents = (components) => {
  if (!Array.isArray(components) || !components.length) {
    throw new ApiError(400, "At least one fee component is required");
  }

  for (const c of components) {
    if (!c.name?.trim()) throw new ApiError(400, "Every fee component needs a name");
    if (!VALID_PAYMENT_TYPES.includes(c.paymentType)) {
      throw new ApiError(400, `paymentType must be one of: ${VALID_PAYMENT_TYPES.join(", ")}`);
    }
    if (typeof c.amount !== "number" || c.amount < 0) {
      throw new ApiError(400, `${c.name}: amount must be a non-negative number`);
    }
    if (c.paymentType === "INSTALLMENT" && (!c.installmentCount || c.installmentCount < 1)) {
      throw new ApiError(400, `${c.name}: installmentCount must be at least 1`);
    }
  }
};

// ================= CREATE =================
exports.createFeeStructure = asyncHandler(async (req, res) => {
  const { class: classId, academicYear, components } = req.body;

  if (!classId) throw new ApiError(400, "class is required");
  if (!academicYear?.trim()) throw new ApiError(400, "academicYear is required");
  validateComponents(components);

  const existing = await FeeStructure.findOne({ class: classId, academicYear });
  if (existing) {
    throw new ApiError(400, "A fee structure already exists for this class and academic year");
  }

  const structure = await FeeStructure.create({
    class: classId,
    academicYear,
    components: components.map((c) => ({ ...c, id: c.id || randomUUID() })),
    createdBy: req.user._id,
  });

  return res.status(201).json(new ApiResponse(201, structure, "Fee structure created successfully"));
});

// ================= LIST =================
exports.getFeeStructures = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.class) filter.class = req.query.class;
  if (req.query.academicYear) filter.academicYear = req.query.academicYear;

  const structures = await FeeStructure.find(filter)
    .populate("class", "className section")
    .sort({ academicYear: -1, createdAt: -1 });

  return res.json(new ApiResponse(200, structures, "Fee structures fetched successfully"));
});

// ================= GET ONE =================
exports.getFeeStructureById = asyncHandler(async (req, res) => {
  const structure = await FeeStructure.findById(req.params.id).populate("class", "className section");
  if (!structure) throw new ApiError(404, "Fee structure not found");
  return res.json(new ApiResponse(200, structure, "Fee structure fetched successfully"));
});

// ================= UPDATE =================
// Edits the template only — does NOT touch StudentFee records already
// assigned from it (those are independent copies, on purpose).
exports.updateFeeStructure = asyncHandler(async (req, res) => {
  const structure = await FeeStructure.findById(req.params.id);

  if (!structure) {
    throw new ApiError(404, "Fee structure not found");
  }

  // UPDATE CLASS
  if (req.body.class !== undefined) {
    if (!req.body.class) {
      throw new ApiError(400, "class is required");
    }

    const Class = require("../models/Class");

    const classExists = await Class.findById(req.body.class);

    if (!classExists) {
      throw new ApiError(404, "Selected class not found");
    }

    structure.class = req.body.class;
  }

  // UPDATE COMPONENTS
  if (req.body.components) {
    validateComponents(req.body.components);

    structure.components = req.body.components.map((c) => ({
      ...c,
      id: c.id || randomUUID(),
    }));
  }

  // UPDATE ACADEMIC YEAR
  if (req.body.academicYear !== undefined) {
    structure.academicYear = req.body.academicYear;
  }

  // UPDATE STATUS
  if (req.body.status !== undefined) {
    structure.status = req.body.status;
  }

  await structure.save();

  return res.json(
    new ApiResponse(
      200,
      structure,
      "Fee structure updated successfully"
    )
  );
});

// ================= DELETE =================
exports.deleteFeeStructure = asyncHandler(async (req, res) => {
  const StudentFee = require("../models/StudentFee");

  const inUse = await StudentFee.countDocuments({ feeStructure: req.params.id });
  if (inUse > 0) {
    throw new ApiError(400, "Cannot delete — this structure is already assigned to students");
  }

  const structure = await FeeStructure.findById(req.params.id);
  if (!structure) throw new ApiError(404, "Fee structure not found");

  await structure.deleteOne();

  return res.json(new ApiResponse(200, null, "Fee structure deleted successfully"));
});