const mongoose = require("mongoose");

const teacherAssignmentSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    subject: {
      type: String,
      trim: true,
      default: "", // khali ho sakta hai agar sirf class-teacher hai, subject specific nahi
    },
    isClassTeacher: {
      type: Boolean,
      default: false, // true = ye teacher is class ka in-charge hai
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// same teacher, same class, same subject dobara active na ho (duplicate rokne ke liye)
teacherAssignmentSchema.index(
  { teacher: 1, class: 1, subject: 1 },
  { unique: false } // unique nahi rakha kyunki INACTIVE records reuse ho sakte hai history ke liye
);

module.exports = mongoose.model("TeacherAssignment", teacherAssignmentSchema);