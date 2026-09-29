const express = require("express");

const protect = require("../middleware/authMiddleware");

const {
  createNotification,
  getMyNotifications,
  markAsRead,
  markAllAsRead
} = require("../controllers/notificationController");

const router = express.Router();

router.post("/", protect, createNotification);

router.get("/my", protect, getMyNotifications);

router.patch("/:id/read", protect, markAsRead);

router.patch("/read-all", protect, markAllAsRead);

module.exports = router;