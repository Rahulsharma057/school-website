const express = require("express");

const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");

const allowRoles = require("../middlewares/roleMiddleware");

const { getProfile } = require("../controllers/userController");

// ==========================
// COMMON USER PROFILE
// STUDENT / TEACHER / ADMIN / PARENT
// ==========================

router.get("/profile", authMiddleware, getProfile);

// ==========================
// SUPER ADMIN DASHBOARD
// ONLY SUPER ADMIN + ADMIN
// ==========================

router.get(
  "/dashboard",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN"),
  (req, res) => {
    res.json({
      success: true,

      message: "Admin Dashboard Access",

      user: req.user,
    });
  },
);



module.exports = router;
