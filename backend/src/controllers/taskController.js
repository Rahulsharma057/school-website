const Task = require("../models/Task");
const TaskMessage = require("../models/TaskMessage");
const User = require("../models/User");
const asyncHandler = require("../helpers/asyncHandler");
const ApiResponse = require("../helpers/ApiResponse");

// ================= CREATE TASK =================
// Access: SUPER_ADMIN, ADMIN, PRINCIPAL

exports.createTask = asyncHandler(async (req, res) => {
  const { title, description, assignedTo, priority, dueDate, message } = req.body;

  const teacher = await User.findById(assignedTo).select("role isActive").lean();
  if (!teacher || teacher.role !== "TEACHER") {
    return res.status(400).json(new ApiResponse(400, null, "Invalid teacher selected"));
  }
  if (!teacher.isActive) {
    return res.status(400).json(new ApiResponse(400, null, "This teacher is inactive"));
  }

  const task = await Task.create({
    title,
    description,
    assignedTo,
    assignedBy: req.user._id,
    priority: priority || "MEDIUM",
    dueDate: dueDate || null,
  });

  // agar assign karte waqt koi message/instruction bhi diya ho, thread mein pehla message ban jaye
  if (message && message.trim()) {
    await TaskMessage.create({ task: task._id, sender: req.user._id, message: message.trim() });
  }

  const populated = await Task.findById(task._id)
    .populate("assignedTo", "name email")
    .populate("assignedBy", "name email")
    .lean();

  res.status(201).json(new ApiResponse(201, populated, "Task assigned successfully"));
});

// ================= GET ALL TASKS (Admin view, paginated + filters) =================
// Access: SUPER_ADMIN, ADMIN, PRINCIPAL
// Query: ?status=&teacherId=&page=&limit=

exports.getAllTasks = asyncHandler(async (req, res) => {
  const { status, teacherId, page = 1, limit = 20 } = req.query;

  const query = {};
  if (status) query.status = status;
  if (teacherId) query.assignedTo = teacherId;

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(50, Number(limit)); // cap at 50, performance ke liye

  const [tasks, total] = await Promise.all([
    Task.find(query)
      .populate("assignedTo", "name email")
      .populate("assignedBy", "name email")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
    Task.countDocuments(query),
  ]);

  res.json(
    new ApiResponse(200, { tasks, total, page: pageNum, totalPages: Math.ceil(total / limitNum) }, "Tasks fetched successfully")
  );
});

// ================= GET MY TASKS (Teacher view, paginated) =================
// Access: TEACHER
// Query: ?status=&page=&limit=

exports.getMyTasks = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const query = { assignedTo: req.user._id };
  if (status) query.status = status;

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(50, Number(limit));

  const [tasks, total] = await Promise.all([
    Task.find(query)
      .populate("assignedBy", "name email")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
    Task.countDocuments(query),
  ]);

  res.json(
    new ApiResponse(200, { tasks, total, page: pageNum, totalPages: Math.ceil(total / limitNum) }, "Tasks fetched successfully")
  );
});

// ================= GET SINGLE TASK (with messages) =================
// Access: assignedTo teacher OR assignedBy admin/staff

exports.getTaskById = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate("assignedTo", "name email")
    .populate("assignedBy", "name email")
    .lean();

  if (!task) {
    return res.status(404).json(new ApiResponse(404, null, "Task not found"));
  }

  // authorization — sirf jisko assign hua ya jisne assign kiya, wahi dekh sake
  const isOwner = String(task.assignedTo._id) === String(req.user._id);
  const isAssigner = String(task.assignedBy._id) === String(req.user._id);
  const isStaff = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL"].includes(req.user.role);

  if (!isOwner && !isAssigner && !isStaff) {
    return res.status(403).json(new ApiResponse(403, null, "You don't have access to this task"));
  }

  const messages = await TaskMessage.find({ task: task._id })
    .populate("sender", "name role")
    .sort({ createdAt: 1 })
    .lean();

  res.json(new ApiResponse(200, { ...task, messages }, "Task fetched successfully"));
});

// ================= UPDATE TASK STATUS (Teacher: In-Progress/Completed/Problem) =================
// Access: TEACHER (sirf apna assigned task)
// Body: { status, note }

exports.updateTaskStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;

  const validStatuses = ["IN_PROGRESS", "COMPLETED", "PROBLEM"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json(new ApiResponse(400, null, "Invalid status"));
  }

  const task = await Task.findById(req.params.id);
  if (!task) {
    return res.status(404).json(new ApiResponse(404, null, "Task not found"));
  }

  if (String(task.assignedTo) !== String(req.user._id)) {
    return res.status(403).json(new ApiResponse(403, null, "This task is not assigned to you"));
  }

  // PROBLEM ya COMPLETED report karte waqt note zaroori hai (context ke liye)
  if ((status === "PROBLEM" || status === "COMPLETED") && !note?.trim() && status === "PROBLEM") {
    return res.status(400).json(new ApiResponse(400, null, "Please describe the problem"));
  }

  task.status = status;
  task.lastStatusNote = note || "";
  if (status === "COMPLETED") task.completedAt = new Date();
  if (status !== "COMPLETED") task.completedAt = null;

  await task.save();

  // status change ko thread mein bhi ek system-style message ki tarah save karo, taaki history dikhe
  if (note && note.trim()) {
    await TaskMessage.create({
      task: task._id,
      sender: req.user._id,
      message: `[${status.replace("_", " ")}] ${note.trim()}`,
    });
  }

  const populated = await Task.findById(task._id)
    .populate("assignedTo", "name email")
    .populate("assignedBy", "name email")
    .lean();

  res.json(new ApiResponse(200, populated, "Task status updated successfully"));
});

// ================= ADD MESSAGE (both sides can chat) =================
// Access: assignedTo teacher OR assignedBy admin/staff

exports.addTaskMessage = asyncHandler(async (req, res) => {
  const { message } = req.body;

  if (!message?.trim()) {
    return res.status(400).json(new ApiResponse(400, null, "Message cannot be empty"));
  }

  const task = await Task.findById(req.params.id).select("assignedTo assignedBy").lean();
  if (!task) {
    return res.status(404).json(new ApiResponse(404, null, "Task not found"));
  }

  const isOwner = String(task.assignedTo) === String(req.user._id);
  const isAssigner = String(task.assignedBy) === String(req.user._id);
  const isStaff = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL"].includes(req.user.role);

  if (!isOwner && !isAssigner && !isStaff) {
    return res.status(403).json(new ApiResponse(403, null, "You don't have access to this task"));
  }

  const newMessage = await TaskMessage.create({
    task: req.params.id,
    sender: req.user._id,
    message: message.trim(),
  });

  const populated = await newMessage.populate("sender", "name role");

  res.status(201).json(new ApiResponse(201, populated, "Message sent"));
});

// ================= DELETE TASK =================
// Access: SUPER_ADMIN, ADMIN, PRINCIPAL (sirf jisne assign kiya, ya koi bhi staff)

exports.deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    return res.status(404).json(new ApiResponse(404, null, "Task not found"));
  }

  await Promise.all([
    task.deleteOne(),
    TaskMessage.deleteMany({ task: task._id }), // orphan messages hata do
  ]);

  res.json(new ApiResponse(200, null, "Task deleted successfully"));
});

// ================= TASK STATS (Admin dashboard widget ke liye, optional but useful) =================
// Access: SUPER_ADMIN, ADMIN, PRINCIPAL

exports.getTaskStats = asyncHandler(async (req, res) => {
  const stats = await Task.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const result = { PENDING: 0, IN_PROGRESS: 0, COMPLETED: 0, PROBLEM: 0 };
  stats.forEach((s) => { result[s._id] = s.count; });

  res.json(new ApiResponse(200, result, "Task stats fetched successfully"));
});