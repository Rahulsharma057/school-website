const express = require("express");
const router = express.Router();

const {
  createForm,
  getForms,
  getForm,
  getPublicForm,
  getFormByTableSlug,
  updateForm,
  deleteForm,
} = require("../controllers/form.controller");

const authMiddleware = require("../middlewares/authMiddleware");
const allowRoles = require("../middlewares/roleMiddleware");
const softAuth = require("../middlewares/softAuth");
const checkFormAccess = require("../middlewares/checkFormAccess");

// PUBLIC — open unless the form's own accessControl.viewRoles restricts it
router.get(
  "/public/:slug",
  softAuth,
  checkFormAccess({
    accessKey: "viewRoles",
    lookupField: "slug",
    lookupBy: "slug",
    extraFilter: { status: true },
  }),
  getPublicForm,
);

// DYNAMIC ADMIN TABLE — always requires login, then a per-form role check
router.get(
  "/table/:tableSlug",
  authMiddleware,
  checkFormAccess({
    accessKey: "tableViewRoles",
    lookupField: "tableSlug",
    lookupBy: "adminTableSlug",
  }),
  getFormByTableSlug,
);

// ADMIN — form management (roles here = "who can build forms")
router.get("/", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN", "EDITOR"), getForms);
router.get("/:id", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN", "EDITOR"), getForm);
router.post("/", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN", "EDITOR"), createForm);
router.put("/:id", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN", "EDITOR"), updateForm);
router.delete("/:id", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN"), deleteForm);

module.exports = router;