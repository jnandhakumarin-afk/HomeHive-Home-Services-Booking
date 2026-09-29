const mongoose = require("mongoose");

const serviceReportSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      unique: true
    },

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

    appliance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appliance",
      required: true
    },

    workPerformed: {
      type: String,
      required: true
    },

    problem: {
      type: String,
      default: "",
      trim: true
    },

    partsReplaced: [
      {
        name: String,
        cost: Number
      }
    ],

    serviceCost: {
      type: Number,
      required: true,
      default: 0
    },

    labourCost: {
      type: Number,
      min: 0,
      default: 0
    },

    tax: {
      type: Number,
      min: 0,
      default: 0
    },

    total: {
      type: Number,
      min: 0,
      default: 0
    },

    warrantyDays: {
      type: Number,
      default: 0
    },

    nextServiceDue: {
      type: Date,
      default: null
    },

    remarks: {
      type: String
    },

    notes: {
      type: String,
      default: "",
      trim: true
    },

    serviceDate: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "ServiceReport",
  serviceReportSchema
);