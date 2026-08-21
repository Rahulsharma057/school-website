const express = require("express");

const router = express.Router();

const {
  createSyllabus,
  getSyllabi,
  getSyllabus,
  getSyllabusByClass,
  getSubjectsByClass,
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

const checkSyllabusAccess =
  checkResourceAccess(Syllabus);

// =====================================================
// PUBLIC
// =====================================================

// GET /api/v1/syllabus/public/:slug

router.get(
  "/public/:slug",
  softAuth,
  checkSyllabusAccess({
    accessKey: "viewRoles",
    lookupField: "slug",
    lookupBy: "slug",
    extraFilter: {
      status: true,
    },
  }),
  getPublicSyllabus
);

// =====================================================
// PUBLIC PLACEMENT
// =====================================================

// GET /api/v1/syllabus/placement/homepage

router.get(
  "/placement/:placement",
  getPublicSyllabiByPlacement
);

// =====================================================
// ADMIN - LIST
// =====================================================

// GET /api/v1/syllabus

router.get(
  "/",
  authMiddleware,
  allowRoles(
    "SUPER_ADMIN",
    "ADMIN",
    "EDITOR"
  ),
  getSyllabi
);

// =====================================================
// GET SYLLABUS BY CLASS
// IMPORTANT FOR EXAM MODULE
// =====================================================

// GET /api/v1/syllabus/by-class?classId=xxx&academicYear=2026-2027

router.get(
  "/by-class",
  authMiddleware,
  allowRoles(
    "SUPER_ADMIN",
    "ADMIN",
    "PRINCIPAL",
    "TEACHER"
  ),
  getSyllabusByClass
);

// =====================================================
// GET SUBJECTS BY CLASS
// IMPORTANT FOR EXAM FORM
// =====================================================

// GET /api/v1/syllabus/subjects?classId=xxx&academicYear=2026-2027

router.get(
  "/subjects",
  authMiddleware,
  allowRoles(
    "SUPER_ADMIN",
    "ADMIN",
    "PRINCIPAL",
    "TEACHER"
  ),
  getSubjectsByClass
);

// =====================================================
// ADMIN - CREATE
// =====================================================

router.post(
  "/",
  authMiddleware,
  allowRoles(
    "SUPER_ADMIN",
    "ADMIN",
    "EDITOR"
  ),
  createSyllabus
);

// =====================================================
// ADMIN - GET ONE
// =====================================================

// MUST COME AFTER /by-class AND /subjects

router.get(
  "/:id",
  authMiddleware,
  allowRoles(
    "SUPER_ADMIN",
    "ADMIN",
    "EDITOR"
  ),
  getSyllabus
);

// =====================================================
// ADMIN - UPDATE
// =====================================================

router.put(
  "/:id",
  authMiddleware,
  allowRoles(
    "SUPER_ADMIN",
    "ADMIN",
    "EDITOR"
  ),
  updateSyllabus
);

// =====================================================
// ADMIN - DELETE
// =====================================================

router.delete(
  "/:id",
  authMiddleware,
  allowRoles(
    "SUPER_ADMIN",
    "ADMIN"
  ),
  deleteSyllabus
);

module.exports = router;