const XLSX = require("xlsx");
const mongoose = require("mongoose");

const User = require("../models/User");
const StudentProfile = require("../models/StudentProfile");
const Class = require("../models/Class");

const generateRollNumber = require("../utils/generateRollNumber");
const { hashPassword } = require("../services/authService");
const asyncHandler = require("../helpers/asyncHandler");
const ApiResponse = require("../helpers/ApiResponse");

// ======================================================
// HELPERS
// ======================================================

const clean = (value) => {
  if (value === undefined || value === null) return "";
  return String(value).trim();
};

const normalizeEmail = (email) => {
  return clean(email).toLowerCase();
};

const normalizeClassName = (value) => {
  return clean(value)
    .replace(/\s+/g, " ")
    .toLowerCase();
};

const normalizeSection = (value) => {
  return clean(value).toUpperCase() || "A";
};

const parseExcelDate = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "number") {
    const date = XLSX.SSF.parse_date_code(value);

    if (date) {
      return new Date(
        date.y,
        date.m - 1,
        date.d,
        date.H || 0,
        date.M || 0,
        date.S || 0
      );
    }
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

// ======================================================
// IMPORT STUDENTS FROM EXCEL
// ======================================================

exports.importStudents = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json(
      new ApiResponse(
        400,
        null,
        "Please upload an Excel file"
      )
    );
  }

  const allowedExtensions = [".xlsx", ".xls"];

  const fileName = req.file.originalname.toLowerCase();

  if (!allowedExtensions.some((ext) => fileName.endsWith(ext))) {
    return res.status(400).json(
      new ApiResponse(
        400,
        null,
        "Only .xlsx and .xls files are allowed"
      )
    );
  }

  // ====================================================
  // READ EXCEL
  // ====================================================

  const workbook = XLSX.read(req.file.buffer, {
    type: "buffer",
    cellDates: true,
  });

  if (!workbook.SheetNames.length) {
    return res.status(400).json(
      new ApiResponse(400, null, "Excel file contains no sheets")
    );
  }

  const allRows = [];

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json(worksheet, {
      defval: "",
      raw: true,
    });

    rows.forEach((row, index) => {
      allRows.push({
        ...row,
        __sheetName: sheetName,
        __excelRow: index + 2,
      });
    });
  }

  if (!allRows.length) {
    return res.status(400).json(
      new ApiResponse(400, null, "Excel file contains no student data")
    );
  }

  // ====================================================
  // RESULT
  // ====================================================

  const success = [];
  const failed = [];

  // ====================================================
  // PROCESS EACH STUDENT
  // ====================================================

  for (const row of allRows) {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      // ------------------------------------------------
      // EXCEL FIELDS
      // ------------------------------------------------

      const name = clean(
        row["Student Name"] ||
        row["student name"] ||
        row["Name"]
      );

      const fatherName = clean(
        row["Father Name"] ||
        row["father name"]
      );

      const className = clean(
        row["Class Name"] ||
        row["class name"] ||
        row["Class"]
      );

      const section = normalizeSection(
        row["Section"] ||
        row["section"]
      );

      const email = normalizeEmail(
        row["Email"] ||
        row["email"]
      );

      const password = clean(
        row["Password"] ||
        row["password"]
      );

      // ------------------------------------------------
      // VALIDATION
      // ------------------------------------------------

      if (!name) {
        throw new Error("Student Name is required");
      }

      if (!className) {
        throw new Error("Class Name is required");
      }

      if (!email) {
        throw new Error("Email is required");
      }

      if (!password) {
        throw new Error("Password is required");
      }

      // ------------------------------------------------
      // FIND CLASS
      // ------------------------------------------------

      const classDoc = await Class.findOne({
        className: {
          $regex: `^${className.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          )}$`,
          $options: "i",
        },
        section: section,
      }).session(session);

      if (!classDoc) {
        throw new Error(
          `Class "${className}" with section "${section}" not found`
        );
      }

      // ------------------------------------------------
      // CHECK EMAIL
      // ------------------------------------------------

      const existingUser = await User.findOne({
        email,
      }).session(session);

      if (existingUser) {
        throw new Error(
          `Email already registered: ${email}`
        );
      }

      // ------------------------------------------------
      // HASH PASSWORD
      // ------------------------------------------------

      const hashedPassword = await hashPassword(password);

      // ------------------------------------------------
      // CREATE USER
      // ------------------------------------------------

      const createdUsers = await User.create(
        [
          {
            name,
            email,
            password: hashedPassword,
            role: "STUDENT",
            createdBy: req.user?._id,
          },
        ],
        {
          session,
        }
      );

      const createdUser = createdUsers[0];

      // ------------------------------------------------
      // GENERATE ROLL NUMBER
      // ------------------------------------------------

      const rollNumber = await generateRollNumber(
        classDoc._id
      );

      // ------------------------------------------------
      // CREATE STUDENT PROFILE
      // ------------------------------------------------

      const createdProfiles = await StudentProfile.create(
        [
          {
            user: createdUser._id,

            institutionType: "SCHOOL",

            class: classDoc._id,

            rollNumber,

            fatherName,

            status: "ACTIVE",
          },
        ],
        {
          session,
        }
      );

      const profile = createdProfiles[0];

      // ------------------------------------------------
      // COMMIT
      // ------------------------------------------------

      await session.commitTransaction();

      success.push({
        row: row.__excelRow,
        sheet: row.__sheetName,
        studentId: profile._id,
        userId: createdUser._id,
        name,
        email,
        className: classDoc.className,
        section: classDoc.section,
        rollNumber,
      });
    } catch (error) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }

      failed.push({
        row: row.__excelRow,
        sheet: row.__sheetName,
        name:
          row["Student Name"] ||
          row["student name"] ||
          row["Name"] ||
          "",
        email:
          row["Email"] ||
          row["email"] ||
          "",
        className:
          row["Class Name"] ||
          row["class name"] ||
          row["Class"] ||
          "",
        error: error.message,
      });
    } finally {
      await session.endSession();
    }
  }

  // ====================================================
  // RESPONSE
  // ====================================================

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalRows: allRows.length,
        successCount: success.length,
        failedCount: failed.length,
        success,
        failed,
      },
      `Import completed. ${success.length} students created and ${failed.length} failed.`
    )
  );
});