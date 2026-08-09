const mongoose = require("mongoose");

const Gallery = require("../models/Gallery");
const GalleryImage = require("../models/GalleryImage");

const uploadToCloudinary = require("../utils/uploadToCloudinary");
const deleteFromCloudinary = require("../utils/deleteFromCloudinary");

const asyncHandler = require("../helpers/asyncHandler");
const ApiResponse = require("../helpers/ApiResponse");
const ApiError = require("../helpers/ApiError");

// ================= UPLOAD (admin — one or many files at once) =================

const uploadImages = asyncHandler(async (req, res) => {
  const { galleryId } = req.body;

  if (!galleryId || !mongoose.Types.ObjectId.isValid(galleryId)) {
    throw new ApiError(400, "A valid galleryId is required");
  }

  const gallery = await Gallery.findById(galleryId).lean();
  if (!gallery) throw new ApiError(404, "Gallery not found");

  if (!req.files?.length) {
    throw new ApiError(400, "At least one image is required");
  }

  // New images append after whatever's already there, in upload order.
  const lastImage = await GalleryImage.findOne({ galleryId }).sort({ order: -1 }).lean();
  let nextOrder = (lastImage?.order ?? -1) + 1;

  const created = [];

  for (const file of req.files) {
    const uploaded = await uploadToCloudinary(file);

    const image = await GalleryImage.create({
      galleryId,
      url: uploaded.url,
      public_id: uploaded.public_id,
      width: uploaded.width || 0,
      height: uploaded.height || 0,
      order: nextOrder++,
      uploadedBy: req.user?._id || null,
    });

    created.push(image);
  }

  return res
    .status(201)
    .json(new ApiResponse(201, created, `${created.length} image(s) uploaded successfully`));
});

// ================= LIST BY GALLERY (public — paginated, used by both the =================
// ================= preview widget (limit=previewCount) and the "View All" page) =====

const getImagesByGallery = asyncHandler(async (req, res) => {
  const { galleryId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(galleryId)) {
    throw new ApiError(400, "Invalid galleryId");
  }

  const page = Number(req.query.page || 1);
  const limit = Math.min(Number(req.query.limit || 20), 50); // hard ceiling so no one can request the whole gallery in one shot

  const filter = { galleryId };

  const total = await GalleryImage.countDocuments(filter);

  const data = await GalleryImage.find(filter)
    .sort({ order: 1, createdAt: 1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return res.json(
    new ApiResponse(
      200,
      { data, total, page, limit, totalPages: Math.ceil(total / limit) },
      "Images fetched successfully",
    ),
  );
});

// ================= REORDER (admin — drag-and-drop) =================
// Body: { galleryId, order: [{ id, order }, ...] } — one bulk write instead
// of N sequential saves, so dropping a tile in a 200-image gallery is still one request.

const reorderImages = asyncHandler(async (req, res) => {
  const { galleryId, order } = req.body;

  if (!galleryId || !mongoose.Types.ObjectId.isValid(galleryId)) {
    throw new ApiError(400, "A valid galleryId is required");
  }

  if (!Array.isArray(order) || !order.length) {
    throw new ApiError(400, "order must be a non-empty array of { id, order }");
  }

  const invalid = order.filter((o) => !mongoose.Types.ObjectId.isValid(o.id));
  if (invalid.length) {
    throw new ApiError(400, "order contains invalid id(s)");
  }

  const bulkOps = order.map(({ id, order: pos }) => ({
    updateOne: {
      filter: { _id: id, galleryId },
      update: { $set: { order: pos } },
    },
  }));

  const result = await GalleryImage.bulkWrite(bulkOps);

  return res.json(
    new ApiResponse(200, { modifiedCount: result.modifiedCount }, "Order updated successfully"),
  );
});

// ================= UPDATE (caption / alt text) =================

const updateImage = asyncHandler(async (req, res) => {
  const image = await GalleryImage.findById(req.params.id);

  if (!image) throw new ApiError(404, "Image not found");

  const { caption, altText } = req.body;

  if (caption !== undefined) image.caption = caption;
  if (altText !== undefined) image.altText = altText;

  await image.save();

  return res.json(new ApiResponse(200, image, "Image updated successfully"));
});

// ================= DELETE (single) =================

const deleteImage = asyncHandler(async (req, res) => {
  const image = await GalleryImage.findById(req.params.id);

  if (!image) throw new ApiError(404, "Image not found");

  if (image.public_id) {
    await deleteFromCloudinary(image.public_id);
  }

  await image.deleteOne();

  return res.json(new ApiResponse(200, null, "Image deleted successfully"));
});

// ================= BULK DELETE =================

const bulkDeleteImages = asyncHandler(async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || !ids.length) {
    throw new ApiError(400, "ids must be a non-empty array");
  }

  const invalidIds = ids.filter((id) => !mongoose.Types.ObjectId.isValid(id));
  if (invalidIds.length) {
    throw new ApiError(400, `Invalid id(s): ${invalidIds.join(", ")}`);
  }

  const images = await GalleryImage.find({ _id: { $in: ids } });

  for (const image of images) {
    if (image.public_id) {
      await deleteFromCloudinary(image.public_id);
    }
  }

  await GalleryImage.deleteMany({ _id: { $in: ids } });

  return res.json(
    new ApiResponse(200, { deletedCount: images.length }, "Images deleted successfully"),
  );
});

module.exports = {
  uploadImages,
  getImagesByGallery,
  reorderImages,
  updateImage,
  deleteImage,
  bulkDeleteImages,
};
