const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: "ChatGroup", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, default: "", trim: true },
    attachmentUrl: { type: String, default: "" },
    attachmentType: { type: String, default: "" }, // "image", "file", etc.
  },
  { timestamps: true }
);

// sabse common query: ek group ke messages, date ke hisaab se — isko fast rakhna zaroori hai
chatMessageSchema.index({ group: 1, createdAt: -1 });

module.exports = mongoose.model("ChatMessage", chatMessageSchema);