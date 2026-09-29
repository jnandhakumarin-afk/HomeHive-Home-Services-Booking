const express = require("express");

const protect = require("../middleware/authMiddleware");

const {
  getMyAssets,
  createAsset,
  updateAsset,
  getServicePassport
} = require("../controllers/passportController");
const { createServiceReport } = require("../controllers/serviceReportController");

const router = express.Router();
router.get("/assets", protect, getMyAssets);

router.post("/assets", protect, createAsset);

router.patch("/assets/:applianceId", protect, updateAsset);

router.get("/assets/:applianceId/history", protect, getServicePassport);

router.post(
  "/assets/:assetId/service-records",
  protect,
  createServiceReport
);

router.get(
  "/appliance/:applianceId",
  protect,
  getServicePassport
);

module.exports = router;