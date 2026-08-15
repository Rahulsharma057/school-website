const mongoose = require("mongoose");

const taskMessageSchema = new mongoose.Schema(
  {
    task: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

// task ki messages fetch karte waqt yehi sabse common query hogi
taskMessageSchema.index({ task: 1, createdAt: 1 });

module.exports = mongoose.model("TaskMessage", taskMessageSchema);