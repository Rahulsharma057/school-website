const mongoose = require("mongoose");

const Quote = require("../models/Quote");
const QuoteSection = require("../models/QuoteSection");

const uploadToCloudinary = require("../utils/uploadToCloudinary");
const deleteFromCloudinary = require("../utils/deleteFromCloudinary");

const asyncHandler = require("../helpers/asyncHandler");
const ApiResponse = require("../helpers/ApiResponse");
const ApiError = require("../helpers/ApiError");

const MAX_QUOTE_LENGTH = 600;
const MAX_NAME_LENGTH = 100;
const MAX_TITLE_LENGTH = 100;
const MAX_CATEGORY_LENGTH = 50;
const MAX_REORDER_ITEMS = 300;
const MAX_BUTTON_LABEL_LENGTH = 60;
const MAX_BUTTON_URL_LENGTH = 300;

// same pattern used in form.controller.js / formEntry.controller.js —
// escape regex special chars before dropping search input into $regex
const escapeRegex = (str = "") => String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// "true"/"false" arrive as strings when the request is multipart
// (FormData, because of the image upload) instead of JSON.
const parseBoolean = (value, fallback) => {
  if (value === undefined) return fallback;
  return value === true || value === "true";
};

// The quote's own optional per-card button — same shape/normalization
// as QuoteSection's page-wide button (see quoteSection.controller.js),
// just living on the Quote itself so it follows the card wherever it's
// used. Arrives as a JSON string (multipart form field), not a real
// object, since the request is FormData because of the image upload.
const parseButton = (raw) => {
  if (raw === undefined) return undefined;

  let parsed;
  try {
    parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    throw new ApiError(400, "Invalid button data");
  }

  return {
    enabled: Boolean(parsed?.enabled),
    label: String(parsed?.label || "Read More").trim().slice(0, MAX_BUTTON_LABEL_LENGTH),
    url: String(parsed?.url || "").trim().slice(0, MAX_BUTTON_URL_LENGTH),
  };
};

// ================= CREATE (admin) =================

const createQuote = asyncHandler(async (req, res) => {
  const { quoteText, authorName, authorTitle, category, status, button } = req.body;

  if (!quoteText?.trim()) {
    throw new ApiError(400, "Quote text is required");
  }
  if (quoteText.trim().length > MAX_QUOTE_LENGTH) {
    throw new ApiError(400, `Quote text must be at most ${MAX_QUOTE_LENGTH} characters`);
  }

  if (!authorName?.trim()) {
    throw new ApiError(400, "Author name is required");
  }
  if (authorName.trim().length > MAX_NAME_LENGTH) {
    throw new ApiError(400, `Author name must be at most ${MAX_NAME_LENGTH} characters`);
  }

  if (authorTitle && authorTitle.length > MAX_TITLE_LENGTH) {
    throw new ApiError(400, `Author title must be at most ${MAX_TITLE_LENGTH} characters`);
  }
  if (category && category.length > MAX_CATEGORY_LENGTH) {
    throw new ApiError(400, `Category must be at most ${MAX_CATEGORY_LENGTH} characters`);
  }

  let authorImage = { url: "", public_id: "" };
  let uploaded = null;

  try {
    if (req.file) {
      uploaded = await uploadToCloudinary(req.file, {
        folder: "school-website/quotes",
        resourceType: "image",
      });
      authorImage = { url: uploaded.url, public_id: uploaded.public_id };
    }

    // new quotes are appended to the end of the current order
    const last = await Quote.findOne().sort({ order: -1 }).select("order").lean();
    const order = last ? last.order + 1 : 0;

    const quote = await Quote.create({
      quoteText: quoteText.trim(),
      authorName: authorName.trim(),
      authorTitle: authorTitle?.trim() || "",
      category: category?.trim() || "",
      authorImage,
      button: parseButton(button) || { enabled: false, label: "Read More", url: "" },
      status: parseBoolean(status, true),
      order,
    });

    return res.status(201).json(new ApiResponse(201, quote, "Quote added successfully"));
  } catch (err) {
    // don't leave an orphaned Cloudinary upload if the DB write fails
    if (uploaded) await deleteFromCloudinary(uploaded.public_id).catch(() => {});
    throw err;
  }
});

// ================= LIST (admin) =================
// No hard-paginated page/limit split — the admin list is small enough
// (school testimonials, not thousands of rows) that it's loaded as one
// capped batch so drag-and-drop reordering has a stable, complete list
// to work with. A "Load more" affordance on the frontend bumps `limit`
// for large lists instead of paging through them.

const getQuotes = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(1, Number(req.query.limit) || 50), 200);
  const search = req.query.search ? escapeRegex(req.query.search) : "";

  const filter = search
    ? {
        $or: [
          { quoteText: { $regex: search, $options: "i" } },
          { authorName: { $regex: search, $options: "i" } },
          { authorTitle: { $regex: search, $options: "i" } },
        ],
      }
    : {};

  const [total, data] = await Promise.all([
    Quote.countDocuments(filter),
    Quote.find(filter).sort({ order: 1, createdAt: -1 }).limit(limit).lean(),
  ]);

  return res.json(new ApiResponse(200, { data, total, limit }, "Quotes fetched successfully"));
});

// ================= GET ONE (admin) =================

const getQuote = asyncHandler(async (req, res) => {
  const quote = await Quote.findById(req.params.id);

  if (!quote) throw new ApiError(404, "Quote not found");

  return res.json(new ApiResponse(200, quote, "Quote fetched successfully"));
});

// ================= PUBLIC (paginated — the "quotes wall") =================
// Real page/limit pagination so the frontend can lazy-load more quotes
// as the visitor scrolls, instead of shipping every quote up front.

const getPublicQuotes = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(Math.max(1, Number(req.query.limit) || 9), 50);
  const category = req.query.category ? escapeRegex(req.query.category) : "";

  const filter = { status: true };
  if (category) filter.category = { $regex: `^${category}$`, $options: "i" };

  const [total, data] = await Promise.all([
    Quote.countDocuments(filter),
    Quote.find(filter)
      .select("-__v")
      .sort({ order: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  const hasMore = page * limit < total;

  return res.json(
    new ApiResponse(200, { data, total, page, limit, hasMore }, "Quotes fetched successfully"),
  );
});

// ================= UPDATE (admin) =================

const updateQuote = asyncHandler(async (req, res) => {
  const quote = await Quote.findById(req.params.id);

  if (!quote) throw new ApiError(404, "Quote not found");

  const { quoteText, authorName, authorTitle, category, status, removeImage, button } = req.body;

  if (quoteText !== undefined) {
    if (!quoteText.trim()) throw new ApiError(400, "Quote text is required");
    if (quoteText.trim().length > MAX_QUOTE_LENGTH) {
      throw new ApiError(400, `Quote text must be at most ${MAX_QUOTE_LENGTH} characters`);
    }
    quote.quoteText = quoteText.trim();
  }

  if (authorName !== undefined) {
    if (!authorName.trim()) throw new ApiError(400, "Author name is required");
    if (authorName.trim().length > MAX_NAME_LENGTH) {
      throw new ApiError(400, `Author name must be at most ${MAX_NAME_LENGTH} characters`);
    }
    quote.authorName = authorName.trim();
  }

  if (authorTitle !== undefined) {
    if (authorTitle.length > MAX_TITLE_LENGTH) {
      throw new ApiError(400, `Author title must be at most ${MAX_TITLE_LENGTH} characters`);
    }
    quote.authorTitle = authorTitle.trim();
  }

  if (category !== undefined) {
    if (category.length > MAX_CATEGORY_LENGTH) {
      throw new ApiError(400, `Category must be at most ${MAX_CATEGORY_LENGTH} characters`);
    }
    quote.category = category.trim();
  }

  if (status !== undefined) {
    quote.status = parseBoolean(status, quote.status);
  }

  const parsedButton = parseButton(button);
  if (parsedButton !== undefined) {
    quote.button = parsedButton;
  }

  let uploaded = null;

  try {
    // a fresh upload always wins over a "remove image" flag sent in the
    // same request
    if (req.file) {
      uploaded = await uploadToCloudinary(req.file, {
        folder: "school-website/quotes",
        resourceType: "image",
      });

      if (quote.authorImage?.public_id) {
        await deleteFromCloudinary(quote.authorImage.public_id).catch(() => {});
      }

      quote.authorImage = { url: uploaded.url, public_id: uploaded.public_id };
    } else if (parseBoolean(removeImage, false)) {
      if (quote.authorImage?.public_id) {
        await deleteFromCloudinary(quote.authorImage.public_id).catch(() => {});
      }
      quote.authorImage = { url: "", public_id: "" };
    }

    await quote.save();
  } catch (err) {
    if (uploaded) await deleteFromCloudinary(uploaded.public_id).catch(() => {});
    throw err;
  }

  return res.json(new ApiResponse(200, quote, "Quote updated successfully"));
});

// ================= TOGGLE STATUS (admin) =================

const toggleQuoteStatus = asyncHandler(async (req, res) => {
  const quote = await Quote.findById(req.params.id);

  if (!quote) throw new ApiError(404, "Quote not found");

  quote.status = !quote.status;
  await quote.save();

  return res.json(
    new ApiResponse(200, quote, `Quote marked as ${quote.status ? "visible" : "hidden"}`),
  );
});

// ================= REORDER (admin — drag & drop) =================

const reorderQuotes = asyncHandler(async (req, res) => {
  const { order } = req.body; // [{ id, order }, ...]

  if (!Array.isArray(order) || !order.length) {
    throw new ApiError(400, "order must be a non-empty array");
  }

  if (order.length > MAX_REORDER_ITEMS) {
    throw new ApiError(400, `Cannot reorder more than ${MAX_REORDER_ITEMS} items at once`);
  }

  const invalid = order.filter(
    (o) => !o?.id || !mongoose.Types.ObjectId.isValid(o.id) || typeof o.order !== "number",
  );

  if (invalid.length) {
    throw new ApiError(400, "Each item must have a valid id and a numeric order");
  }

  const bulkOps = order.map(({ id, order: pos }) => ({
    updateOne: { filter: { _id: id }, update: { $set: { order: pos } } },
  }));

  await Quote.bulkWrite(bulkOps);

  return res.json(new ApiResponse(200, null, "Order updated successfully"));
});

// ================= DELETE (admin) =================

const deleteQuote = asyncHandler(async (req, res) => {
  const quote = await Quote.findById(req.params.id);

  if (!quote) throw new ApiError(404, "Quote not found");

  if (quote.authorImage?.public_id) {
    await deleteFromCloudinary(quote.authorImage.public_id).catch(() => {});
  }

  await quote.deleteOne();

  // quote pages hold an explicit reference to this quote's _id —
  // without this, a deleted quote would leave a dangling reference that
  // getPublicSection has to silently filter out forever. Pull it from
  // every page it was placed on so a page's quote list stays accurate.
  await QuoteSection.updateMany({}, { $pull: { quotes: { quote: quote._id } } }).catch(() => {});

  return res.json(new ApiResponse(200, null, "Quote deleted successfully"));
});

module.exports = {
  createQuote,
  getQuotes,
  getQuote,
  getPublicQuotes,
  updateQuote,
  toggleQuoteStatus,
  reorderQuotes,
  deleteQuote,
};
