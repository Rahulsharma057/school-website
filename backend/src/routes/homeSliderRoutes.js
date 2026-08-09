const express = require("express");

const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");

const allowRoles = require("../middlewares/roleMiddleware");

const upload = require("../middlewares/upload");

const {
  createSlider,

  getSliders,

  getPublicSliders,

  getSlider,

  updateSlider,

  updateSliderStatus,

  deleteSlider,
} = require("../controllers/homeSliderController");

// =========================
// PUBLIC WEBSITE
// =========================

router.get("/public", getPublicSliders);

// =========================
// ADMIN PANEL
// =========================

// GET ALL SLIDERS

router.get(
  "/",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "EDITOR"),
  getSliders,
);

// CREATE SLIDER

router.post(
  "/",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "EDITOR"),
  upload.single("image"),
  createSlider,
);

// GET SINGLE SLIDER

router.get(
  "/:id",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "EDITOR"),
  getSlider,
);

// UPDATE SLIDER

router.put(
  "/:id",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "EDITOR"),
  upload.single("image"),
  updateSlider,
);

// UPDATE STATUS

router.patch(
  "/:id/status",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN"),
  updateSliderStatus,
);

// DELETE SLIDER

router.delete(
  "/:id",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN"),
  deleteSlider,
);

module.exports = router;
