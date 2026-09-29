const express = require("express");

const protect = require("../middleware/authMiddleware");

const {
  createReminder,
  getMyReminders,
  markReminderAsRead
} = require("../controllers/remainderController");

const router = express.Router();

router.post("/", protect, createReminder);

router.get("/my", protect, getMyReminders);

router.patch("/:id/read", protect, markReminderAsRead);

module.exports = router;