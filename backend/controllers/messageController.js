const Message = require("../models/Message");
const Booking = require("../models/Booking");
const Provider = require("../models/Provider");

const canAccessConversation = async (currentUserId, otherUserId) => {
  const [currentProvider, otherProvider] = await Promise.all([
    Provider.findOne({ user: currentUserId }),
    Provider.findOne({ user: otherUserId })
  ]);

  if (Boolean(currentProvider) === Boolean(otherProvider)) {
    return false;
  }

  const provider = currentProvider || otherProvider;
  const customer = currentProvider ? otherUserId : currentUserId;
  return Boolean(await Booking.exists({ provider: provider._id, customer }));
};


// Send message
const sendMessage = async (req, res) => {
  try {
    const { receiver, booking, message } = req.body;

    if (!receiver || !booking || !message?.trim()) {
      return res.status(400).json({
        message: "A booking, recipient, and message are required"
      });
    }

    const bookingData = await Booking.findById(booking);

    if (!bookingData) {
      return res.status(404).json({ message: "Booking not found" });
    }

    let expectedReceiver;

    if (bookingData.customer.toString() === req.user.userId) {
      const provider = await Provider.findById(bookingData.provider);
      expectedReceiver = provider?.user;
    } else {
      const provider = await Provider.findOne({
        _id: bookingData.provider,
        user: req.user.userId
      });

      if (provider) expectedReceiver = bookingData.customer;
    }

    if (!expectedReceiver || expectedReceiver.toString() !== receiver) {
      return res.status(403).json({
        message: "Messages are limited to the customer and provider on this booking"
      });
    }

    const newMessage = await Message.create({
      sender: req.user.userId,
      receiver,
      booking: bookingData._id,
      message: message.trim()
    });

    res.status(201).json({
      message: "Message sent successfully",
      data: newMessage
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to send message",
      error: error.message
    });
  }
};


// Get conversation
const getConversation = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!await canAccessConversation(req.user.userId, userId)) {
      return res.status(403).json({ message: "Conversation access denied" });
    }

    const messages = await Message.find({
      $or: [
        {
          sender: req.user.userId,
          receiver: userId
        },
        {
          sender: userId,
          receiver: req.user.userId
        }
      ]
    })
      .populate("sender", "name")
      .populate("receiver", "name")
      .sort({ createdAt: 1 });

    res.json({
      message: "Conversation fetched successfully",
      messages
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch conversation",
      error: error.message
    });
  }
};


// Mark messages as read
const markMessagesAsRead = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!await canAccessConversation(req.user.userId, userId)) {
      return res.status(403).json({ message: "Conversation access denied" });
    }

    await Message.updateMany(
      {
        sender: userId,
        receiver: req.user.userId,
        isRead: false
      },
      {
        isRead: true
      }
    );

    res.json({
      message: "Messages marked as read"
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to update messages",
      error: error.message
    });
  }
};


module.exports = {
  sendMessage,
  getConversation,
  markMessagesAsRead
};