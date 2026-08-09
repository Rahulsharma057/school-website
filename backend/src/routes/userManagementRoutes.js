const express = require("express");

const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");

const allowRoles = require("../middlewares/roleMiddleware");

const {
  getAllUsers,

  changeRole,

  changeStatus,deleteUser
} = require("../controllers/userManagementController");

router.get(
  "/",

  authMiddleware,

  allowRoles("SUPER_ADMIN"),

  getAllUsers,
);

router.patch(
  "/:id/role",

  authMiddleware,

  allowRoles("SUPER_ADMIN"),

  changeRole,
);

router.patch(
  "/:id/status",

  authMiddleware,

  allowRoles("SUPER_ADMIN"),

  changeStatus,
);

router.delete(
"/:id",
authMiddleware,
allowRoles("SUPER_ADMIN"),
deleteUser
);

module.exports = router;
