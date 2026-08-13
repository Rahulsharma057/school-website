const mongoose = require("mongoose");
const { randomUUID } = require("crypto");

const StudentFee = require("../models/StudentFee");
const FeeStructure = require("../models/FeeStructure");
const StudentProfile = require("../models/StudentProfile");
const FeePayment = require("../models/FeePayment");

const {
  buildComponentFromStructure,
  splitIntoInstallments,
} = require("../utils/feeHelpers");
const asyncHandler = require("../helpers/asyncHandler");
const ApiResponse = require("../helpers/ApiResponse");
const ApiError = require("../helpers/ApiError");

// Shared populate spec for "student" — used everywhere we need name + roll
// number + parent contact (for SMS reminders). Kept in one place so all
// endpoints stay consistent.
const STUDENT_POPULATE = {
  path: "student",
  select: "rollNumber user parent",
  populate: [
    { path: "user", select: "name email" },
    { path: "parent", select: "name phone" },
  ],
};

// Builds the components array for one student from a structure + optional
// per-student overrides. Shared by single-assign and bulk-assign.
const buildComponentsForStudent = (structure, overridesByComponentId = {}) =>
  structure.components.map((sc) =>
    buildComponentFromStructure(sc, overridesByComponentId[sc.id] || {}),
  );

// ================= ASSIGN FEE TO ONE STUDENT =================
// body: { studentId, feeStructureId, overrides?: { [componentId]: { totalAmount, installmentCount, waived, ... } } }
exports.assignFeeToStudent = asyncHandler(async (req, res) => {
  const { studentId, feeStructureId, overrides = {} } = req.body;

  const [student, structure] = await Promise.all([
    StudentProfile.findById(studentId),
    FeeStructure.findById(feeStructureId),
  ]);

  if (!student) throw new ApiError(404, "Student not found");
  if (!structure) throw new ApiError(404, "Fee structure not found");

  const already = await StudentFee.findOne({
    student: studentId,
    academicYear: structure.academicYear,
  });
  if (already)
    throw new ApiError(
      400,
      "Fee is already assigned to this student for this academic year",
    );

  const components = buildComponentsForStudent(structure, overrides);

  const studentFee = new StudentFee({
    student: studentId,
    class: student.class,
    feeStructure: structure._id,
    academicYear: structure.academicYear,
    components,
  });

  studentFee.recomputeTotals();
  await studentFee.save();

  return res
    .status(201)
    .json(
      new ApiResponse(201, studentFee, "Fee assigned to student successfully"),
    );
});

// ================= BULK-ASSIGN TO A WHOLE CLASS =================
// body: { feeStructureId } — assigns the structure to every ACTIVE student
// in structure.class who doesn't already have a StudentFee for that year.
// Skips (doesn't error on) students who already have one.
exports.bulkAssignFeeToClass = asyncHandler(async (req, res) => {
  const { feeStructureId } = req.body;

  const structure = await FeeStructure.findById(feeStructureId);
  if (!structure) throw new ApiError(404, "Fee structure not found");

  const students = await StudentProfile.find({
    class: structure.class,
    status: "ACTIVE",
  });
  if (!students.length)
    throw new ApiError(400, "No active students found in this class");

  const existingIds = new Set(
    (
      await StudentFee.find({
        student: { $in: students.map((s) => s._id) },
        academicYear: structure.academicYear,
      }).select("student")
    ).map((sf) => String(sf.student)),
  );

  const toCreate = students.filter((s) => !existingIds.has(String(s._id)));

  const docs = toCreate.map((student) => {
    const components = buildComponentsForStudent(structure);
    const sf = new StudentFee({
      student: student._id,
      class: student.class,
      feeStructure: structure._id,
      academicYear: structure.academicYear,
      components,
    });
    sf.recomputeTotals();
    return sf;
  });

  if (docs.length) await StudentFee.insertMany(docs);

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { assigned: docs.length, skipped: existingIds.size },
        `Fee assigned to ${docs.length} student(s)${existingIds.size ? `, ${existingIds.size} already had it` : ""}`,
      ),
    );
});

// ================= GET ONE STUDENT'S FEE (admin/teacher view) =================
exports.getStudentFeeById = asyncHandler(async (req, res) => {
  const studentFee = await StudentFee.findById(req.params.id)
    .populate(STUDENT_POPULATE)
    .populate("class", "className section");

  if (!studentFee) throw new ApiError(404, "Student fee record not found");

  return res.json(
    new ApiResponse(200, studentFee, "Student fee fetched successfully"),
  );
});

// ================= SELF — STUDENT'S OWN FEE =================
exports.getMyFee = asyncHandler(async (req, res) => {
  const profile = await StudentProfile.findOne({ user: req.user._id });
  if (!profile) throw new ApiError(404, "Student profile not found");

  const studentFee = await StudentFee.findOne({ student: profile._id }).sort({
    createdAt: -1,
  });
  if (!studentFee) throw new ApiError(404, "No fee record found for you yet");

  return res.json(
    new ApiResponse(200, studentFee, "Your fee details fetched successfully"),
  );
});

// ================= CUSTOMIZE A STUDENT'S FEE COMPONENT =================
// body: { componentId, totalAmount?, waived?, installmentCount?, installmentStartDate? }
// Recomputes only the UNPAID portion of that component's installments —
// anything already paid is left untouched.
exports.updateStudentFeeComponent = asyncHandler(async (req, res) => {
  const {
    componentId,
    totalAmount,
    waived,
    installmentCount,
    installmentStartDate,
  } = req.body;

  const studentFee = await StudentFee.findById(req.params.id);
  if (!studentFee) throw new ApiError(404, "Student fee record not found");

  const component = studentFee.components.find(
    (c) => c.componentId === componentId,
  );
  if (!component)
    throw new ApiError(404, "Fee component not found on this student's record");

  if (waived !== undefined) component.waived = waived;

  if (totalAmount !== undefined || installmentCount !== undefined) {
    const alreadyPaid = component.installments.reduce(
      (sum, i) => sum + i.paidAmount,
      0,
    );
    const newTotal =
      totalAmount !== undefined ? totalAmount : component.totalAmount;

    if (newTotal < alreadyPaid) {
      throw new ApiError(
        400,
        `New amount (${newTotal}) can't be less than what's already paid (${alreadyPaid})`,
      );
    }

    const remaining = newTotal - alreadyPaid;

    if (component.paymentType === "ONE_TIME") {
      component.installments = [
        {
          installmentNo: 1,
          dueDate: component.installments[0]?.dueDate || null,
          amount: newTotal,
          paidAmount: alreadyPaid,
          status: "PENDING",
        },
      ];
    } else {
      const count = installmentCount || component.installments.length || 1;
      const freshInstallments = splitIntoInstallments(
        remaining,
        count,
        installmentStartDate || new Date(),
      );
      // Keep any already-fully-paid installments as history; rebuild the rest.
      const paidHistory = component.installments.filter(
        (i) => i.paidAmount >= i.amount && i.amount > 0,
      );
      component.installments = [
        ...paidHistory,
        ...freshInstallments.map((inst, idx) => ({
          ...inst,
          installmentNo: paidHistory.length + idx + 1,
        })),
      ];
    }

    component.totalAmount = newTotal;
  }

  studentFee.recomputeTotals();
  await studentFee.save();

  return res.json(
    new ApiResponse(200, studentFee, "Fee component updated successfully"),
  );
});

// ================= ADD A CUSTOM (ONE-OFF) COMPONENT FOR A STUDENT =================
// body: { name, category, paymentType, amount, installmentCount?, installmentStartDate? }
exports.addCustomFeeComponent = asyncHandler(async (req, res) => {
  const {
    name,
    category,
    paymentType,
    amount,
    installmentCount,
    installmentStartDate,
  } = req.body;

  if (!name?.trim()) throw new ApiError(400, "name is required");
  if (!["ONE_TIME", "INSTALLMENT"].includes(paymentType)) {
    throw new ApiError(400, "paymentType must be ONE_TIME or INSTALLMENT");
  }
  if (typeof amount !== "number" || amount < 0)
    throw new ApiError(400, "amount must be a non-negative number");

  const studentFee = await StudentFee.findById(req.params.id);
  if (!studentFee) throw new ApiError(404, "Student fee record not found");

  const installments =
    paymentType === "ONE_TIME"
      ? [
          {
            installmentNo: 1,
            dueDate: null,
            amount,
            paidAmount: 0,
            status: "PENDING",
          },
        ]
      : splitIntoInstallments(
          amount,
          installmentCount || 1,
          installmentStartDate || new Date(),
        );

  studentFee.components.push({
    componentId: randomUUID(),
    name,
    category: category || "OTHER",
    paymentType,
    totalAmount: amount,
    waived: false,
    isCustom: true,
    installments,
  });

  studentFee.recomputeTotals();
  await studentFee.save();

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        studentFee,
        "Custom fee component added successfully",
      ),
    );
});

// ================= REMOVE A CUSTOM COMPONENT (only unpaid, only custom ones) =================
exports.removeCustomFeeComponent = asyncHandler(async (req, res) => {
  const { componentId } = req.params;

  const studentFee = await StudentFee.findById(req.params.id);
  if (!studentFee) throw new ApiError(404, "Student fee record not found");

  const component = studentFee.components.find(
    (c) => c.componentId === componentId,
  );
  if (!component) throw new ApiError(404, "Fee component not found");
  if (!component.isCustom)
    throw new ApiError(
      400,
      "Only custom (non-structure) components can be removed",
    );

  const paid = component.installments.reduce((sum, i) => sum + i.paidAmount, 0);
  if (paid > 0)
    throw new ApiError(
      400,
      "Cannot remove — payments already made against this component",
    );

  studentFee.components = studentFee.components.filter(
    (c) => c.componentId !== componentId,
  );
  studentFee.recomputeTotals();
  await studentFee.save();

  return res.json(
    new ApiResponse(
      200,
      studentFee,
      "Custom fee component removed successfully",
    ),
  );
});

// ================= CLASS FEE SUMMARY (admin dashboard list) =================
exports.getClassFeeSummary = asyncHandler(async (req, res) => {
  const { classId, academicYear } = req.query;
  if (!classId || !academicYear)
    throw new ApiError(400, "classId and academicYear are required");

  const records = await StudentFee.find({ class: classId, academicYear })
    .populate({
      path: "student",
      select: "rollNumber user",
      populate: { path: "user", select: "name email" },
    })
    .select("student totalAmount totalPaid totalDue status")
    .sort({ totalDue: -1 });

  return res.json(
    new ApiResponse(200, records, "Class fee summary fetched successfully"),
  );
});

// ================= DUE LIST (across classes, optionally filtered) =================
exports.getDueList = asyncHandler(async (req, res) => {
  const { classId, academicYear, onlyOverdue } = req.query;

  const filter = { totalDue: { $gt: 0 } };
  if (classId) filter.class = classId;
  if (academicYear) filter.academicYear = academicYear;

  let records = await StudentFee.find(filter)
    .populate(STUDENT_POPULATE)
    .populate("class", "className section")
    .sort({ totalDue: -1 });

  if (onlyOverdue === "true") {
    const now = new Date();
    records = records.filter((r) =>
      r.components.some(
        (c) =>
          !c.waived &&
          c.installments.some(
            (i) => i.status !== "PAID" && i.dueDate && i.dueDate < now,
          ),
      ),
    );
  }

  return res.json(
    new ApiResponse(200, records, "Due list fetched successfully"),
  );
});

// ================= GET FEE BY STUDENT ID (for the collect-payment picker) =================
exports.getStudentFeeByStudentId = asyncHandler(async (req, res) => {
  const studentFee = await StudentFee.findOne({ student: req.params.studentId })
    .sort({ createdAt: -1 })
    .populate(STUDENT_POPULATE)
    .populate("class", "className section");

  if (!studentFee)
    throw new ApiError(404, "No fee record found for this student");

  return res.json(
    new ApiResponse(200, studentFee, "Student fee fetched successfully"),
  );
});

// ================= FEE DASHBOARD (overall + class-wise + month-wise) =================
// query: academicYear?, classId?, from?, to?
// - "overall" + "classWise" come from StudentFee (current snapshot of
//   totals) filtered by academicYear/classId.
// - "monthWise" comes from FeePayment (actual transactions) filtered by
//   date range, and — if academicYear/classId given — joined against
//   StudentFee to scope it to the same year/class.
// classWise deliberately returns only classId (no populated name) — the
// frontend already has the classes list loaded for its filters and merges
// the label itself, avoiding a guess about the Class model's exact name.
exports.getFeeDashboard = asyncHandler(async (req, res) => {
  const { academicYear, classId, from, to } = req.query;

  const sfMatch = {};
  if (academicYear) sfMatch.academicYear = academicYear;
  if (classId) sfMatch.class = new mongoose.Types.ObjectId(classId);

  const [overallAgg, classWiseAgg] = await Promise.all([
    StudentFee.aggregate([
      { $match: sfMatch },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$totalAmount" },
          totalPaid: { $sum: "$totalPaid" },
          totalDue: { $sum: "$totalDue" },
          totalStudents: { $sum: 1 },
        },
      },
    ]),
    StudentFee.aggregate([
      { $match: sfMatch },
      {
        $group: {
          _id: "$class",
          totalAmount: { $sum: "$totalAmount" },
          totalPaid: { $sum: "$totalPaid" },
          totalDue: { $sum: "$totalDue" },
          studentCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          classId: "$_id",
          totalAmount: 1,
          totalPaid: 1,
          totalDue: 1,
          studentCount: 1,
        },
      },
      { $sort: { totalAmount: -1 } },
    ]),
  ]);

  const overall = overallAgg[0]
    ? {
        totalAmount: overallAgg[0].totalAmount,
        totalPaid: overallAgg[0].totalPaid,
        totalDue: overallAgg[0].totalDue,
        totalStudents: overallAgg[0].totalStudents,
      }
    : { totalAmount: 0, totalPaid: 0, totalDue: 0, totalStudents: 0 };
  overall.collectionPercent =
    overall.totalAmount > 0
      ? Math.round((overall.totalPaid / overall.totalAmount) * 100)
      : 0;

  // ---- Month-wise, from actual payment transactions ----
  const paymentMatch = {};
  if (from || to) {
    paymentMatch.paymentDate = {};
    if (from) paymentMatch.paymentDate.$gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      paymentMatch.paymentDate.$lte = toDate;
    }
  }

  const monthPipeline = [{ $match: paymentMatch }];

  if (academicYear || classId) {
    // "studentfees" is Mongoose's default pluralized collection name for
    // the StudentFee model — only join when actually needed for filtering.
    monthPipeline.push(
      {
        $lookup: {
          from: "studentfees",
          localField: "studentFee",
          foreignField: "_id",
          as: "sf",
        },
      },
      { $unwind: "$sf" },
    );
    const sfFilter = {};
    if (academicYear) sfFilter["sf.academicYear"] = academicYear;
    if (classId) sfFilter["sf.class"] = new mongoose.Types.ObjectId(classId);
    monthPipeline.push({ $match: sfFilter });
  }

  monthPipeline.push(
    {
      $group: {
        _id: {
          year: { $year: "$paymentDate" },
          month: { $month: "$paymentDate" },
        },
        totalCollected: { $sum: "$amountPaid" },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  );

  const monthWiseAgg = await FeePayment.aggregate(monthPipeline);

  const MONTH_NAMES = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const monthWise = monthWiseAgg.map((m) => ({
    month: `${m._id.year}-${String(m._id.month).padStart(2, "0")}`,
    label: `${MONTH_NAMES[m._id.month - 1]} '${String(m._id.year).slice(2)}`,
    totalCollected: m.totalCollected,
  }));

  return res.json(
    new ApiResponse(
      200,
      { overall, classWise: classWiseAgg, monthWise },
      "Dashboard stats fetched successfully",
    ),
  );
});
