const express = require("express");

const router = express.Router();

const upload = require("../middlewares/upload");

const authMiddleware = require("../middlewares/authMiddleware");

const allowRoles = require("../middlewares/roleMiddleware");

const {
  createNavbar,
  getNavbar,
  getPublicNavbar,
  addMenu,
  updateMenu,
  deleteMenu,
  updateMenuOrder,
} = require("../controllers/navbarController");

// =======================================================
// PUBLIC ROUTES
// =======================================================

// Website Navbar
router.get("/public", getPublicNavbar);

// =======================================================
// ADMIN ROUTES
// =======================================================

// Get Navbar
router.get(
  "/",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN"),
  getNavbar
);

// Create / Update Navbar
router.put(
  "/",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN"),
  upload.fields([
    {
      name: "logo",
      maxCount: 1,
    },
    {
      name: "favicon",
      maxCount: 1,
    },
  ]),
  createNavbar
);

// =======================================================
// MENU MANAGEMENT
// =======================================================

// Add Menu
router.post(
  "/menu",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN"),
  addMenu
);

// Update Menu
router.put(
  "/menu/:index",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN"),
  updateMenu
);

// Delete Menu
router.delete(
  "/menu/:index",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN"),
  deleteMenu
);

// Update Menu Order
router.patch(
  "/menu/order",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN"),
  updateMenuOrder
);

module.exports = router;