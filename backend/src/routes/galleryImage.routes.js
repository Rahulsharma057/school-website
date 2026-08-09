const express = require("express");
const router = express.Router();

const {
  uploadImages,
  getImagesByGallery,
  reorderImages,
  updateImage,
  deleteImage,
  bulkDeleteImages,
} = require("../controllers/galleryImage.controller");

const upload = require("../middlewares/upload");

const authMiddleware = require("../middlewares/authMiddleware");
const allowRoles = require("../middlewares/roleMiddleware");

// Up to 30 images in a single upload request — matches the multi-select
// file input on the admin side.
const imagesUpload = upload.array("images", 30);

// ======================================
// PUBLIC — paginated fetch, used by both the embedded preview widget
// (limit=previewCount) and the "View All" page (real pagination/lazy load)
// ======================================

router.get("/gallery/:galleryId", getImagesByGallery);

// ======================================
// ADMIN
// NOTE: route order matters — "/reorder" and "/bulk" must be registered
// before "/:id", or Express will try to match them as an :id.
// ======================================

router.post(
  "/",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "EDITOR"),
  imagesUpload,
  uploadImages,
);

router.patch(
  "/reorder",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "EDITOR"),
  reorderImages,
);

router.delete(
  "/bulk",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN"),
  bulkDeleteImages,
);

router.patch(
  "/:id",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "EDITOR"),
  updateImage,
);

router.delete(
  "/:id",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN"),
  deleteImage,
);

module.exports = router;
