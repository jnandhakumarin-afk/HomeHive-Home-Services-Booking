const express = require("express");

const protect = require("../middleware/authMiddleware");

const {
  createReview,
  getProviderReviews
} = require("../controllers/reviewController");

const router = express.Router();

router.post("/", protect, createReview);

router.get(
  "/provider/:providerId",
  protect,
  getProviderReviews
);

module.exports = router;