const ChatGroup = require("../models/ChatGroup");
const ChatMessage = require("../models/ChatMessage");
const { canAccessGroup, STAFF_ROLES } = require("../utils/chatAccess");
const asyncHandler = require("../helpers/asyncHandler");
const ApiResponse = require("../helpers/ApiResponse");

// ================= GET MESSAGES (paginated, cursor-based for performance) =================
// Access: group member OR staff
// Query: ?before=<timestamp>&limit=30

exports.getMessages = asyncHandler(async (req, res) => {
  const group = await ChatGroup.findById(req.params.groupId).lean();
  if (!group) return res.status(404).json(new ApiResponse(404, null, "Group not found"));

  const hasAccess = await canAccessGroup(req.user, group);
  if (!hasAccess) return res.status(403).json(new ApiResponse(403, null, "You don't have access to this group"));

  const { before, limit = 30 } = req.query;
  const query = { group: group._id };
  if (before) query.createdAt = { $lt: new Date(before) };

  const messages = await ChatMessage.find(query)
    .populate("sender", "name role")
    .sort({ createdAt: -1 })
    .limit(Math.min(50, Number(limit)))
    .lean();

  // frontend ko chronological order mein chahiye (purana → naya)
  res.json(new ApiResponse(200, messages.reverse(), "Messages fetched successfully"));
});

// ================= SEND MESSAGE =================
// Access: group member OR staff

exports.sendMessage = asyncHandler(async (req, res) => {
  const { text, attachmentUrl, attachmentType } = req.body;

  if (!text?.trim() && !attachmentUrl) {
    return res.status(400).json(new ApiResponse(400, null, "Message cannot be empty"));
  }

  const group = await ChatGroup.findById(req.params.groupId);
  if (!group) return res.status(404).json(new ApiResponse(404, null, "Group not found"));

  const hasAccess = await canAccessGroup(req.user, group);
  if (!hasAccess) return res.status(403).json(new ApiResponse(403, null, "You don't have access to this group"));

  // media control — students/teachers sirf tab bhej sakte hain jab group allow kare
  if (attachmentUrl && !STAFF_ROLES.includes(req.user.role) && !group.allowMediaUpload) {
    return res.status(403).json(new ApiResponse(403, null, "Media sharing is not allowed in this group"));
  }

  const message = await ChatMessage.create({
    group: group._id,
    sender: req.user._id,
    text: text?.trim() || "",
    attachmentUrl: attachmentUrl || "",
    attachmentType: attachmentType || "",
  });

  // group ka updatedAt bump karo taaki "recent groups" sort sahi rahe (light operation)
  group.updatedAt = new Date();
  await group.save();

  const populated = await message.populate("sender", "name role");

  res.status(201).json(new ApiResponse(201, populated, "Message sent"));
});