const mongoose = require("mongoose");

const QuoteSection = require("../models/QuoteSection");

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
const MAX_QUOTES_PER_SECTION = 100;
const MAX_BUTTON_LABEL_LENGTH = 60;
const MAX_BUTTON_URL_LENGTH = 300;
const VALID_COLUMNS = [1, 2, 3];
const VALID_MOBILE_COLUMNS = [1, 2];
const VALID_DISPLAY_STYLES = ["grid", "list", "slider"];
const VALID_IMAGE_DISPLAYS = ["avatar", "full"];
const VALID_POSITIONS = ["left", "right"];
const VALID_STYLES = ["bordered", "plain", "minimal"];
const VALID_WIDTHS = ["sm", "md", "lg", "xl", "full"];
const VALID_SIZES = ["sm", "md", "lg", "xl"];
const VALID_SHAPES = ["round", "square"];
const VALID_MOBILE_POSITIONS = ["top", "bottom"];

// Same "normalize, clamp, fall back to sane defaults" approach as
// form.controller.js's validateAndNormalizeFields.
const validateLayout = (layout = {}) => ({
  columns: VALID_COLUMNS.includes(Number(layout.columns)) ? Number(layout.columns) : 2,
  mobileColumns: VALID_MOBILE_COLUMNS.includes(Number(layout.mobileColumns))
    ? Number(layout.mobileColumns)
    : 1,
  displayStyle: VALID_DISPLAY_STYLES.includes(layout.displayStyle) ? layout.displayStyle : "grid",
  imagePosition: VALID_POSITIONS.includes(layout.imagePosition) ? layout.imagePosition : "right",
  cardStyle: VALID_STYLES.includes(layout.cardStyle) ? layout.cardStyle : "bordered",
  width: VALID_WIDTHS.includes(layout.width) ? layout.width : "lg",
  primaryColor: layout.primaryColor || "#18181b",
  photoSize: VALID_SIZES.includes(layout.photoSize) ? layout.photoSize : "md",
  photoShape: VALID_SHAPES.includes(layout.photoShape) ? layout.photoShape : "round",
  imageDisplay: VALID_IMAGE_DISPLAYS.includes(layout.imageDisplay) ? layout.imageDisplay : "avatar",
  fontSize: VALID_SIZES.includes(layout.fontSize) ? layout.fontSize : "md",
  mobilePhotoPosition: VALID_MOBILE_POSITIONS.includes(layout.mobilePhotoPosition)
    ? layout.mobilePhotoPosition
    : null,
});

// The CTA button is entirely optional — `enabled: false` is a valid,
// common state, so this never throws, it just normalizes whatever came
// in (missing/malformed label or url just become empty strings rather
// than blocking the whole save).
const validateButton = (button = {}) => ({
  enabled: Boolean(button.enabled),
  label: String(button.label || "View All").trim().slice(0, MAX_BUTTON_LABEL_LENGTH),
  url: String(button.url || "").trim().slice(0, MAX_BUTTON_URL_LENGTH),
});

// a per-quote override field: use it only if it's one of the allowed
// values, otherwise null ("inherit the page-wide default")
const normalizeOverride = (value, validValues) => (validValues.includes(value) ? value : null);

// A page is an explicit, ordered list of quotes — not "everything
// matching a category" — and each entry can override any of the page's
// layout defaults for just that one quote. `order` is derived from
// array position, not sent by the client, so drag-and-drop reordering on
// the frontend is simply "resubmit the array in its new order".
const validateQuotesList = (quotes) => {
  if (quotes === undefined) return undefined; // field not being touched

  if (!Array.isArray(quotes)) {
    throw new ApiError(400, "quotes must be an array");
  }

  if (quotes.length > MAX_QUOTES_PER_SECTION) {
    throw new ApiError(400, `A page can hold at most ${MAX_QUOTES_PER_SECTION} quotes`);
  }

  return quotes.map((item, index) => {
    const quoteId = item?.quote;

    if (!quoteId || !mongoose.Types.ObjectId.isValid(quoteId)) {
      throw new ApiError(400, "Each entry in quotes needs a valid quote id");
    }

    return {
      quote: quoteId,
      imagePosition: normalizeOverride(item?.imagePosition, VALID_POSITIONS),
      photoSize: normalizeOverride(item?.photoSize, VALID_SIZES),
      photoShape: normalizeOverride(item?.photoShape, VALID_SHAPES),
      imageDisplay: normalizeOverride(item?.imageDisplay, VALID_IMAGE_DISPLAYS),
      fontSize: normalizeOverride(item?.fontSize, VALID_SIZES),
      mobilePhotoPosition: normalizeOverride(item?.mobilePhotoPosition, VALID_MOBILE_POSITIONS),
      order: index,
    };
  });
};

const resolveUniqueSlug = async ({ raw, fallback, excludeId }) => {
  const finalSlug = slugify(raw || fallback);

  if (!finalSlug) {
    throw new ApiError(400, "Could not generate a valid route from the given text — include at least one letter or number");
  }

  const query = { slug: finalSlug };
  if (excludeId) query._id = { $ne: excludeId };

  const duplicate = await QuoteSection.findOne(query).lean();
  if (duplicate) {
    throw new ApiError(400, "A quote section with this route already exists");
  }

  return finalSlug;
};

// ================= CREATE (admin) =================

const createSection = asyncHandler(async (req, res) => {
  const { title, slug, description, layout, button, pageSize, quotes, status } = req.body;

  if (!title?.trim()) throw new ApiError(400, "Title is required");
  if (title.trim().length > MAX_TITLE_LENGTH) {
    throw new ApiError(400, `Title must be at most ${MAX_TITLE_LENGTH} characters`);
  }

  const finalSlug = await resolveUniqueSlug({ raw: slug, fallback: title });

  const section = await QuoteSection.create({
    title: title.trim(),
    slug: finalSlug,
    description: description?.trim() || "",
    layout: validateLayout(layout),
    button: validateButton(button),
    pageSize: Math.min(Math.max(Number(pageSize) || 9, 3), 30),
    quotes: validateQuotesList(quotes) || [],
    status: status !== undefined ? Boolean(status) : true,
  });

  return res.status(201).json(new ApiResponse(201, section, "Quote page created successfully"));
});

// ================= LIST (admin) =================

const getSections = asyncHandler(async (req, res) => {
  const search = req.query.search ? escapeRegex(req.query.search) : "";

  const filter = search
    ? { $or: [{ title: { $regex: search, $options: "i" } }, { slug: { $regex: search, $options: "i" } }] }
    : {};

  // list view doesn't need each page's full quote list, just a count
  const sections = await QuoteSection.find(filter).sort({ createdAt: -1 }).lean();

  const withCounts = sections.map(({ quotes, ...s }) => ({ ...s, quoteCount: quotes?.length || 0 }));

  return res.json(new ApiResponse(200, withCounts, "Quote pages fetched successfully"));
});

// ================= GET ONE (admin, for editing) =================
// Populates each quote entry with the real quote content so the
// QuoteSectionForm picker can show what's already on the page.

const getSection = asyncHandler(async (req, res) => {
  const section = await QuoteSection.findById(req.params.id).populate({
    path: "quotes.quote",
    select: "quoteText authorName authorTitle authorImage category status",
  });

  if (!section) throw new ApiError(404, "Quote page not found");

  return res.json(new ApiResponse(200, section, "Quote page fetched successfully"));
});

// ================= PUBLIC (by route slug) =================
// Resolves the page's quotes down to a flat, ready-to-render array:
// each quote's real content, with every visual property (image
// position/size/shape, font size, mobile stacking) already resolved to
// "this quote's own override, or the page's default" — the frontend
// never has to do that fallback logic itself.

const getPublicSection = asyncHandler(async (req, res) => {
  const section = await QuoteSection.findOne({ slug: req.params.slug, status: true })
    .populate({ path: "quotes.quote", select: "-__v" })
    .lean();

  if (!section) throw new ApiError(404, "Quote page not found");

  const resolvedQuotes = (section.quotes || [])
    // a referenced quote may have been deleted, or hidden since being
    // added to this page — drop it rather than render a broken card
    .filter((item) => item.quote && item.quote.status === true)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((item) => ({
      ...item.quote,
      imagePosition: item.imagePosition || section.layout.imagePosition,
      photoSize: item.photoSize || section.layout.photoSize,
      photoShape: item.photoShape || section.layout.photoShape,
      imageDisplay: item.imageDisplay || section.layout.imageDisplay,
      fontSize: item.fontSize || section.layout.fontSize,
      mobilePhotoPosition: item.mobilePhotoPosition || section.layout.mobilePhotoPosition || null,
    }));

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
        quotes: resolvedQuotes,
      },
      "Quote page fetched successfully",
    ),
  );
});

// ================= UPDATE (admin) =================

const updateSection = asyncHandler(async (req, res) => {
  const section = await QuoteSection.findById(req.params.id);

  if (!section) throw new ApiError(404, "Quote page not found");

  const { title, slug, description, layout, button, pageSize, quotes, status } = req.body;

  if (title !== undefined) {
    if (!title.trim()) throw new ApiError(400, "Title is required");
    if (title.trim().length > MAX_TITLE_LENGTH) {
      throw new ApiError(400, `Title must be at most ${MAX_TITLE_LENGTH} characters`);
    }
    section.title = title.trim();
  }

  if (description !== undefined) section.description = description.trim();
  if (layout !== undefined) section.layout = validateLayout(layout);
  if (button !== undefined) section.button = validateButton(button);
  if (pageSize !== undefined) section.pageSize = Math.min(Math.max(Number(pageSize) || 9, 3), 30);
  if (quotes !== undefined) section.quotes = validateQuotesList(quotes);
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

  return res.json(new ApiResponse(200, section, "Quote page updated successfully"));
});

// ================= DELETE (admin) =================

const deleteSection = asyncHandler(async (req, res) => {
  const section = await QuoteSection.findById(req.params.id);

  if (!section) throw new ApiError(404, "Quote page not found");

  await section.deleteOne();

  return res.json(new ApiResponse(200, null, "Quote page deleted successfully"));
});

module.exports = {
  createSection,
  getSections,
  getSection,
  getPublicSection,
  updateSection,
  deleteSection,
};
