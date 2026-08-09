const express = require("express");
const router = express.Router();

const {
  createAnnouncement,
  getAnnouncements,
  getAnnouncement,
  getPublicTicker,
  getPublicAnnouncementsList,
  getPublicAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} = require("../controllers/announcement.controller");

const upload = require("../middlewares/upload");
const authMiddleware = require("../middlewares/authMiddleware");
const allowRoles = require("../middlewares/roleMiddleware");
const softAuth = require("../middlewares/softAuth");
const checkResourceAccess = require("../middlewares/checkResourceAccess");
const Announcement = require("../models/Announcement");

const attachmentUpload = upload.single("attachment");
const checkAnnouncementAccess = checkResourceAccess(Announcement);

// PUBLIC — ticker feed (route BEFORE "/public/:slug" isn't needed since
// paths differ, but kept together for readability)
router.get("/ticker", getPublicTicker);

router.get(
  "/public/:slug",
  softAuth,
  checkAnnouncementAccess({
    accessKey: "viewRoles",
    lookupField: "slug",
    lookupBy: "slug",
  }),
  getPublicAnnouncement,
);
router.get("/ticker", getPublicTicker);
router.get("/public-list", getPublicAnnouncementsList); 
// ADMIN
router.get("/", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN", "EDITOR"), getAnnouncements);
router.get("/:id", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN", "EDITOR"), getAnnouncement);

router.post(
  "/",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "EDITOR"),
  attachmentUpload,
  createAnnouncement,
);

router.put(
  "/:id",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "EDITOR"),
  attachmentUpload,
  updateAnnouncement,
);

router.delete("/:id", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN"), deleteAnnouncement);

module.exports = router;