const express = require("express");

const adminOnly = require("../middleware/adminMiddleware");

const {
  getAllUsers,
  getAllProviders,
  getAllBookings,
  getAllServices,
  getDashboardStats,
  getAllBills,
  getAllServiceReports
} = require("../controllers/adminController");

const router = express.Router();

router.get("/users", adminOnly, getAllUsers);

router.get("/providers", adminOnly, getAllProviders);

router.get("/bookings", adminOnly, getAllBookings);

router.get("/services", adminOnly, getAllServices);
router.get("/bills", adminOnly, getAllBills);

router.get("/service-reports", adminOnly, getAllServiceReports);

router.get("/dashboard", adminOnly, getDashboardStats);

module.exports = router;