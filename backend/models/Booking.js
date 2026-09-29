const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider",
      required: true
    },

    home: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Home",
      required: true
    },

    appliance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appliance",
      required: true
    },

    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true
    },

    date: {
      type: Date,
      required: true
    },

    time: {
      type: String,
      required: true
    },

    description: {
      type: String
    },

    status: {
      type: String,
      enum: [
        "requested",
        "accepted",
        "rejected",
        "customer_approved",
        "in_progress",
        "completed",
        "cancelled"
      ],
      default: "requested"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Booking", bookingSchema);