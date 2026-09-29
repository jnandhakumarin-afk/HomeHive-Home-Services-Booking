const express = require("express");

const protect = require("../middleware/authMiddleware");

const {
  sendMessage,
  getConversation,
  markMessagesAsRead
} = require("../controllers/messageController");

const router = express.Router();

router.post("/", protect, sendMessage);

router.get("/conversation/:userId", protect, getConversation);

router.patch("/conversation/:userId/read", protect, markMessagesAsRead);

module.exports = router;