const express = require("express");
const router = express.Router();

const {
  collectPayment,
  getPaymentHistory,
  getAllPayments,
  getReceiptByNumber,
} = require("../controllers/feePaymentController");

const authMiddleware = require("../middlewares/authMiddleware");
const allowRoles = require("../middlewares/roleMiddleware");

// Registered before "/:id/..." dynamic segments so express doesn't
// confuse "all" or "receipt" for a studentFee :id.
router.get(
  "/all",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "ACCOUNTANT"),
  getAllPayments,
);
router.get(
  "/receipt/:receiptNumber",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "TEACHER"),
  getReceiptByNumber,
);

router.post(
  "/:id/collect",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "ACCOUNTANT"),
  collectPayment,
);
router.get(
  "/:id/history",
  authMiddleware,
  allowRoles("SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "TEACHER"),
  getPaymentHistory,
);

module.exports = router;
