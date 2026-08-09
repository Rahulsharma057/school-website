const mongoose = require("mongoose");

const News = require("../models/News");

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

const escapeRegex = (str = "") => String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const clampLimit = (value, fallback = 10, max = 50) =>
  Math.min(Math.max(1, Number(value) || fallback), max);

const clampPage = (value) => Math.max(1, Number(value) || 1);

// ================= helpers =================

const uploadImage = (file) =>
  uploadToCloudinary(file, { folder: "school-website/news", resourceType: "image" });

const resolveUniqueSlug = async ({ raw, fallback, excludeId }) => {
  const base = slugify(raw || fallback);

  if (!base) {
    throw new ApiError(400, "Could not generate a valid slug from the title");
  }

  let candidate = base;
  let suffix = 1;

  // Unlike Form's resolveUniqueSlug (which just rejects a collision), news
  // titles collide far more often ("Sports Day" every year) — auto-suffix
  // instead of forcing the admin to manually pick a unique slug every time.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const query = { slug: candidate };
    if (excludeId) query._id = { $ne: excludeId };

    const exists = await News.exists(query);
    if (!exists) return candidate;

    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
};

// ================= CREATE (admin) =================

const createNews = asyncHandler(async (req, res) => {
  const {
    title,
    heading,
    slug,
    excerpt,
    content,
    tags,
    category,
    status,
    isFeatured,
    author,
    seoMetaTitle,
    seoMetaDescription,
  } = req.body;

  if (!title?.trim()) throw new ApiError(400, "Title is required");
  if (!content?.trim()) throw new ApiError(400, "Content is required");

  const coverFile = req.files?.coverImage?.[0];
  if (!coverFile) throw new ApiError(400, "A cover image is required");

  const finalSlug = await resolveUniqueSlug({ raw: slug, fallback: title });

  // Upload cover + gallery only after all validation above passed, so we
  // never burn a Cloudinary upload on a request that was going to 400 anyway.
  const uploadedCover = await uploadImage(coverFile);
  const coverImage = { url: uploadedCover.url, public_id: uploadedCover.public_id, alt: title };

  const galleryFiles = req.files?.gallery || [];
  const gallery = [];

  try {
    for (const file of galleryFiles) {
      const uploaded = await uploadImage(file);
      gallery.push({ url: uploaded.url, public_id: uploaded.public_id, alt: title });
    }

    const finalStatus = News.NEWS_STATUS.includes(status) ? status : "draft";

    // New items go to the end of the manual order so drag-drop only has
    // to touch items actually being reordered.
    const last = await News.findOne({}).sort({ order: -1 }).select("order").lean();
    const nextOrder = (last?.order ?? -1) + 1;

    const news = await News.create({
      title,
      heading: heading || "",
      slug: finalSlug,
      excerpt: excerpt || "",
      content,
      coverImage,
      gallery,
      tags: Array.isArray(tags) ? tags : typeof tags === "string" ? tags.split(",") : [],
      category: category || "",
      status: finalStatus,
      publishedAt: finalStatus === "published" ? new Date() : null,
      order: nextOrder,
      isFeatured: Boolean(isFeatured === true || isFeatured === "true"),
      author: author || "",
      seo: {
        metaTitle: seoMetaTitle || "",
        metaDescription: seoMetaDescription || "",
      },
    });

    return res.status(201).json(new ApiResponse(201, news, "News created successfully"));
  } catch (err) {
    // roll back any images already uploaded to Cloudinary if creation failed
    await Promise.all(
      [coverImage, ...gallery].map((img) => deleteFromCloudinary(img.public_id).catch(() => {})),
    );
    throw err;
  }
});

// ================= LIST (public — paginated, published only) =================

const getPublicNews = asyncHandler(async (req, res) => {
  const page = clampPage(req.query.page);
  const limit = clampLimit(req.query.limit, 9, 50);

  const { tag, category, featured, search } = req.query;

  const filter = { status: "published" };

  if (tag) filter.tags = String(tag).toLowerCase();
  if (category) filter.category = category;
  if (featured === "true") filter.isFeatured = true;

  if (search && typeof search === "string") {
    filter.$text = { $search: escapeRegex(search) };
  }

  const [total, data] = await Promise.all([
    News.countDocuments(filter),
    News.find(filter)
      .select("-content -gallery -seo") // list view doesn't need full article body/gallery
      .sort({ order: 1, publishedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  return res.json(
    new ApiResponse(
      200,
      { data, total, page, limit, totalPages: Math.ceil(total / limit) },
      "News fetched successfully",
    ),
  );
});

// ================= DETAIL (public — full article, by slug) =================

const getPublicNewsBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const news = await News.findOneAndUpdate(
    { slug, status: "published" },
    { $inc: { views: 1 } },
    { new: true },
  ).lean();

  if (!news) throw new ApiError(404, "News article not found");

  return res.json(new ApiResponse(200, news, "News fetched successfully"));
});

// ================= LIST (admin — all statuses, searchable) =================

const getAdminNewsList = asyncHandler(async (req, res) => {
  const page = clampPage(req.query.page);
  const limit = clampLimit(req.query.limit, 10, 100);

  const { status, search } = req.query;

  const filter = {};

  if (status) {
    if (!News.NEWS_STATUS.includes(status)) {
      throw new ApiError(400, `status must be one of: ${News.NEWS_STATUS.join(", ")}`);
    }
    filter.status = status;
  }

  if (search && typeof search === "string") {
    const safe = escapeRegex(search);
    filter.$or = [{ title: { $regex: safe, $options: "i" } }, { slug: { $regex: safe, $options: "i" } }];
  }

  const [total, data] = await Promise.all([
    News.countDocuments(filter),
    News.find(filter)
      .select("-content -gallery")
      .sort({ order: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  return res.json(
    new ApiResponse(
      200,
      { data, total, page, limit, totalPages: Math.ceil(total / limit) },
      "News fetched successfully",
    ),
  );
});

// ================= GET ONE (admin — for edit) =================

const getAdminNewsById = asyncHandler(async (req, res) => {
  const news = await News.findById(req.params.id);
  if (!news) throw new ApiError(404, "News article not found");
  return res.json(new ApiResponse(200, news, "News fetched successfully"));
});

// ================= UPDATE (admin) =================

const updateNews = asyncHandler(async (req, res) => {
  const news = await News.findById(req.params.id);
  if (!news) throw new ApiError(404, "News article not found");

  const {
    title,
    heading,
    slug,
    excerpt,
    content,
    tags,
    category,
    status,
    isFeatured,
    author,
    seoMetaTitle,
    seoMetaDescription,
    removeGalleryIds, // JSON array of public_ids the admin removed in the edit UI
  } = req.body;

  const newCover = req.files?.coverImage?.[0];
  const newGalleryFiles = req.files?.gallery || [];

  const uploadedForCleanupOnFailure = [];

  try {
    if (newCover) {
      const uploaded = await uploadImage(newCover);
      uploadedForCleanupOnFailure.push(uploaded.public_id);

      // old cover gets deleted only after the new one is confirmed uploaded
      const oldPublicId = news.coverImage?.public_id;
      news.coverImage = { url: uploaded.url, public_id: uploaded.public_id, alt: title || news.title };
      if (oldPublicId) await deleteFromCloudinary(oldPublicId);
    }

    if (removeGalleryIds) {
      const idsToRemove = new Set(
        Array.isArray(removeGalleryIds) ? removeGalleryIds : JSON.parse(removeGalleryIds || "[]"),
      );
      const toDelete = news.gallery.filter((img) => idsToRemove.has(img.public_id));
      news.gallery = news.gallery.filter((img) => !idsToRemove.has(img.public_id));
      await Promise.all(toDelete.map((img) => deleteFromCloudinary(img.public_id).catch(() => {})));
    }

    for (const file of newGalleryFiles) {
      const uploaded = await uploadImage(file);
      uploadedForCleanupOnFailure.push(uploaded.public_id);
      news.gallery.push({ url: uploaded.url, public_id: uploaded.public_id, alt: title || news.title });
    }

    if (title !== undefined) news.title = title;
    if (heading !== undefined) news.heading = heading;
    if (excerpt !== undefined) news.excerpt = excerpt;
    if (content !== undefined) news.content = content;
    if (category !== undefined) news.category = category;
    if (author !== undefined) news.author = author;
    if (tags !== undefined) {
      news.tags = Array.isArray(tags) ? tags : typeof tags === "string" ? tags.split(",") : [];
    }
    if (isFeatured !== undefined) news.isFeatured = isFeatured === true || isFeatured === "true";

    if (seoMetaTitle !== undefined || seoMetaDescription !== undefined) {
      news.seo = {
        metaTitle: seoMetaTitle !== undefined ? seoMetaTitle : news.seo?.metaTitle || "",
        metaDescription:
          seoMetaDescription !== undefined ? seoMetaDescription : news.seo?.metaDescription || "",
      };
    }

    if (status !== undefined) {
      if (!News.NEWS_STATUS.includes(status)) {
        throw new ApiError(400, `status must be one of: ${News.NEWS_STATUS.join(", ")}`);
      }
      const wasPublished = news.status === "published";
      news.status = status;
      if (status === "published" && !wasPublished) news.publishedAt = new Date();
    }

    if (slug !== undefined && slug !== news.slug) {
      news.slug = await resolveUniqueSlug({ raw: slug, fallback: title || news.title, excludeId: news._id });
    }

    await news.save();

    return res.json(new ApiResponse(200, news, "News updated successfully"));
  } catch (err) {
    await Promise.all(
      uploadedForCleanupOnFailure.map((id) => deleteFromCloudinary(id).catch(() => {})),
    );
    throw err;
  }
});

// ================= DELETE (admin) =================

const deleteNews = asyncHandler(async (req, res) => {
  const news = await News.findById(req.params.id);
  if (!news) throw new ApiError(404, "News article not found");

  const allImages = [news.coverImage, ...(news.gallery || [])].filter(Boolean);
  await Promise.all(allImages.map((img) => deleteFromCloudinary(img.public_id).catch(() => {})));

  await news.deleteOne();

  return res.json(new ApiResponse(200, null, "News deleted successfully"));
});

// ================= REORDER (admin — drag-and-drop) =================
// Body: { items: [{ id, order }, ...] } — only the items that actually
// moved need to be sent; a bulkWrite keeps this to a single round trip
// regardless of how many cards were reordered.

const reorderNews = asyncHandler(async (req, res) => {
  const { items } = req.body;

  if (!Array.isArray(items) || !items.length) {
    throw new ApiError(400, "items must be a non-empty array of { id, order }");
  }

  if (items.length > 500) {
    throw new ApiError(400, "Too many items in a single reorder request");
  }

  const invalid = items.find(
    (i) => !i.id || !mongoose.Types.ObjectId.isValid(i.id) || typeof i.order !== "number",
  );
  if (invalid) throw new ApiError(400, "Each item needs a valid id and a numeric order");

  const bulkOps = items.map((i) => ({
    updateOne: { filter: { _id: i.id }, update: { $set: { order: i.order } } },
  }));

  await News.bulkWrite(bulkOps);

  return res.json(new ApiResponse(200, null, "Order updated successfully"));
});

// ================= STATUS SHORTCUT (admin — publish/unpublish/archive) =================

const updateNewsStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!News.NEWS_STATUS.includes(status)) {
    throw new ApiError(400, `status must be one of: ${News.NEWS_STATUS.join(", ")}`);
  }

  const news = await News.findById(req.params.id);
  if (!news) throw new ApiError(404, "News article not found");

  const wasPublished = news.status === "published";
  news.status = status;
  if (status === "published" && !wasPublished) news.publishedAt = new Date();

  await news.save();

  return res.json(new ApiResponse(200, news, `News marked as ${status}`));
});

module.exports = {
  createNews,
  getPublicNews,
  getPublicNewsBySlug,
  getAdminNewsList,
  getAdminNewsById,
  updateNews,
  deleteNews,
  reorderNews,
  updateNewsStatus,
};
