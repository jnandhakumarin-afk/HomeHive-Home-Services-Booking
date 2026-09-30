const express = require("express");

const protect = require("../middleware/authMiddleware");

const {
  createBill,
  getBills,
  getBill,
  getBillByBooking,
  updatePaymentStatus
} = require("../controllers/billController");

const router = express.Router();

router.post("/", protect, createBill);
router.get("/", protect, getBills);
router.get("/booking/:bookingId", protect, getBillByBooking);
router.get("/:id", protect, getBill);
router.patch("/:id/payment", protect, updatePaymentStatus);

module.exports = router;