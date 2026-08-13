const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const allowRoles = require("../middlewares/roleMiddleware");
const {
  createTimetableEntry, updateTimetableEntry, deleteTimetableEntry,
  getClassTimetable, getMyTimetable, getMyClassTimetable,
} = require("../controllers/timetableController");

const staffOnly = allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL");

router.post("/", authMiddleware, staffOnly, createTimetableEntry);
router.patch("/:id", authMiddleware, staffOnly, updateTimetableEntry);
router.delete("/:id", authMiddleware, staffOnly, deleteTimetableEntry);

router.get("/class/:classId", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL", "TEACHER"), getClassTimetable);
router.get("/my-timetable", authMiddleware, allowRoles("TEACHER"), getMyTimetable);
router.get("/my-class-timetable", authMiddleware, allowRoles("STUDENT"), getMyClassTimetable);

module.exports = router;