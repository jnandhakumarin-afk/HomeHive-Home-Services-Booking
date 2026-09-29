const Notification = require("../models/Notification");

const createNotification = async ({
  user,
  title,
  message,
  type = "system",
  relatedId
}) => {
  try {
    await Notification.create({
      user,
      title,
      message,
      type,
      relatedId
    });
  } catch (error) {
    console.error("Notification Error:", error.message);
  }
};

module.exports = createNotification;