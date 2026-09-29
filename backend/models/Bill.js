const mongoose = require("mongoose");

const billSchema = new mongoose.Schema(
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

    items: [
      {
        description: {
          type: String,
          required: true
        },
        quantity: {
          type: Number,
          default: 1,
          min: 0.01
        },
        unitPrice: {
          type: Number,
          required: true,
          min: 0
        },
        amount: {
          type: Number,
          required: true,
          min: 0
        }
      }
    ],

    subtotal: {
      type: Number,
      required: true
    },

    tax: {
      type: Number,
      default: 0,
      min: 0
    },

    totalAmount: {
      type: Number,
      required: true
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Bill", billSchema);