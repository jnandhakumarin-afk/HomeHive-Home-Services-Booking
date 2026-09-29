const mongoose = require("mongoose");

const applianceSchema = new mongoose.Schema(
  {
    home: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Home",
      required: true
    },

    name: {
      type: String,
      required: true
    },

    category: {
      type: String,
      required: true
    },

    brand: {
      type: String
    },

    model: {
      type: String
    },

    serialNumber: {
      type: String,
      trim: true,
      default: ""
    },

    purchaseDate: {
      type: Date
    },

    warrantyUntil: {
      type: Date,
      default: null
    },

    totalSpent: {
      type: Number,
      min: 0,
      default: 0
    },

    lastServiceDate: {
      type: Date
    },

    nextServiceDate: {
      type: Date
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Appliance", applianceSchema);