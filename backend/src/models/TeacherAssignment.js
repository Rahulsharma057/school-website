const mongoose = require("mongoose");

const teacherAssignmentSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // SCHOOL
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      default: null,
    },

    // NEW — COLLEGE
    program: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      default: null,
    },
    semester: { type: Number, default: null },

    subject: { type: String, trim: true, default: "" },
    isClassTeacher: { type: Boolean, default: false },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

// NEW — class ya program mein se ek hi hona chahiye
teacherAssignmentSchema.pre("validate", function () {
  if (this.class && this.program) {
    throw new Error(
      "Assignment must belong to either a class or a program, not both",
    );
  }
  if (!this.class && !this.program) {
    throw new Error("Assignment must have either a class or a program");
  }
});

teacherAssignmentSchema.index(
  { teacher: 1, class: 1, subject: 1 },
  { unique: false },
);
teacherAssignmentSchema.index(
  { teacher: 1, program: 1, semester: 1, subject: 1 },
  { unique: false },
);
teacherAssignmentSchema.index({ class: 1, status: 1 });
teacherAssignmentSchema.index({ program: 1, semester: 1, status: 1 });

module.exports =
  mongoose.models.TeacherAssignment ||
  mongoose.model("TeacherAssignment", teacherAssignmentSchema);
