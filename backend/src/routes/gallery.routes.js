const express = require("express");
const router = express.Router();

const {
  createGallery,
  getGalleries,
  getGallery,
  getPublicGallery,
  updateGallery,
  deleteGallery,
} = require("../controllers/gallery.controller");

const authMiddleware = require("../middlewares/authMiddleware");
const allowRoles = require("../middlewares/roleMiddleware");

// PUBLIC — used by the embedded preview widget + the "View All" page
router.get("/public/:slug", getPublicGallery);

// ADMIN
router.get("/", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN", "EDITOR"), getGalleries);
router.get("/:id", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN", "EDITOR"), getGallery);
router.post("/", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN", "EDITOR"), createGallery);
router.put("/:id", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN", "EDITOR"), updateGallery);
router.delete("/:id", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN"), deleteGallery);

module.exports = router;
