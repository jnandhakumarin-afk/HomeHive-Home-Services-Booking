const express = require("express");

const adminOnly = require("../middleware/adminMiddleware");
const protect = require("../middleware/authMiddleware");

const {
  createService,
  getServices
} = require("../controllers/serviceController");

const router = express.Router();

router.post("/", adminOnly, createService);

router.get("/", protect, getServices);

module.exports = router;