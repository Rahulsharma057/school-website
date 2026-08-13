const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const allowRoles = require("../middlewares/roleMiddleware");
const { addAdjustment, getAdjustments } = require("../controllers/salaryAdjustmentController");

router.post("/", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL"), addAdjustment);
router.get("/:salaryId", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL"), getAdjustments);

module.exports = router;