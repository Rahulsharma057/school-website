const mongoose = require("mongoose");

const finalSubjectSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true, trim: true },
    marksObtained: { type: Number, default: 0 },
    maxMarks: { type: Number, required: true },
    grade: { type: String, default: null },
    status: { type: String, enum: ["PASS", "FAIL", "ABSENT"], default: "PASS" },
  },
  { _id: false }
);

const finalResultSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    class: { type: mongoose.Schema.Types.ObjectId, ref: "Class", default: null },
    program: { type: mongoose.Schema.Types.ObjectId, ref: "Program", default: null },
    semester: { type: Number, default: null },

    academicYear: { type: String, required: true, trim: true },

    sourceExams: { type: [mongoose.Schema.Types.ObjectId], ref: "Exam", default: [] },
    subjects: { type: [finalSubjectSchema], default: [] },

    totalObtained: { type: Number, default: 0 },
    totalMax: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },

    gpa: { type: Number, default: null },
    cgpa: { type: Number, default: null },

    overallGrade: { type: String, default: null },
    status: { type: String, enum: ["PASS", "FAIL", "COMPARTMENT"], default: "PASS" },

    isPublished: { type: Boolean, default: false },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

finalResultSchema.pre("validate", function () {
  if (this.class && this.program) {
    throw new Error("Final result must belong to either a class or a program, not both");
  }
  if (!this.class && !this.program) {
    throw new Error("Final result must have either a class or a program");
  }
});

finalResultSchema.index(
  { student: 1, class: 1, academicYear: 1 },
  { unique: true, partialFilterExpression: { class: { $type: "objectId" } } }
);
finalResultSchema.index(
  { student: 1, program: 1, semester: 1, academicYear: 1 },
  { unique: true, partialFilterExpression: { program: { $type: "objectId" } } }
);

module.exports = mongoose.models.FinalResult || mongoose.model("FinalResult", finalResultSchema);