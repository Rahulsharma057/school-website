const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const allowRoles = require("../middlewares/roleMiddleware");

const {
  enterResult,
  getMyResults,
  getClassResults,
} = require("../controllers/resultController");

router.post(
  "/enter",
  authMiddleware,
  allowRoles("TEACHER", "SUPER_ADMIN", "ADMIN", "PRINCIPAL"),
  enterResult
);

router.get("/my-results", authMiddleware, allowRoles("STUDENT"), getMyResults);

router.get(
  "/exam/:examId",
  authMiddleware,
  allowRoles("TEACHER", "SUPER_ADMIN", "ADMIN", "PRINCIPAL"),
  getClassResults
);

module.exports = router;