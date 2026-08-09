const Announcement = require("../models/Announcement");

const uploadToCloudinary = require("../utils/uploadToCloudinary");
const deleteFromCloudinary = require("../utils/deleteFromCloudinary");

const asyncHandler = require("../helpers/asyncHandler");
const ApiResponse = require("../helpers/ApiResponse");
const ApiError = require("../helpers/ApiError");

const slugify = (text = "") =>
  text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");

const VALID_ROLES = ["SUPER_ADMIN", "ADMIN", "EDITOR", "VIEWER"];
const VALID_PLACEMENTS = ["homepage-ticker", "navbar-ticker", "footer", "notice-board", "sidebar"];
const VALID_LINK_TYPES = ["none", "internal", "external"];
const VALID_TYPES = ["general", "notice", "event", "urgent"];

const validateLink = (link) => {
  if (!link) return { type: "none", url: "" };

  const { type = "none", url = "" } = link;

  if (!VALID_LINK_TYPES.includes(type)) {
    throw new ApiError(400, `Invalid link type: ${type}`);
  }

  if (type !== "none" && !url?.trim()) {
    throw new ApiError(400, "A URL is required for this link type");
  }

  return { type, url: url?.trim() || "" };
};

const validateAccessControl = (accessControl) => {
  if (!accessControl) return { viewRoles: [] };

  const { viewRoles = [] } = accessControl;

  for (const role of viewRoles) {
    if (!VALID_ROLES.includes(role)) {
      throw new ApiError(400, `Invalid role in accessControl: ${role}`);
    }
  }

  return { viewRoles };
};

const validatePlacements = (placements = []) => {
  for (const p of placements) {
    if (!VALID_PLACEMENTS.includes(p)) {
      throw new ApiError(400, `Invalid placement: ${p}`);
    }
  }
  return placements;
};

const validateDates = (startDate, endDate) => {
  const start = startDate ? new Date(startDate) : new Date();
  const end = endDate ? new Date(endDate) : null;

  if (end && end <= start) {
    throw new ApiError(400, "End date must be after the start date");
  }

  return { start, end };
};

// ================= CREATE =================

const createAnnouncement = asyncHandler(async (req, res) => {
  const {
    title,
    tickerText,
    content,
    type,
    link,
    slug,
    priority,
    pinned,
    startDate,
    endDate,
    status,
    placements,
    accessControl,
  } = req.body;

  if (!title?.trim()) throw new ApiError(400, "Title is required");
  if (!tickerText?.trim()) throw new ApiError(400, "Ticker text is required");

  if (type !== undefined && !VALID_TYPES.includes(type)) {
    throw new ApiError(400, `Invalid type: ${type}`);
  }

  const finalSlug = slugify(slug || title);

  const slugExists = await Announcement.findOne({ slug: finalSlug }).lean();
  if (slugExists) throw new ApiError(400, "An announcement with this route already exists");

  const { start, end } = validateDates(startDate, endDate);

  let attachment = { url: "", public_id: "", originalName: "" };

  if (req.file) {
    const uploaded = await uploadToCloudinary(req.file);
    attachment = {
      url: uploaded.url,
      public_id: uploaded.public_id,
      originalName: req.file.originalname,
    };
  }

  const announcement = await Announcement.create({
    title,
    tickerText,
    content: content || "",
    type: type || "general",
    link: validateLink(link ? JSON.parse(typeof link === "string" ? link : JSON.stringify(link)) : null),
    attachment,
    slug: finalSlug,
    priority: Number(priority) || 0,
    pinned: pinned === true || pinned === "true",
    startDate: start,
    endDate: end,
    status: status !== undefined ? status === true || status === "true" : true,
    placements: validatePlacements(
      typeof placements === "string" ? JSON.parse(placements) : placements,
    ),
    accessControl: validateAccessControl(
      typeof accessControl === "string" ? JSON.parse(accessControl) : accessControl,
    ),
  });

  return res.status(201).json(new ApiResponse(201, announcement, "Announcement created successfully"));
});

// ================= LIST (admin) =================

const getAnnouncements = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const { search, type, placement } = req.query;

  const filter = {};

  if (type) filter.type = type;
  if (placement) filter.placements = placement;

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { tickerText: { $regex: search, $options: "i" } },
      { slug: { $regex: search, $options: "i" } },
    ];
  }

  const total = await Announcement.countDocuments(filter);

  const data = await Announcement.find(filter)
    .sort({ pinned: -1, priority: -1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return res.json(
    new ApiResponse(
      200,
      { data, total, page, limit, totalPages: Math.ceil(total / limit) },
      "Announcements fetched successfully",
    ),
  );
});

// ================= GET ONE (admin, for edit) =================

const getAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) throw new ApiError(404, "Announcement not found");
  return res.json(new ApiResponse(200, announcement, "Announcement fetched successfully"));
});

// ================= PUBLIC — TICKER FEED =================
// Only ever returns announcements that are: active (status true),
// within their date window, and fully public (no viewRoles set) —
// restricted announcements are reachable via direct link but never
// surfaced in an unauthenticated ticker.

const getPublicTicker = asyncHandler(async (req, res) => {
  const { placement } = req.query;

  if (!placement || !VALID_PLACEMENTS.includes(placement)) {
    throw new ApiError(400, "A valid placement is required");
  }

  const now = new Date();

  const data = await Announcement.find({
    status: true,
    placements: placement,
    startDate: { $lte: now },
    $or: [{ endDate: null }, { endDate: { $gte: now } }],
    "accessControl.viewRoles": { $size: 0 },
  })
    .select("title tickerText slug type link priority pinned")
    .sort({ pinned: -1, priority: -1, createdAt: -1 })
    .limit(20)
    .lean();

  return res.json(new ApiResponse(200, data, "Ticker items fetched successfully"));
});

// ================= PUBLIC (by slug) =================
// checkResourceAccess already handled the role gate and attached
// req.resourceDoc — this just additionally enforces the date window
// and manual status toggle, since those can't be expressed as a
// static extraFilter at the middleware level.

const getPublicAnnouncement = asyncHandler(async (req, res) => {
  const announcement = req.resourceDoc;

  const now = new Date();
  const withinWindow =
    announcement.status &&
    new Date(announcement.startDate) <= now &&
    (!announcement.endDate || new Date(announcement.endDate) >= now);

  if (!withinWindow) {
    throw new ApiError(404, "Announcement not found");
  }

  return res.json(new ApiResponse(200, announcement, "Announcement fetched successfully"));
});

// ================= UPDATE =================

const updateAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) throw new ApiError(404, "Announcement not found");

  const {
    title,
    tickerText,
    content,
    type,
    link,
    slug,
    priority,
    pinned,
    startDate,
    endDate,
    status,
    placements,
    accessControl,
    removeAttachment,
  } = req.body;

  if (title !== undefined) announcement.title = title;
  if (tickerText !== undefined) announcement.tickerText = tickerText;
  if (content !== undefined) announcement.content = content;

  if (type !== undefined) {
    if (!VALID_TYPES.includes(type)) throw new ApiError(400, `Invalid type: ${type}`);
    announcement.type = type;
  }

  if (link !== undefined) {
    announcement.link = validateLink(typeof link === "string" ? JSON.parse(link) : link);
  }

  if (priority !== undefined) announcement.priority = Number(priority) || 0;
  if (pinned !== undefined) announcement.pinned = pinned === true || pinned === "true";
  if (status !== undefined) announcement.status = status === true || status === "true";

  if (placements !== undefined) {
    announcement.placements = validatePlacements(
      typeof placements === "string" ? JSON.parse(placements) : placements,
    );
  }

  if (accessControl !== undefined) {
    announcement.accessControl = validateAccessControl(
      typeof accessControl === "string" ? JSON.parse(accessControl) : accessControl,
    );
  }

  if (startDate !== undefined || endDate !== undefined) {
    const { start, end } = validateDates(
      startDate !== undefined ? startDate : announcement.startDate,
      endDate !== undefined ? endDate : announcement.endDate,
    );
    announcement.startDate = start;
    announcement.endDate = end;
  }

  if (removeAttachment === "true" || removeAttachment === true) {
    if (announcement.attachment?.public_id) {
      await deleteFromCloudinary(announcement.attachment.public_id);
    }
    announcement.attachment = { url: "", public_id: "", originalName: "" };
  }

  if (req.file) {
    if (announcement.attachment?.public_id) {
      await deleteFromCloudinary(announcement.attachment.public_id);
    }
    const uploaded = await uploadToCloudinary(req.file);
    announcement.attachment = {
      url: uploaded.url,
      public_id: uploaded.public_id,
      originalName: req.file.originalname,
    };
  }

  const finalSlug = slugify(slug || announcement.slug);

  if (finalSlug !== announcement.slug) {
    const duplicate = await Announcement.findOne({
      slug: finalSlug,
      _id: { $ne: announcement._id },
    }).lean();

    if (duplicate) throw new ApiError(400, "An announcement with this route already exists");
    announcement.slug = finalSlug;
  }

  await announcement.save();

  return res.json(new ApiResponse(200, announcement, "Announcement updated successfully"));
});

// ================= DELETE =================

const deleteAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) throw new ApiError(404, "Announcement not found");

  if (announcement.attachment?.public_id) {
    await deleteFromCloudinary(announcement.attachment.public_id);
  }

  await announcement.deleteOne();

  return res.json(new ApiResponse(200, null, "Announcement deleted successfully"));
});

// ================= PUBLIC — LIST (for a full "All Notices" page) =================
// Same active + date-window + fully-public rule as the ticker, but
// paginated and optionally filtered by placement/type — this is what
// powers a standalone notice-board listing page.

const getPublicAnnouncementsList = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 12);
  const { type, placement } = req.query;

  const now = new Date();

  const filter = {
    status: true,
    startDate: { $lte: now },
    $or: [{ endDate: null }, { endDate: { $gte: now } }],
    "accessControl.viewRoles": { $size: 0 },
  };

  if (type) filter.type = type;
  if (placement) filter.placements = placement;

  const total = await Announcement.countDocuments(filter);

  const data = await Announcement.find(filter)
    .select("title tickerText slug type link pinned priority startDate")
    .sort({ pinned: -1, priority: -1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return res.json(
    new ApiResponse(
      200,
      { data, total, page, limit, totalPages: Math.ceil(total / limit) },
      "Announcements fetched successfully",
    ),
  );
});


module.exports = {
  createAnnouncement,
  getAnnouncements,
  getAnnouncement,
  getPublicTicker,
  getPublicAnnouncementsList,
  getPublicAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
};