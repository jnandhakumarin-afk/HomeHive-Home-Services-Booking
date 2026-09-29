const Notification = require("../models/Notification");


// Create notification
const createNotification = async (req, res) => {
  try {
    const {
      user,
      title,
      message,
      type,
      relatedId
    } = req.body;

    const notification = await Notification.create({
      user,
      title,
      message,
      type,
      relatedId
    });

    res.status(201).json({
      message: "Notification created successfully",
      notification
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to create notification",
      error: error.message
    });
  }
};


// Get my notifications
const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      user: req.user.userId
    }).sort({ createdAt: -1 });

    res.json({
      message: "Notifications fetched successfully",
      notifications
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch notifications",
      error: error.message
    });
  }
};


// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user.userId
      },
      {
        isRead: true
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found"
      });
    }

    res.json({
      message: "Notification marked as read",
      notification
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to update notification",
      error: error.message
    });
  }
};


// Mark all as read
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        user: req.user.userId,
        isRead: false
      },
      {
        isRead: true
      }
    );

    res.json({
      message: "All notifications marked as read"
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to update notifications",
      error: error.message
    });
  }
};


module.exports = {
  createNotification,
  getMyNotifications,
  markAsRead,
  markAllAsRead
};