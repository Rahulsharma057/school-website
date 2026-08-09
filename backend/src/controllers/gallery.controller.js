const Gallery = require("../models/Gallery");
const GalleryImage = require("../models/GalleryImage");

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

const VALID_LAYOUT_TYPES = ["grid", "masonry", "carousel"];
const VALID_COLUMNS = [2, 3, 4, 5, 6];

const normalizeLayout = (layout = {}, fallback = {}) => {
  const type = VALID_LAYOUT_TYPES.includes(layout.type) ? layout.type : fallback.type || "grid";
  const columns = VALID_COLUMNS.includes(Number(layout.columns))
    ? Number(layout.columns)
    : fallback.columns || 4;

  return {
    type,
    columns,
    gap: layout.gap !== undefined ? Number(layout.gap) : fallback.gap ?? 12,
    rounded: layout.rounded !== undefined ? Boolean(layout.rounded) : fallback.rounded ?? true,
  };
};

const resolveUniqueSlug = async ({ raw, fallback, excludeId }) => {
  const finalSlug = slugify(raw || fallback);

  if (!finalSlug) {
    throw new ApiError(
      400,
      "Could not generate a valid slug from the title — please include at least one letter or number",
    );
  }

  const query = { slug: finalSlug };
  if (excludeId) query._id = { $ne: excludeId };

  const duplicate = await Gallery.findOne(query).lean();
  if (duplicate) {
    throw new ApiError(400, "A gallery with this slug already exists");
  }

  return finalSlug;
};

// ================= CREATE =================

const createGallery = asyncHandler(async (req, res) => {
  const {
    title,
    slug,
    heading,
    subheading,
    description,
    layout,
    previewCount,
    viewAllEnabled,
    status,
  } = req.body;

  if (!title?.trim()) {
    throw new ApiError(400, "Title is required");
  }

  const finalSlug = await resolveUniqueSlug({ raw: slug, fallback: title });

  const gallery = await Gallery.create({
    title,
    slug: finalSlug,
    heading: heading || "",
    subheading: subheading || "",
    description: description || "",
    layout: normalizeLayout(layout),
    previewCount: previewCount || 8,
    viewAllEnabled: viewAllEnabled !== undefined ? viewAllEnabled : true,
    status: status !== undefined ? status : true,
  });

  return res.status(201).json(new ApiResponse(201, gallery, "Gallery created successfully"));
});

// ================= LIST (admin) =================

const getGalleries = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const search = req.query.search || "";

  const filter = search
    ? {
        $or: [
          { title: { $regex: search, $options: "i" } },
          { slug: { $regex: search, $options: "i" } },
        ],
      }
    : {};

  const total = await Gallery.countDocuments(filter);

  const galleries = await Gallery.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  // Image counts are fetched in one aggregation rather than N queries —
  // keeps the admin list fast even with many galleries.
  const galleryIds = galleries.map((g) => g._id);
  const counts = await GalleryImage.aggregate([
    { $match: { galleryId: { $in: galleryIds } } },
    { $group: { _id: "$galleryId", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));

  const data = galleries.map((g) => ({ ...g, imageCount: countMap.get(String(g._id)) || 0 }));

  return res.json(
    new ApiResponse(
      200,
      { data, total, page, limit, totalPages: Math.ceil(total / limit) },
      "Galleries fetched successfully",
    ),
  );
});

// ================= GET ONE (admin, for edit) =================

const getGallery = asyncHandler(async (req, res) => {
  const gallery = await Gallery.findById(req.params.id);

  if (!gallery) throw new ApiError(404, "Gallery not found");

  return res.json(new ApiResponse(200, gallery, "Gallery fetched successfully"));
});

// ================= PUBLIC (used by the preview widget + "View All" page) =================

const getPublicGallery = asyncHandler(async (req, res) => {
  const gallery = await Gallery.findOne({ slug: req.params.slug, status: true }).lean();

  if (!gallery) throw new ApiError(404, "Gallery not found");

  return res.json(new ApiResponse(200, gallery, "Gallery fetched successfully"));
});

// ================= UPDATE =================

const updateGallery = asyncHandler(async (req, res) => {
  const gallery = await Gallery.findById(req.params.id);

  if (!gallery) throw new ApiError(404, "Gallery not found");

  const {
    title,
    slug,
    heading,
    subheading,
    description,
    layout,
    previewCount,
    viewAllEnabled,
    status,
  } = req.body;

  if (title !== undefined) gallery.title = title;
  if (heading !== undefined) gallery.heading = heading;
  if (subheading !== undefined) gallery.subheading = subheading;
  if (description !== undefined) gallery.description = description;
  if (previewCount !== undefined) gallery.previewCount = previewCount;
  if (viewAllEnabled !== undefined) gallery.viewAllEnabled = viewAllEnabled;
  if (status !== undefined) gallery.status = status;
  if (layout !== undefined) gallery.layout = normalizeLayout(layout, gallery.layout);

  if (slug !== undefined || title !== undefined) {
    const finalSlug = await resolveUniqueSlug({
      raw: slug,
      fallback: title || gallery.title,
      excludeId: gallery._id,
    });

    if (finalSlug !== gallery.slug) gallery.slug = finalSlug;
  }

  await gallery.save();

  return res.json(new ApiResponse(200, gallery, "Gallery updated successfully"));
});

// ================= DELETE (also cleans up every image + Cloudinary file) =================

const deleteGallery = asyncHandler(async (req, res) => {
  const gallery = await Gallery.findById(req.params.id);

  if (!gallery) throw new ApiError(404, "Gallery not found");

  const images = await GalleryImage.find({ galleryId: gallery._id });

  for (const image of images) {
    if (image.public_id) {
      await deleteFromCloudinary(image.public_id);
    }
  }

  if (gallery.coverImage?.public_id) {
    await deleteFromCloudinary(gallery.coverImage.public_id);
  }

  await GalleryImage.deleteMany({ galleryId: gallery._id });
  await gallery.deleteOne();

  return res.json(new ApiResponse(200, null, "Gallery and its images deleted successfully"));
});

module.exports = {
  createGallery,
  getGalleries,
  getGallery,
  getPublicGallery,
  updateGallery,
  deleteGallery,
};
