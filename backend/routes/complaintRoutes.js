const express = require("express");

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const {
  createComplaint,
  getMyComplaints,
  getAllComplaints,
  updateComplaint
} = require("../controllers/complaintController");

const router = express.Router();


// Customer
router.post("/", protect, createComplaint);

router.get("/my", protect, getMyComplaints);


// Admin
router.get("/admin/all", adminOnly, getAllComplaints);

router.patch(
  "/admin/:id",
  adminOnly,
  updateComplaint
);

module.exports = router;