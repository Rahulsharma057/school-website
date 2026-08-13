const express = require("express");
const router = express.Router();

const {
  createFeeStructure,
  getFeeStructures,
  getFeeStructureById,
  updateFeeStructure,
  deleteFeeStructure,
} = require("../controllers/feeStructureController");

const authMiddleware = require("../middlewares/authMiddleware");
const allowRoles = require("../middlewares/roleMiddleware");

router.get("/", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN", "ACCOUNTANT"), getFeeStructures);
router.get("/:id", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN", "ACCOUNTANT"), getFeeStructureById);
router.post("/", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN"), createFeeStructure);
router.put("/:id", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN"), updateFeeStructure);
router.delete("/:id", authMiddleware, allowRoles("SUPER_ADMIN", "ADMIN"), deleteFeeStructure);

module.exports = router;