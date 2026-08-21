const XLSX = require("xlsx");

const StudentProfile = require("../models/StudentProfile");

const asyncHandler = require("../helpers/asyncHandler");
const ApiResponse = require("../helpers/ApiResponse");

// ======================================================
// SAFE VALUE
// ======================================================

const value = (data) => {
  if (data === undefined || data === null) {
    return "";
  }

  return data;
};

// ======================================================
// FORMAT DATE
// ======================================================

const formatDate = (date) => {
  if (!date) return "";

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) {
    return "";
  }

  return d.toISOString().split("T")[0];
};

// ======================================================
// EXPORT ALL STUDENTS
// ======================================================

exports.exportStudents = asyncHandler(async (req, res) => {
  // ====================================================
  // GET STUDENTS
  // ====================================================

  const students = await StudentProfile.find({})
    .populate(
      "user",
      "name email role isActive createdAt updatedAt"
    )
    .populate(
      "class",
      "className section classTeacher"
    )
    .populate(
      "program",
      "name code"
    )
    .populate(
      "parent",
      "name email phone role isActive"
    )
    .sort({
      createdAt: -1,
    })
    .lean();

  // ====================================================
  // NO STUDENTS
  // ====================================================

  if (!students.length) {
    return res.status(404).json(
      new ApiResponse(
        404,
        null,
        "No students found"
      )
    );
  }

  // ====================================================
  // CONVERT TO EXCEL ROWS
  // ====================================================

  const rows = students.map((student) => {
    const address = student.address || {};
    const emergency = student.emergencyContact || {};

    const documents = Array.isArray(student.documents)
      ? student.documents
          .map((doc) => {
            return JSON.stringify({
              id: doc._id || "",
              type: doc.type || "",
              label: doc.label || "",
              url: doc.url || "",
              originalName: doc.originalName || "",
              uploadedBy: doc.uploadedBy || "",
              uploadedAt: doc.uploadedAt || "",
            });
          })
          .join(" | ")
      : "";

    return {
      // =================================================
      // USER DATA
      // =================================================

      "User ID": value(student.user?._id),

      "Student Name": value(student.user?.name),

      "Email": value(student.user?.email),

      "User Role": value(student.user?.role),

      "User Active": value(student.user?.isActive),

      "User Created At": formatDate(
        student.user?.createdAt
      ),

      "User Updated At": formatDate(
        student.user?.updatedAt
      ),

      // =================================================
      // STUDENT PROFILE
      // =================================================

      "Student Profile ID": value(student._id),

      "Institution Type": value(
        student.institutionType
      ),

      "Roll Number": value(
        student.rollNumber
      ),

      "Status": value(
        student.status
      ),

      // =================================================
      // CLASS
      // =================================================

      "Class ID": value(
        student.class?._id
      ),

      "Class Name": value(
        student.class?.className
      ),

      "Section": value(
        student.class?.section
      ),

      // =================================================
      // PROGRAM / COLLEGE
      // =================================================

      "Program ID": value(
        student.program?._id
      ),

      "Program Name": value(
        student.program?.name
      ),

      "Program Code": value(
        student.program?.code
      ),

      "Current Semester": value(
        student.currentSemester
      ),

      // =================================================
      // PARENT
      // =================================================

      "Parent ID": value(
        student.parent?._id
      ),

      "Parent Name": value(
        student.parent?.name
      ),

      "Parent Email": value(
        student.parent?.email
      ),

      "Parent Phone": value(
        student.parent?.phone
      ),

      // =================================================
      // PERSONAL
      // =================================================

      "Father Name": value(
        student.fatherName
      ),

      "Mother Name": value(
        student.motherName
      ),

      "Guardian Occupation": value(
        student.guardianOccupation
      ),

      "Date of Birth": formatDate(
        student.dateOfBirth
      ),

      "Blood Group": value(
        student.bloodGroup
      ),

      "Phone": value(
        student.phone
      ),

      "Profile Photo": value(
        student.profilePhoto
      ),

      "Bio": value(
        student.bio
      ),

      // =================================================
      // ADDRESS
      // =================================================

      "Address Street": value(
        address.street
      ),

      "Address City": value(
        address.city
      ),

      "Address State": value(
        address.state
      ),

      "Address Pincode": value(
        address.pincode
      ),

      // =================================================
      // EMERGENCY CONTACT
      // =================================================

      "Emergency Contact Name": value(
        emergency.name
      ),

      "Emergency Contact Phone": value(
        emergency.phone
      ),

      "Emergency Contact Relation": value(
        emergency.relation
      ),

      // =================================================
      // ADMISSION
      // =================================================

      "Admission Number": value(
        student.admissionNumber
      ),

      "Admission Date": formatDate(
        student.admissionDate
      ),

      "Previous School": value(
        student.previousSchool
      ),

      "House": value(
        student.house
      ),

      // =================================================
      // TRANSPORT
      // =================================================

      "Transport Mode": value(
        student.transportMode
      ),

      "Bus Route": value(
        student.busRoute
      ),

      // =================================================
      // MEDICAL
      // =================================================

      "Medical Conditions": value(
        student.medicalConditions
      ),

      // =================================================
      // AADHAAR
      // =================================================

      "Aadhar Number": value(
        student.aadharNumber
      ),

      "Aadhar Front URL": value(
        student.aadharFrontUrl
      ),

      "Aadhar Back URL": value(
        student.aadharBackUrl
      ),

      // =================================================
      // DOCUMENTS
      // =================================================

      "Documents": documents,

      // =================================================
      // OTHER PERSONAL INFORMATION
      // =================================================

      "Category": value(
        student.category
      ),

      "Religion": value(
        student.religion
      ),

      "Nationality": value(
        student.nationality
      ),

      // =================================================
      // LEFT / LIFECYCLE
      // =================================================

      "Left Reason": value(
        student.leftReason
      ),

      "Left Date": formatDate(
        student.leftDate
      ),

      // =================================================
      // SYSTEM
      // =================================================

      "Created At": formatDate(
        student.createdAt
      ),

      "Updated At": formatDate(
        student.updatedAt
      ),
    };
  });

  // ====================================================
  // CREATE WORKBOOK
  // ====================================================

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // ====================================================
  // AUTO COLUMN WIDTH
  // ====================================================

  const headers = Object.keys(rows[0]);

  worksheet["!cols"] = headers.map((header) => {
    let maxLength = header.length;

    for (const row of rows) {
      const cellValue = String(
        row[header] ?? ""
      );

      maxLength = Math.max(
        maxLength,
        cellValue.length
      );
    }

    return {
      wch: Math.min(
        Math.max(maxLength + 2, 12),
        40
      ),
    };
  });

  // ====================================================
  // CREATE WORKBOOK
  // ====================================================

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Students"
  );

  // ====================================================
  // WRITE BUFFER
  // ====================================================

  const buffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });

  // ====================================================
  // DOWNLOAD
  // ====================================================

  const fileName = `students_${new Date()
    .toISOString()
    .slice(0, 10)}.xlsx`;

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${fileName}"`
  );

  return res.send(buffer);
});