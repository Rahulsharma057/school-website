const express = require("express");
const router = express.Router();

const {
  createContactPage,
  getContactPages,
  getContactPage,
  getPublicContactPage,
  updateContactPage,
  deleteContactPage,
} = require("../controllers/contactPage.controller");

const authMiddleware = require("../middlewares/authMiddleware");
const allowRoles = require("../middlewares/roleMiddleware");
const softAuth = require("../middlewares/softAuth");
const checkResourceAccess = require("../middlewares/checkResourceAccess");
const ContactPage = require("../models/ContactPage");

const checkContactPageAccess = checkResourceAccess(ContactPage);

// PUBLIC
router.get(
  "/public/:slug",
  softAuth,
  checkContactPageAccess({
    accessKey: "viewRoles",
    lookupField: "slug",
    lookupBy: "slug",
    extraFilter: { status: true },
  }),
  getPublicContactPage,
);

// ADMIN
router.get("/", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN", "EDITOR"), getContactPages);
router.get("/:id", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN", "EDITOR"), getContactPage);
router.post("/", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN", "EDITOR"), createContactPage);
router.put("/:id", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN", "EDITOR"), updateContactPage);
router.delete("/:id", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN"), deleteContactPage);

module.exports = router;