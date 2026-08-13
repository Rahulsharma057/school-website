const mongoose = require("mongoose");

const teacherAttendanceSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: { type: Date, required: true },
status: {
  type: String,
  enum: ["PRESENT", "ABSENT", "LEAVE", "HALF_DAY"], // HALF_DAY naya
  required: true,
},
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    
  },
  { timestamps: true }
);

// ek teacher ki ek din ki sirf ek hi entry
teacherAttendanceSchema.index({ teacher: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("TeacherAttendance", teacherAttendanceSchema);