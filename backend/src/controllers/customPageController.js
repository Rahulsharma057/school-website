const mongoose = require("mongoose");

const CustomPage = require("../models/CustomPage");

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

const formatKeywords = (keywords = "") => {
  if (Array.isArray(keywords)) {
    return keywords;
  }

  return keywords
    ? keywords
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
};

const parseJsonArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const parseJsonObject = (value) => {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value;

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

// ================= SECTION IMAGE HYDRATION =================

const hydrateImageRef = (imgRef, uploaded) => {
  if (!imgRef) return imgRef;

  if (typeof imgRef.__localFile === "number") {
    const file = uploaded[imgRef.__localFile];

    if (!file) return null;

    return {
      url: file.url,
      public_id: file.public_id,
      alt: imgRef.alt || "",
      width: file.width,
      height: file.height,
      objectFit: imgRef.objectFit || "cover",
      position: imgRef.position || "center",
      borderRadius: Number(imgRef.borderRadius || 0),
    };
  }

  return imgRef;
};

const hydrateSections = (sections, uploaded) =>
  sections.map((section) => {
    const next = { ...section };

    if (next.image) next.image = hydrateImageRef(next.image, uploaded);
    if (next.image2) next.image2 = hydrateImageRef(next.image2, uploaded);
    if (next.backgroundImage) next.backgroundImage = hydrateImageRef(next.backgroundImage, uploaded);

    if (Array.isArray(next.images)) {
      next.images = next.images.map((img) => hydrateImageRef(img, uploaded));
    }

    if (Array.isArray(next.cardItems)) {
      next.cardItems = next.cardItems.map((card) => ({
        ...card,
        image: card.image ? hydrateImageRef(card.image, uploaded) : card.image,
      }));
    }

    return next;
  });

const collectSectionPublicIds = (sections = []) => {
  const ids = new Set();

  for (const s of sections) {
    if (s.image?.public_id) ids.add(s.image.public_id);
    if (s.image2?.public_id) ids.add(s.image2.public_id);
    if (s.backgroundImage?.public_id) ids.add(s.backgroundImage.public_id);

    for (const img of s.images || []) {
      if (img.public_id) ids.add(img.public_id);
    }

    for (const card of s.cardItems || []) {
      if (card.image?.public_id) ids.add(card.image.public_id);
    }
  }

  return ids;
};

const deletePageImages = async (page) => {
  if (page.coverImage?.public_id) {
    await deleteFromCloudinary(page.coverImage.public_id);
  }

  if (page.gallery?.length) {
    for (const img of page.gallery) {
      if (img.public_id) await deleteFromCloudinary(img.public_id);
    }
  }

  const sectionIds = collectSectionPublicIds(page.sections);

  for (const id of sectionIds) {
    await deleteFromCloudinary(id);
  }
};

// ================= VALIDATION =================

const VALID_PAGE_WIDTHS = ["small", "medium", "large", "full"];

const validatePageInput = (body) => {
  if (!body.title || !body.title.trim()) {
    throw new ApiError(400, "Title is required");
  }

  if (body.route && !/^\/[a-zA-Z0-9\-_/]*$/.test(body.route)) {
    throw new ApiError(
      400,
      "Route must start with / and contain only letters, numbers, - or _",
    );
  }

  if (body.buttonText && !body.buttonLink) {
    throw new ApiError(400, "Button Link is required when Button Text is set");
  }

  if (body.pageWidth && !VALID_PAGE_WIDTHS.includes(body.pageWidth)) {
    throw new ApiError(400, `pageWidth must be one of: ${VALID_PAGE_WIDTHS.join(", ")}`);
  }
};

// FIX: NEW — shared by duplicatePage; auto-suffixes on collision instead
// of rejecting, since "Page Title (Copy)" colliding with an existing
// "-copy" slug is a very normal thing to happen more than once.
const resolveUniqueSlugWithSuffix = async ({ base, field }) => {
  let candidate = base;
  let suffix = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists = await CustomPage.exists({ [field]: candidate });
    if (!exists) return candidate;
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
};

// ================= CREATE =================

const createPage = asyncHandler(async (req, res) => {
  const body = req.body;

  validatePageInput(body);

  const slug = slugify(body.slug || body.title);

  const route = body.route
    ? body.route.startsWith("/")
      ? body.route
      : `/${body.route}`
    : `/${slug}`;

  const exists = await CustomPage.findOne({
    $or: [{ slug }, { route }],
  }).lean();

  if (exists) {
    throw new ApiError(400, "Slug or Route already exists.");
  }

  let coverImage = {};

  if (req.files?.coverImage?.[0]) {
    const uploaded = await uploadToCloudinary(req.files.coverImage[0]);

    coverImage = {
      ...uploaded,
      alt: body.coverImageAlt || "",
      objectFit: body.coverImageObjectFit || "cover",
      position: body.coverImagePosition || "center",
      borderRadius: Number(body.coverImageBorderRadius || 0),
    };
  }

  let gallery = [];

  if (req.files?.gallery?.length) {
    gallery = await Promise.all(
      req.files.gallery.map(async (file) => {
        const uploaded = await uploadToCloudinary(file);

        return {
          ...uploaded,
          alt: body.galleryAlt || "",
          objectFit: body.galleryObjectFit || "cover",
          position: body.galleryPosition || "center",
          borderRadius: Number(body.galleryBorderRadius || 0),
        };
      }),
    );
  }

  let sectionUploads = [];

  if (req.files?.sectionImages?.length) {
    sectionUploads = await Promise.all(
      req.files.sectionImages.map((file) => uploadToCloudinary(file)),
    );
  }

  const sections = hydrateSections(
    parseJsonArray(body.sections),
    sectionUploads,
  );

  const page = await CustomPage.create({
    title: body.title,
    slug,
    route,
    shortDescription: body.shortDescription || "",
    content: body.content || "",
    coverImage,
    gallery,
    sections,
    header: parseJsonObject(body.header),
    buttonText: body.buttonText || "",
    buttonLink: body.buttonLink || "",
    seoTitle: body.seoTitle || "",
    seoDescription: body.seoDescription || "",
    keywords: formatKeywords(body.keywords),
    pageType: body.pageType || "General",
    pageWidth: body.pageWidth || "large",
    featured: body.featured === "true" || body.featured === true,
    showInNavbar: body.showInNavbar === "true" || body.showInNavbar === true,
    showInFooter: body.showInFooter === "true" || body.showInFooter === true,
    navbarOrder: Number(body.navbarOrder || 0),
    footerOrder: Number(body.footerOrder || 0),
    status: body.status !== undefined ? body.status !== "false" : true,
    order: Number(body.order || 0),
  });

  return res
    .status(201)
    .json(new ApiResponse(201, page, "Page created successfully"));
});

// ================= GET ALL (fast, list view) =================

const getPages = asyncHandler(async (req, res) => {
  const pageNo = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const search = req.query.search || "";

  const filter = search
    ? {
        $or: [
          { title: { $regex: search, $options: "i" } },
          { slug: { $regex: search, $options: "i" } },
          { route: { $regex: search, $options: "i" } },
        ],
      }
    : {};

  const total = await CustomPage.countDocuments(filter);

  const data = await CustomPage.find(filter)
    .select("-content -seoDescription")
    .sort({ order: 1, createdAt: -1 })
    .skip((pageNo - 1) * limit)
    .limit(limit)
    .lean();

  return res.json(
    new ApiResponse(
      200,
      {
        data,
        total,
        page: pageNo,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      "Pages fetched successfully",
    ),
  );
});

// ================= GET ONE (full doc, for the edit form) =================

const getPage = asyncHandler(async (req, res) => {
  const page = await CustomPage.findById(req.params.id);

  if (!page) {
    throw new ApiError(404, "Page not found");
  }

  return res.json(new ApiResponse(200, page, "Page fetched successfully"));
});

// ================= PUBLIC (fast, read-only) =================

const getPublicPage = asyncHandler(async (req, res) => {
  const slug = req.params.slug;

  const page = await CustomPage.findOne({
    status: true,
    $or: [{ slug }, { route: `/${slug}` }],
  }).lean();

  if (!page) {
    throw new ApiError(404, "Page not found");
  }

  return res.json(
    new ApiResponse(200, page, "Public page fetched successfully"),
  );
});

// ================= SITEMAP DATA (public, minimal, no auth) =================
// FIX: NEW — feeds the frontend's app/sitemap.js (Next.js's native
// sitemap.xml generator). Deliberately returns only what a sitemap
// needs (route + last-modified) — not full documents — since this can
// be hit by crawlers/build processes.

const getSitemapData = asyncHandler(async (req, res) => {
  const pages = await CustomPage.find({ status: true })
    .select("route updatedAt")
    .lean();

  return res.json(new ApiResponse(200, pages, "Sitemap data fetched successfully"));
});

// ================= UPDATE =================

const updatePage = asyncHandler(async (req, res) => {
  const page = await CustomPage.findById(req.params.id);

  if (!page) {
    throw new ApiError(404, "Page not found");
  }

  validatePageInput(req.body);

  if (req.files?.coverImage?.[0]) {
    if (page.coverImage?.public_id) {
      await deleteFromCloudinary(page.coverImage.public_id);
    }

    const uploaded = await uploadToCloudinary(req.files.coverImage[0]);

    page.coverImage = {
      ...uploaded,
      alt: req.body.coverImageAlt || "",
      objectFit: req.body.coverImageObjectFit || "cover",
      position: req.body.coverImagePosition || "center",
      borderRadius: Number(req.body.coverImageBorderRadius || 0),
    };
  } else if (req.body.removeCoverImage === "true") {
    if (page.coverImage?.public_id) {
      await deleteFromCloudinary(page.coverImage.public_id);
    }

    page.coverImage = undefined;
  }

  const removeGalleryIds = new Set(parseJsonArray(req.body.removeGalleryIds));

  if (removeGalleryIds.size) {
    for (const img of page.gallery) {
      if (removeGalleryIds.has(img.public_id)) {
        await deleteFromCloudinary(img.public_id);
      }
    }

    page.gallery = page.gallery.filter(
      (img) => !removeGalleryIds.has(img.public_id),
    );
  }

  if (req.files?.gallery?.length) {
    const newGalleryImages = await Promise.all(
      req.files.gallery.map(async (file) => {
        const uploaded = await uploadToCloudinary(file);

        return {
          ...uploaded,
          alt: req.body.galleryAlt || "",
          objectFit: req.body.galleryObjectFit || "cover",
          position: req.body.galleryPosition || "center",
          borderRadius: Number(req.body.galleryBorderRadius || 0),
        };
      }),
    );

    page.gallery = [...page.gallery, ...newGalleryImages];
  }

  let sectionUploads = [];

  if (req.files?.sectionImages?.length) {
    sectionUploads = await Promise.all(
      req.files.sectionImages.map((file) => uploadToCloudinary(file)),
    );
  }

  if (req.body.sections) {
    const oldIds = collectSectionPublicIds(page.sections);

    const hydrated = hydrateSections(
      parseJsonArray(req.body.sections),
      sectionUploads,
    );

    const keptIds = collectSectionPublicIds(hydrated);

    for (const id of oldIds) {
      if (!keptIds.has(id)) {
        await deleteFromCloudinary(id);
      }
    }

    page.sections = hydrated;
  }

  if (req.body.header !== undefined) {
    page.header = parseJsonObject(req.body.header);
  }

  const {
    coverImageAlt,
    coverImageObjectFit,
    coverImagePosition,
    coverImageBorderRadius,
    galleryAlt,
    galleryObjectFit,
    galleryPosition,
    galleryBorderRadius,
    removeCoverImage,
    removeGalleryIds: _removeGalleryIds,
    sections,
    header: _header,
    keywords,
    slug: bodySlug,
    route: bodyRoute,
    ...rest
  } = req.body;

  Object.assign(page, rest);

  page.slug = slugify(bodySlug || rest.title || page.title);

  page.route = bodyRoute
    ? bodyRoute.startsWith("/")
      ? bodyRoute
      : `/${bodyRoute}`
    : `/${page.slug}`;

  page.keywords = formatKeywords(keywords);

  page.status =
    rest.status !== undefined ? rest.status !== "false" : page.status;

  const duplicate = await CustomPage.findOne({
    _id: { $ne: page._id },
    $or: [{ slug: page.slug }, { route: page.route }],
  }).lean();

  if (duplicate) {
    throw new ApiError(400, "Slug or Route already exists.");
  }

  await page.save();

  return res.json(new ApiResponse(200, page, "Page updated successfully"));
});

// ================= DUPLICATE (admin workflow) =================
// FIX: NEW — clones a page as a fresh draft: same title (+"(Copy)"),
// same sections/gallery/cover, but a new unique slug/route, status
// forced to draft, and navbar/footer visibility turned off so the
// duplicate never silently shows up twice in navigation.
//
// NOTE: this does NOT re-upload images — the duplicate's coverImage/
// gallery/section images point at the SAME Cloudinary assets as the
// original. That's intentional (instant, no re-upload cost), but it
// means deleting one of the two pages will delete images the other
// still references. If that's a problem, edit+replace the images on
// the duplicate before deleting the original.

const duplicatePage = asyncHandler(async (req, res) => {
  const original = await CustomPage.findById(req.params.id).lean();

  if (!original) {
    throw new ApiError(404, "Page not found");
  }

  const baseSlug = slugify(`${original.slug}-copy`);
  const baseRoute = `/${baseSlug}`;

  const newSlug = await resolveUniqueSlugWithSuffix({ base: baseSlug, field: "slug" });
  const newRoute = await resolveUniqueSlugWithSuffix({ base: baseRoute, field: "route" });

  const {
    _id,
    createdAt,
    updatedAt,
    __v,
    slug,
    route,
    title,
    ...rest
  } = original;

  const duplicate = await CustomPage.create({
    ...rest,
    title: `${title} (Copy)`,
    slug: newSlug,
    route: newRoute,
    status: false, // always starts as a draft — admin reviews before publishing
    showInNavbar: false,
    showInFooter: false,
  });

  return res.status(201).json(new ApiResponse(201, duplicate, "Page duplicated successfully"));
});

// ================= BULK ACTIONS (admin workflow) =================
// FIX: NEW — body: { ids: [...], action: "publish" | "unpublish" | "delete" }

const BULK_ACTIONS = ["publish", "unpublish", "delete"];
const MAX_BULK_IDS = 200;

const bulkAction = asyncHandler(async (req, res) => {
  const { ids, action } = req.body;

  if (!Array.isArray(ids) || !ids.length) {
    throw new ApiError(400, "ids must be a non-empty array");
  }

  if (ids.length > MAX_BULK_IDS) {
    throw new ApiError(400, `You can only act on up to ${MAX_BULK_IDS} pages at once`);
  }

  if (!BULK_ACTIONS.includes(action)) {
    throw new ApiError(400, `action must be one of: ${BULK_ACTIONS.join(", ")}`);
  }

  const invalidIds = ids.filter((id) => !mongoose.Types.ObjectId.isValid(id));

  if (invalidIds.length) {
    throw new ApiError(400, `Invalid id(s): ${invalidIds.join(", ")}`);
  }

  if (action === "delete") {
    const pages = await CustomPage.find({ _id: { $in: ids } });

    for (const page of pages) {
      await deletePageImages(page);
    }

    await CustomPage.deleteMany({ _id: { $in: ids } });

    return res.json(
      new ApiResponse(200, { deletedCount: pages.length }, "Pages permanently deleted"),
    );
  }

  const result = await CustomPage.updateMany(
    { _id: { $in: ids } },
    { $set: { status: action === "publish" } },
  );

  return res.json(
    new ApiResponse(
      200,
      { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount },
      `Bulk ${action} applied`,
    ),
  );
});

// ================= DELETE =================

const deletePage = asyncHandler(async (req, res) => {
  const page = await CustomPage.findById(req.params.id);

  if (!page) {
    throw new ApiError(404, "Page not found");
  }

  await deletePageImages(page);

  await page.deleteOne();

  return res.json(new ApiResponse(200, null, "Page deleted successfully"));
});

// ================= STATUS =================

const updateStatus = asyncHandler(async (req, res) => {
  const page = await CustomPage.findById(req.params.id);

  if (!page) {
    throw new ApiError(404, "Page not found");
  }

  page.status = req.body.status;

  await page.save();

  return res.json(new ApiResponse(200, page, "Status updated successfully"));
});

module.exports = {
  createPage,
  getPages,
  getPage,
  getPublicPage,
  getSitemapData,
  updatePage,
  duplicatePage,
  bulkAction,
  deletePage,
  updateStatus,
};
