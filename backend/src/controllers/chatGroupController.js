const ChatGroup = require("../models/ChatGroup");
const ChatMessage = require("../models/ChatMessage");
const User = require("../models/User");
const { canAccessGroup, getAccessibleGroupIds, STAFF_ROLES } = require("../utils/chatAccess");
const asyncHandler = require("../helpers/asyncHandler");
const ApiResponse = require("../helpers/ApiResponse");

// ================= CREATE GROUP =================
// Access: SUPER_ADMIN, ADMIN, PRINCIPAL

exports.createGroup = asyncHandler(async (req, res) => {
  const { name, type, classId, memberIds } = req.body;

  if (!["CLASS", "TEACHERS", "SCHOOL", "CUSTOM"].includes(type)) {
    return res.status(400).json(new ApiResponse(400, null, "Invalid group type"));
  }

  if (type === "CLASS" && !classId) {
    return res.status(400).json(new ApiResponse(400, null, "classId is required for a class group"));
  }

  if (type === "CUSTOM" && (!memberIds || memberIds.length === 0)) {
    return res.status(400).json(new ApiResponse(400, null, "Select at least one member for a custom group"));
  }

  // duplicate class-group na bane
  if (type === "CLASS") {
    const existing = await ChatGroup.findOne({ type: "CLASS", class: classId });
    if (existing) {
      return res.status(400).json(new ApiResponse(400, null, "A chat group for this class already exists"));
    }
  }

  const group = await ChatGroup.create({
    name,
    type,
    class: type === "CLASS" ? classId : null,
    members: type === "CUSTOM" ? memberIds : [],
    createdBy: req.user._id,
  });

  res.status(201).json(new ApiResponse(201, group, "Group created successfully"));
});

// ================= GET MY GROUPS (list for sidebar/chat home) =================
// Access: any logged-in user

exports.getMyGroups = asyncHandler(async (req, res) => {
  const STAFF = STAFF_ROLES;

  let query = {};
  if (!STAFF.includes(req.user.role)) {
    const groupIds = await getAccessibleGroupIds(req.user, ChatGroup);
    query = { _id: { $in: groupIds } };
  }
  // staff ke liye query khali hi rahega -> sab groups milenge

  const groups = await ChatGroup.find(query)
    .populate("class", "className section")
    .sort({ updatedAt: -1 })
    .lean();

  // har group ka last message bhi attach karo (preview ke liye) — ek hi query mein
  const groupIds = groups.map((g) => g._id);
  const lastMessages = await ChatMessage.aggregate([
    { $match: { group: { $in: groupIds } } },
    { $sort: { createdAt: -1 } },
    { $group: { _id: "$group", text: { $first: "$text" }, createdAt: { $first: "$createdAt" } } },
  ]);
  const lastMsgMap = new Map(lastMessages.map((m) => [String(m._id), m]));

  const result = groups.map((g) => ({ ...g, lastMessage: lastMsgMap.get(String(g._id)) || null }));

  res.json(new ApiResponse(200, result, "Groups fetched successfully"));
});

// ================= GET ALL GROUPS (Admin management view) =================
// Access: SUPER_ADMIN, ADMIN, PRINCIPAL

exports.getAllGroups = asyncHandler(async (req, res) => {
  const groups = await ChatGroup.find()
    .populate("class", "className section")
    .populate("createdBy", "name")
    .sort({ createdAt: -1 })
    .lean();

  res.json(new ApiResponse(200, groups, "Groups fetched successfully"));
});

// ================= TOGGLE MEDIA UPLOAD PERMISSION =================
// Access: SUPER_ADMIN only

exports.toggleMediaUpload = asyncHandler(async (req, res) => {
  const { allowMediaUpload } = req.body;

  const group = await ChatGroup.findById(req.params.id);
  if (!group) return res.status(404).json(new ApiResponse(404, null, "Group not found"));

  group.allowMediaUpload = !!allowMediaUpload;
  await group.save();

  res.json(new ApiResponse(200, group, "Media permission updated"));
});

// ================= DELETE GROUP =================
// Access: SUPER_ADMIN, ADMIN, PRINCIPAL

exports.deleteGroup = asyncHandler(async (req, res) => {
  const group = await ChatGroup.findById(req.params.id);
  if (!group) return res.status(404).json(new ApiResponse(404, null, "Group not found"));

  await Promise.all([
    group.deleteOne(),
    ChatMessage.deleteMany({ group: group._id }),
  ]);

  res.json(new ApiResponse(200, null, "Group deleted successfully"));
});

// ================= GET CUSTOM-GROUP MEMBER OPTIONS (helper for admin UI) =================
// Access: SUPER_ADMIN, ADMIN, PRINCIPAL

exports.getMemberOptions = asyncHandler(async (req, res) => {
  const users = await User.find({ isActive: true, role: { $in: ["TEACHER", "STUDENT", "PARENT"] } })
    .select("name email role")
    .lean();

  res.json(new ApiResponse(200, users, "Users fetched successfully"));
});