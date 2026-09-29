const mongoose = require("mongoose");

const providerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },

    businessName: {
      type: String,
      required: true,
      trim: true
    },

    skills: [
      {
        type: String
      }
    ],

    categories: {
      type: [String],
      default: []
    },

    experience: {
      type: Number,
      default: 0
    },

    hourlyRate: {
      type: Number,
      min: 0,
      default: 0
    },

    location: {
      type: String,
      required: true
    },

    serviceAreas: [
      {
        type: String
      }
    ],

    rating: {
      type: Number,
      default: 0
    },

    totalReviews: {
      type: Number,
      default: 0
    },

    completedJobs: {
      type: Number,
      default: 0
    },

    isAvailable: {
      type: Boolean,
      default: true
    },

    description: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Provider", providerSchema);