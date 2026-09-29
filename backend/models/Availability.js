const mongoose = require("mongoose");

const availabilitySchema = new mongoose.Schema(
  {
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider",
      required: true
    },

    date: {
      type: Date,
      required: true
    },

    timeSlots: [
      {
        time: {
          type: String,
          required: true
        },

        isBooked: {
          type: Boolean,
          default: false
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Availability", availabilitySchema);