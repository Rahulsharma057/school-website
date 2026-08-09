const express = require("express");

const router = express.Router();

const {
  submitEntry,
  getEntries,
  getEntriesByTableSlug,
  getEntry,
  getEntryByEditToken,
  updateEntryByEditToken,
  updateEntry,
  updateEntryStatus,
  deleteEntry,
  restoreEntry,
  permanentlyDeleteEntry,
  duplicateEntry,
  bulkAction,
  exportEntriesCSV,
} = require("../controllers/formEntry.controller");

const upload = require("../middlewares/formEntryUpload");
const { submitLimiter, exportLimiter } = require("../middlewares/rateLimiter");

const authMiddleware = require("../middlewares/authMiddleware");
const allowRoles = require("../middlewares/roleMiddleware");
const softAuth = require("../middlewares/softAuth");
const checkFormAccess = require("../middlewares/checkFormAccess");

const entryUpload = upload.any();

// ======================================
// PUBLIC ROUTES
// ======================================

router.post("/", submitLimiter, softAuth, entryUpload, submitEntry);

// Self-service edit-by-token — must come before "/:id" so express
// doesn't try to match "edit" as an :id.
router.get("/edit/:token", submitLimiter, getEntryByEditToken);
router.put("/edit/:token", submitLimiter, entryUpload, updateEntryByEditToken);

// ======================================
// ADMIN ROUTES
// ======================================

router.get(
  "/table/:tableSlug",
  authMiddleware,
  checkFormAccess({
    accessKey: "tableViewRoles",
    lookupField: "tableSlug",
    lookupBy: "adminTableSlug",
  }),
  getEntriesByTableSlug,
);

router.get("/export", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN", "EDITOR"), exportLimiter, exportEntriesCSV);

router.get("/", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN", "EDITOR"), getEntries);

router.post("/bulk", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN"), bulkAction);

router.get("/:id", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN", "EDITOR"), getEntry);

router.patch("/:id", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN", "EDITOR"), entryUpload, updateEntry);

router.patch("/:id/status", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN"), updateEntryStatus);

router.post("/:id/duplicate", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN", "EDITOR"), duplicateEntry);

router.patch("/:id/restore", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN"), restoreEntry);

router.delete("/:id", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN"), deleteEntry);

router.delete("/:id/permanent", authMiddleware, allowRoles("SUPER_ADMIN"), permanentlyDeleteEntry);

module.exports = router;