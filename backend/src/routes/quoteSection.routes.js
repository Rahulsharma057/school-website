const express = require("express");
const router = express.Router();

const {
  createSection,
  getSections,
  getSection,
  getPublicSection,
  updateSection,
  deleteSection,
} = require("../controllers/quoteSection.controller");

const authMiddleware = require("../middlewares/authMiddleware");
const allowRoles = require("../middlewares/roleMiddleware");

// PUBLIC — resolve a section's title/layout/category by its route slug.
// Registered before "/:id" so "public" is never swallowed as an :id.
router.get("/public/:slug", getPublicSection);

// ADMIN
router.get("/", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN", "EDITOR"), getSections);
router.post("/", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN", "EDITOR"), createSection);
router.get("/:id", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN", "EDITOR"), getSection);
router.put("/:id", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN", "EDITOR"), updateSection);
router.delete("/:id", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN"), deleteSection);

module.exports = router;
