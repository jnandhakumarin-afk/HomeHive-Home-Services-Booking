const express = require("express");

const protect = require("../middleware/authMiddleware");

const {
  createBill,
  getBill,
  getBillByBooking,
  updatePaymentStatus
} = require("../controllers/billController");

const router = express.Router();

router.post("/", protect, createBill);

router.get("/booking/:bookingId", protect, getBillByBooking);

router.get("/:id", protect, getBill);

router.patch("/:id/payment", protect, updatePaymentStatus);

module.exports = router;