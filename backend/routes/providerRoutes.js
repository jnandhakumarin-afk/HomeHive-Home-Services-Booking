const express = require("express");

const protect = require("../middleware/authMiddleware");

const {
  createProvider,
  getMyProvider,
  getProviders,
  getProviderById,
  updateMyProvider
} = require("../controllers/providerController");
const {
  createAvailability,
  getProviderAvailability
} = require("../controllers/availabilityController");

const router = express.Router();

router.post("/", protect, createProvider);

router.patch("/me", protect, updateMyProvider);

router.get("/me", protect, getMyProvider);

router.post("/:id/availability", protect, createAvailability);

router.get("/:id/availability", protect, getProviderAvailability);

router.get("/", protect, getProviders);

router.get("/:id", protect, getProviderById);

module.exports = router;