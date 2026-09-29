const express = require("express");

const protect = require("../middleware/authMiddleware");

const {
  createAvailability,
  getProviderAvailability
} = require("../controllers/availabilityController");

const router = express.Router();

router.post("/", protect, createAvailability);

router.get(
  "/provider/:providerId",
  protect,
  getProviderAvailability
);

module.exports = router;