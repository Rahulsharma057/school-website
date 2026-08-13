const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const allowRoles = require("../middlewares/roleMiddleware");

const {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
} = require("../controllers/classController");

router.post(
  "/",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL"),
  createClass
);

router.get(
  "/",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL", "TEACHER"),
  getAllClasses
);

router.get(
  "/:id",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL", "TEACHER"),
  getClassById
);

router.patch(
  "/:id",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL"),
  updateClass
);

router.delete(
  "/:id",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN"),
  deleteClass
);

module.exports = router;