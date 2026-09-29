const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true
    },

    subject: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      required: true,
      trim: true
    },

    status: {
      type: String,
      enum: [
        "open",
        "under_review",
        "resolved",
        "closed"
      ],
      default: "open"
    },

    adminResponse: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Complaint", complaintSchema);