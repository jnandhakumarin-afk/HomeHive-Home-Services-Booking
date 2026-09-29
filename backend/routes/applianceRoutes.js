const express = require("express");

const protect = require("../middleware/authMiddleware");

const {
  addAppliance,
  getAppliances
} = require("../controllers/applianceController");

const router = express.Router();

// Add appliance
router.post("/:homeId", protect, addAppliance);

// Get appliances
router.get("/:homeId", protect, getAppliances);

module.exports = router;