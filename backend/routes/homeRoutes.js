const express = require("express");

const protect = require("../middleware/authMiddleware");

const {
  createHome,
  getMyHomes
} = require("../controllers/homeController");

const router = express.Router();

router.post("/", protect, createHome);

router.get("/", protect, getMyHomes);

module.exports = router;