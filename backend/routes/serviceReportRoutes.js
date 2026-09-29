const express = require("express");

const protect = require("../middleware/authMiddleware");

const {
  createServiceReport,
  getApplianceHistory
} = require("../controllers/serviceReportController");

const router = express.Router();

router.post("/", protect, createServiceReport);

router.get(
  "/appliance/:applianceId",
  protect,
  getApplianceHistory
);

module.exports = router;