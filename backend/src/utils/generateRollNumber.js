const StudentProfile = require("../models/StudentProfile");
const Class = require("../models/Class");

// Format: <className><section>-<sequence>  e.g. "10A-016"
const generateRollNumber = async (classId) => {
  const classData = await Class.findById(classId);

  if (!classData) {
    throw new Error("Class not found");
  }

  // is class me abhi kitne students hai, count nikal ke +1 karenge
  const studentCount = await StudentProfile.countDocuments({ class: classId });

  const nextSequence = String(studentCount + 1).padStart(3, "0"); // 001, 002...

  const rollNumber = `${classData.className}${classData.section}-${nextSequence}`;

  return rollNumber;
};

module.exports = generateRollNumber;