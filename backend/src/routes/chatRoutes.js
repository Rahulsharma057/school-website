const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const allowRoles = require("../middlewares/roleMiddleware");

const {
  createGroup, getMyGroups, getAllGroups, toggleMediaUpload, deleteGroup, getMemberOptions,
} = require("../controllers/chatGroupController");

const { getMessages, sendMessage } = require("../controllers/chatMessageController");

const staffOnly = allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL");

// Groups
router.post("/groups", authMiddleware, staffOnly, createGroup);
router.get("/groups/my-groups", authMiddleware, getMyGroups); // sab roles
router.get("/groups", authMiddleware, staffOnly, getAllGroups);
router.get("/groups/member-options", authMiddleware, staffOnly, getMemberOptions);
router.patch("/groups/:id/media-toggle", authMiddleware, allowRoles("SUPER_ADMIN"), toggleMediaUpload);
router.delete("/groups/:id", authMiddleware, staffOnly, deleteGroup);

// Messages
router.get("/groups/:groupId/messages", authMiddleware, getMessages); // sab roles, access check andar
router.post("/groups/:groupId/messages", authMiddleware, sendMessage); // sab roles, access check andar

module.exports = router;