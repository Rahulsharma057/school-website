const NewsSection = require("../models/NewsSection");
const News = require("../models/News");

const asyncHandler = require("../helpers/asyncHandler");
const ApiResponse = require("../helpers/ApiResponse");
const ApiError = require("../helpers/ApiError");

const slugify = (text = "") =>
  text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");

const escapeRegex = (str = "") => String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const MAX_TITLE_LENGTH = 150;
const MAX_BUTTON_LABEL_LENGTH = 60;
const MAX_BUTTON_URL_LENGTH = 300;
const VALID_COLUMNS = [1, 2, 3, 4];
const VALID_MOBILE_COLUMNS = [1, 2];
const VALID_DISPLAY_STYLES = ["grid", "list", "slider"];
const VALID_STYLES = ["bordered", "plain", "minimal"];
const VALID_WIDTHS = ["sm", "md", "lg", "xl", "full"];

const validateLayout = (layout = {}) => ({
  columns: VALID_COLUMNS.includes(Number(layout.columns)) ? Number(layout.columns) : 3,
  mobileColumns: VALID_MOBILE_COLUMNS.includes(Number(layout.mobileColumns))
    ? Number(layout.mobileColumns)
    : 1,
  displayStyle: VALID_DISPLAY_STYLES.includes(layout.displayStyle) ? layout.displayStyle : "grid",
  cardStyle: VALID_STYLES.includes(layout.cardStyle) ? layout.cardStyle : "bordered",
  width: VALID_WIDTHS.includes(layout.width) ? layout.width : "lg",
  primaryColor: layout.primaryColor || "#18181b",
});

const validateButton = (button = {}) => ({
  enabled: button.enabled !== undefined ? Boolean(button.enabled) : true,
  label: String(button.label || "View All News").trim().slice(0, MAX_BUTTON_LABEL_LENGTH),
  url: String(button.url || "/news").trim().slice(0, MAX_BUTTON_URL_LENGTH),
});

const validateFilter = (filter = {}) => ({
  category: String(filter.category || "").trim(),
  tag: String(filter.tag || "").trim().toLowerCase(),
  featuredOnly: Boolean(filter.featuredOnly),
});

const resolveUniqueSlug = async ({ raw, fallback, excludeId }) => {
  const finalSlug = slugify(raw || fallback);

  if (!finalSlug) {
    throw new ApiError(400, "Could not generate a valid route from the given text — include at least one letter or number");
  }

  const query = { slug: finalSlug };
  if (excludeId) query._id = { $ne: excludeId };

  const duplicate = await NewsSection.findOne(query).lean();
  if (duplicate) {
    throw new ApiError(400, "A news section with this route already exists");
  }

  return finalSlug;
};

// ================= CREATE (admin) =================

const createSection = asyncHandler(async (req, res) => {
  const { title, slug, description, filter, layout, button, pageSize, status } = req.body;

  if (!title?.trim()) throw new ApiError(400, "Title is required");
  if (title.trim().length > MAX_TITLE_LENGTH) {
    throw new ApiError(400, `Title must be at most ${MAX_TITLE_LENGTH} characters`);
  }

  const finalSlug = await resolveUniqueSlug({ raw: slug, fallback: title });

  const section = await NewsSection.create({
    title: title.trim(),
    slug: finalSlug,
    description: description?.trim() || "",
    filter: validateFilter(filter),
    layout: validateLayout(layout),
    button: validateButton(button),
    pageSize: Math.min(Math.max(Number(pageSize) || 6, 3), 24),
    status: status !== undefined ? Boolean(status) : true,
  });

  return res.status(201).json(new ApiResponse(201, section, "News section created successfully"));
});

// ================= LIST (admin) =================

const getSections = asyncHandler(async (req, res) => {
  const search = req.query.search ? escapeRegex(req.query.search) : "";

  const filter = search
    ? { $or: [{ title: { $regex: search, $options: "i" } }, { slug: { $regex: search, $options: "i" } }] }
    : {};

  const sections = await NewsSection.find(filter).sort({ createdAt: -1 }).lean();

  return res.json(new ApiResponse(200, sections, "News sections fetched successfully"));
});

// ================= GET ONE (admin) =================

const getSection = asyncHandler(async (req, res) => {
  const section = await NewsSection.findById(req.params.id);

  if (!section) throw new ApiError(404, "News section not found");

  return res.json(new ApiResponse(200, section, "News section fetched successfully"));
});

// ================= PUBLIC (by route slug) =================
// Resolves the section's config AND its matching articles in one call —
// the frontend never has to separately re-derive the filter/pagination.

const getPublicSection = asyncHandler(async (req, res) => {
  const section = await NewsSection.findOne({ slug: req.params.slug, status: true }).lean();

  if (!section) throw new ApiError(404, "News section not found");

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = section.pageSize;

  const newsFilter = { status: "published" };
  if (section.filter?.category) newsFilter.category = section.filter.category;
  if (section.filter?.tag) newsFilter.tags = section.filter.tag;
  if (section.filter?.featuredOnly) newsFilter.isFeatured = true;

  const [total, articles] = await Promise.all([
    News.countDocuments(newsFilter),
    News.find(newsFilter)
      .select("-content -gallery -seo")
      .sort({ order: 1, publishedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  const hasMore = page * limit < total;

  return res.json(
    new ApiResponse(
      200,
      {
        _id: section._id,
        title: section.title,
        slug: section.slug,
        description: section.description,
        layout: section.layout,
        button: section.button,
        pageSize: section.pageSize,
        articles,
        total,
        page,
        hasMore,
      },
      "News section fetched successfully",
    ),
  );
});

// ================= UPDATE (admin) =================

const updateSection = asyncHandler(async (req, res) => {
  const section = await NewsSection.findById(req.params.id);

  if (!section) throw new ApiError(404, "News section not found");

  const { title, slug, description, filter, layout, button, pageSize, status } = req.body;

  if (title !== undefined) {
    if (!title.trim()) throw new ApiError(400, "Title is required");
    if (title.trim().length > MAX_TITLE_LENGTH) {
      throw new ApiError(400, `Title must be at most ${MAX_TITLE_LENGTH} characters`);
    }
    section.title = title.trim();
  }

  if (description !== undefined) section.description = description.trim();
  if (filter !== undefined) section.filter = validateFilter(filter);
  if (layout !== undefined) section.layout = validateLayout(layout);
  if (button !== undefined) section.button = validateButton(button);
  if (pageSize !== undefined) section.pageSize = Math.min(Math.max(Number(pageSize) || 6, 3), 24);
  if (status !== undefined) section.status = Boolean(status);

  if (slug !== undefined || title !== undefined) {
    const finalSlug = await resolveUniqueSlug({
      raw: slug,
      fallback: title || section.title,
      excludeId: section._id,
    });

    if (finalSlug !== section.slug) section.slug = finalSlug;
  }

  await section.save();

  return res.json(new ApiResponse(200, section, "News section updated successfully"));
});

// ================= DELETE (admin) =================

const deleteSection = asyncHandler(async (req, res) => {
  const section = await NewsSection.findById(req.params.id);

  if (!section) throw new ApiError(404, "News section not found");

  await section.deleteOne();

  return res.json(new ApiResponse(200, null, "News section deleted successfully"));
});

module.exports = {
  createSection,
  getSections,
  getSection,
  getPublicSection,
  updateSection,
  deleteSection,
};
