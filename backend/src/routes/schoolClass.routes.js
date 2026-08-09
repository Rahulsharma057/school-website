const express = require("express");
const router = express.Router();

const {
  createSchoolClass,
  getSchoolClasses,
  updateSchoolClass,
  deleteSchoolClass,
} = require("../controllers/schoolClass.controller");

const authMiddleware = require("../middlewares/authMiddleware");
const allowRoles = require("../middlewares/roleMiddleware");

// Public/shared read — admin dropdowns + any public class filter
router.get("/", getSchoolClasses);

// Admin-only management
router.post("/", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN"), createSchoolClass);
router.put("/:id", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN"), updateSchoolClass);
router.delete("/:id", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN"), deleteSchoolClass);

module.exports = router;