const Reminder = require("../models/Reminder");
const Appliance = require("../models/Appliance");
const Home = require("../models/Home");


// Create reminder
const createReminder = async (req, res) => {
  try {
    const {
      applianceId,
      title,
      message,
      reminderDate
    } = req.body;

    const appliance = await Appliance.findById(applianceId);

    if (!appliance) {
      return res.status(404).json({
        message: "Appliance not found"
      });
    }

    const home = await Home.findOne({
      _id: appliance.home,
      user: req.user.userId
    });

    if (!home) {
      return res.status(403).json({
        message: "Access denied"
      });
    }

    const reminder = await Reminder.create({
      user: req.user.userId,
      appliance: applianceId,
      title,
      message,
      reminderDate
    });

    res.status(201).json({
      message: "Reminder created successfully",
      reminder
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to create reminder",
      error: error.message
    });
  }
};


// Get my reminders
const getMyReminders = async (req, res) => {
  try {

    const reminders = await Reminder.find({
      user: req.user.userId
    })
      .populate("appliance", "name category brand model nextServiceDate")
      .sort({ reminderDate: 1 });

    res.json({
      message: "Reminders fetched successfully",
      reminders
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch reminders",
      error: error.message
    });
  }
};


// Mark reminder as read
const markReminderAsRead = async (req, res) => {
  try {

    const reminder = await Reminder.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user.userId
      },
      {
        isRead: true
      },
      { new: true }
    );

    if (!reminder) {
      return res.status(404).json({
        message: "Reminder not found"
      });
    }

    res.json({
      message: "Reminder marked as read",
      reminder
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to update reminder",
      error: error.message
    });
  }
};


module.exports = {
  createReminder,
  getMyReminders,
  markReminderAsRead
};