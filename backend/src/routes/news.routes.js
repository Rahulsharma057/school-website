const express = require("express");
const router = express.Router();

const {
  createNews,
  getPublicNews,
  getPublicNewsBySlug,
  getAdminNewsList,
  getAdminNewsById,
  updateNews,
  deleteNews,
  reorderNews,
  updateNewsStatus,
} = require("../controllers/news.controller");

const { newsUploadFields } = require("../middlewares/newsUpload");

const authMiddleware = require("../middlewares/authMiddleware");
const allowRoles = require("../middlewares/roleMiddleware");

// ======================================
// PUBLIC ROUTES — the embeddable NewsGrid widget and detail page use these
// ======================================
// NOTE: order matters — "/admin/..." must be registered before the public
// "/:slug" route below, otherwise Express treats "admin" as a slug.

router.get("/", getPublicNews); // GET /news?limit=6&page=1&tag=sports&featured=true

// ======================================
// ADMIN ROUTES
// ======================================

router.get(
  "/admin",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "EDITOR"),
  getAdminNewsList,
);

router.post(
  "/admin",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "EDITOR"),
  newsUploadFields,
  createNews,
);

router.patch(
  "/admin/reorder",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "EDITOR"),
  reorderNews,
);

router.get(
  "/admin/:id",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "EDITOR"),
  getAdminNewsById,
);

router.put(
  "/admin/:id",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "EDITOR"),
  newsUploadFields,
  updateNews,
);

router.patch(
  "/admin/:id/status",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "EDITOR"),
  updateNewsStatus,
);

router.delete(
  "/admin/:id",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN"),
  deleteNews,
);

// PUBLIC detail route — registered LAST so it never shadows "/admin/*"
router.get("/:slug", getPublicNewsBySlug);

module.exports = router;
