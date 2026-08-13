const express = require("express");
const router = express.Router();

const {
  getFooter, getPublicFooter,
  updateFooter,
  uploadLogo,
  removeLogo,
  resetFooter,
} = require("../controllers/footer.controller");

const upload = require("../middlewares/upload");

const authMiddleware = require("../middlewares/authMiddleware");
const allowRoles = require("../middlewares/roleMiddleware");

// PUBLIC — read is open, since the footer renders on every page of the
// public site and isn't sensitive data. The admin builder loads its
// current state from this same endpoint.
router.get("/", getFooter);
router.get("/public", getPublicFooter); 

router.put("/", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN", "EDITOR"), updateFooter);

router.post(
  "/logo",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "EDITOR"),
  upload.single("logo"),
  uploadLogo,
);

router.delete("/logo", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN", "EDITOR"), removeLogo);

router.post("/reset", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN"), resetFooter);

module.exports = router;
