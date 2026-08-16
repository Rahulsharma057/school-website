const mongoose = require("mongoose");

const chatGroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["CLASS", "TEACHERS", "SCHOOL", "CUSTOM"], required: true },

    class: { type: mongoose.Schema.Types.ObjectId, ref: "Class", default: null }, // sirf type=CLASS ke liye
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // sirf type=CUSTOM ke liye

    allowMediaUpload: { type: Boolean, default: false }, // sirf SUPER_ADMIN toggle karega
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

chatGroupSchema.index({ type: 1 });
chatGroupSchema.index({ class: 1 });

module.exports = mongoose.model("ChatGroup", chatGroupSchema);