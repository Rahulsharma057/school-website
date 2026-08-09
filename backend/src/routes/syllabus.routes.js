const express = require("express");
const router = express.Router();

const {
  createSyllabus,
  getSyllabi,
  getSyllabus,
  getPublicSyllabus,
  getPublicSyllabiByPlacement,
  updateSyllabus,
  deleteSyllabus,
} = require("../controllers/syllabus.controller");

const authMiddleware = require("../middlewares/authMiddleware");
const allowRoles = require("../middlewares/roleMiddleware");
const softAuth = require("../middlewares/softAuth");
const checkResourceAccess = require("../middlewares/checkResourceAccess");
const Syllabus = require("../models/Syllabus");

const checkSyllabusAccess = checkResourceAccess(Syllabus);

// PUBLIC
router.get(
  "/public/:slug",
  softAuth,
  checkSyllabusAccess({
    accessKey: "viewRoles",
    lookupField: "slug",
    lookupBy: "slug",
    extraFilter: { status: true },
  }),
  getPublicSyllabus,
);

router.get("/placement/:placement", getPublicSyllabiByPlacement);

// ADMIN
router.get("/", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN", "EDITOR"), getSyllabi);
router.get("/:id", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN", "EDITOR"), getSyllabus);
router.post("/", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN", "EDITOR"), createSyllabus);
router.put("/:id", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN", "EDITOR"), updateSyllabus);
router.delete("/:id", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN"), deleteSyllabus);

module.exports = router;