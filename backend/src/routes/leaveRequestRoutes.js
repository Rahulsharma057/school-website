const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const allowRoles = require("../middlewares/roleMiddleware");
const {
  applyLeave,
  getMyLeaveRequests,
  getAllLeaveRequests,
  reviewLeaveRequest,
} = require("../controllers/leaveRequestController");

router.post("/apply", authMiddleware, allowRoles("TEACHER"), applyLeave);
router.get("/my-requests", authMiddleware, allowRoles("TEACHER"), getMyLeaveRequests);
router.get("/", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL"), getAllLeaveRequests);
router.patch("/:id/review", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN", "PRINCIPAL"), reviewLeaveRequest);

module.exports = router;