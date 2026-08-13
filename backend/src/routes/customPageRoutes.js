const express = require("express");

const router = express.Router();

const {
  createPage,
  deletePage,
  getPage,
  getPages,
  getPublicPage,
  getSitemapData,
  getMediaLibrary,
  updatePage,
  duplicatePage,
  bulkAction,
  updateStatus,
} = require("../controllers/customPageController");

const upload = require("../middlewares/upload");

const authMiddleware = require("../middlewares/authMiddleware");

const allowRoles = require("../middlewares/roleMiddleware");

// ======================================
// PUBLIC ROUTES
// ======================================

// Dynamic Public Page
router.get("/public/:slug", getPublicPage);

// FIX: NEW — public, minimal, used by app/sitemap.js. Registered before
// "/:id" so Express doesn't treat "sitemap-data" as an :id.
router.get("/sitemap-data", getSitemapData);

// ======================================
// ADMIN ROUTES
// ======================================

// Get All Pages

router.get(
  "/",
  authMiddleware,

  allowRoles("SUPER_ADMIN", "ADMIN", "EDITOR"),

  getPages,
);

// FIX: NEW — Bulk publish/unpublish/delete. Registered before "/:id" for
// the same reason as sitemap-data above.
router.patch(
  "/bulk",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN"),
  bulkAction,
);

// FIX: NEW — Media library (list previously-uploaded images for reuse).
router.get(
  "/media-library",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "EDITOR"),
  getMediaLibrary,
);

// Get Single Page

router.get(
  "/:id",

  authMiddleware,

  allowRoles("SUPER_ADMIN", "ADMIN", "EDITOR"),

  getPage,
);

// ======================================
// IMAGE UPLOAD CONFIG
// ======================================

const pageUpload = upload.fields([
  // old cover image

  {
    name: "coverImage",
    maxCount: 1,
  },

  // old gallery

  {
    name: "gallery",
    maxCount: 30,
  },

  // page builder section images

  {
    name: "sectionImages",
    maxCount: 50,
  },
]);

// ======================================
// CREATE PAGE
// ======================================

router.post(
  "/",

  authMiddleware,

  allowRoles("SUPER_ADMIN", "ADMIN", "EDITOR"),

  pageUpload,

  createPage,
);

// ======================================
// UPDATE PAGE
// ======================================

router.put(
  "/:id",

  authMiddleware,

  allowRoles("SUPER_ADMIN", "ADMIN", "EDITOR"),

  pageUpload,

  updatePage,
);

// ======================================
// DUPLICATE PAGE (FIX: NEW)
// ======================================

router.post(
  "/:id/duplicate",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "EDITOR"),
  duplicatePage,
);

// ======================================
// UPDATE STATUS
// ======================================

router.patch(
  "/:id/status",

  authMiddleware,

  allowRoles("SUPER_ADMIN", "ADMIN"),

  updateStatus,
);

// ======================================
// DELETE PAGE
// ======================================

router.delete(
  "/:id",

  authMiddleware,

  allowRoles("SUPER_ADMIN", "ADMIN"),

  deletePage,
);

module.exports = router;
