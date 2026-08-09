const express = require("express");
const router = express.Router();

const {
  createQuote,
  getQuotes,
  getQuote,
  getPublicQuotes,
  updateQuote,
  toggleQuoteStatus,
  reorderQuotes,
  deleteQuote,
} = require("../controllers/quote.controller");

const authMiddleware = require("../middlewares/authMiddleware");
const allowRoles = require("../middlewares/roleMiddleware");
const quoteUpload = require("../middlewares/quoteUpload");

// NOTE: route order matters — "/public" and "/reorder" must be
// registered BEFORE the generic "/:id" route, or Express will try to
// match "public"/"reorder" as an :id (same pattern as formEntry.routes.js).

// PUBLIC — the "quotes wall", paginated, only status:true quotes
router.get("/public", getPublicQuotes);

// ADMIN
router.get("/", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN", "EDITOR"), getQuotes);

router.post(
  "/",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "EDITOR"),
  quoteUpload.single("authorImage"),
  createQuote,
);

router.patch(
  "/reorder",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "EDITOR"),
  reorderQuotes,
);

router.get("/:id", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN", "EDITOR"), getQuote);

router.put(
  "/:id",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "EDITOR"),
  quoteUpload.single("authorImage"),
  updateQuote,
);

router.patch(
  "/:id/status",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "EDITOR"),
  toggleQuoteStatus,
);

router.delete("/:id", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN"), deleteQuote);

module.exports = router;
