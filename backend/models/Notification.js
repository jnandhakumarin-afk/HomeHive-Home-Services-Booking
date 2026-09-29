const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    title: {
      type: String,
      required: true
    },

    message: {
      type: String,
      required: true
    },

    type: {
      type: String,
      enum: [
        "booking",
        "service",
        "payment",
        "reminder",
        "system"
      ],
      default: "system"
    },

    relatedId: {
      type: mongoose.Schema.Types.ObjectId
    },

    isRead: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);