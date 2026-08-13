const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const allowRoles = require("../middlewares/roleMiddleware");
const { addHoliday, getHolidaysByYear, deleteHoliday } = require("../controllers/holidayController");

router.post("/", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL"), addHoliday);
router.get("/:year", authMiddleware, getHolidaysByYear);
router.delete("/:id", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL"), deleteHoliday);

module.exports = router;