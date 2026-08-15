const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      default: "MEDIUM",
    },

    dueDate: { type: Date, default: null },

    status: {
      type: String,
      enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "PROBLEM"],
      default: "PENDING",
    },

    // teacher jab problem report kare, wajah yahan bhi snapshot rahegi (quick view ke liye list mein)
    lastStatusNote: { type: String, default: "" },

    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Fast lookups — Teacher ka apna list, Admin ka status-filter, sabme index chahiye
taskSchema.index({ assignedTo: 1, status: 1, createdAt: -1 });
taskSchema.index({ assignedBy: 1, createdAt: -1 });
taskSchema.index({ status: 1 });

module.exports = mongoose.model("Task", taskSchema);