const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const allowRoles = require("../middlewares/roleMiddleware");
const { setLeaveQuota, getLeaveQuota } = require("../controllers/leaveQuotaController");

router.post("/", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL"), setLeaveQuota);
router.get("/:teacherId/:year", authMiddleware, getLeaveQuota);

module.exports = router;