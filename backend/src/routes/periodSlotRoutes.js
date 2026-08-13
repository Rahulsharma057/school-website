const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const allowRoles = require("../middlewares/roleMiddleware");
const {
  createPeriodSlot, getAllPeriodSlots, updatePeriodSlot, deletePeriodSlot,
} = require("../controllers/periodSlotController");

const staffOnly = allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL");

router.post("/", authMiddleware, staffOnly, createPeriodSlot);
router.get("/", authMiddleware, getAllPeriodSlots); // sabko dikh sakta hai (staff+teacher+student)
router.patch("/:id", authMiddleware, staffOnly, updatePeriodSlot);
router.delete("/:id", authMiddleware, staffOnly, deletePeriodSlot);

module.exports = router;