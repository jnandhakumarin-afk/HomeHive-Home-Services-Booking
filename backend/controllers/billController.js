const Bill = require("../models/Bill");
const Booking = require("../models/Booking");
const Provider = require("../models/Provider");

const createBill = async (req, res) => {
  try {
    const {
      booking,
      items,
      tax = 0
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "At least one bill item is required"
      });
    }

    const taxAmount = Number(tax);

    if (!Number.isFinite(taxAmount) || taxAmount < 0) {
      return res.status(400).json({ message: "Tax must be a non-negative number" });
    }

    const invalidItem = items.some((item) => {
      if (!item || typeof item.description !== "string" || !item.description.trim()) {
        return true;
      }

      const quantity = Number(item.quantity ?? 1);
      const unitPrice = Number(item.unitPrice);
      return !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice < 0;
    });

    if (invalidItem) {
      return res.status(400).json({
        message: "Bill items require a description, positive quantity, and non-negative unit price"
      });
    }

    const bookingData = await Booking.findById(booking);

    if (!bookingData) {
      return res.status(404).json({
        message: "Booking not found"
      });
    }

    if (bookingData.status !== "completed") {
      return res.status(400).json({
        message: "Bill can be created only after service completion"
      });
    }

    const provider = await Provider.findById(bookingData.provider);

    if (
      req.user.role !== "admin" &&
      (!provider || provider.user.toString() !== req.user.userId)
    ) {
      return res.status(403).json({
        message: "Only the assigned provider can create this bill"
      });
    }

    const existingBill = await Bill.findOne({ booking });

    if (existingBill) {
      return res.status(400).json({
        message: "Bill already exists"
      });
    }

    const calculatedItems = items.map((item) => {
      const quantity = Number(item.quantity ?? 1);
      const unitPrice = Number(item.unitPrice);

      return {
        description: item.description.trim(),
        quantity,
        unitPrice,
        amount: quantity * unitPrice
      };
    });

    const subtotal = calculatedItems.reduce(
      (sum, item) => sum + item.amount,
      0
    );

    const totalAmount = subtotal + taxAmount;

    const bill = await Bill.create({
      booking,
      customer: bookingData.customer,
      provider: bookingData.provider,
      items: calculatedItems,
      subtotal,
      tax: taxAmount,
      totalAmount
    });

    res.status(201).json({
      message: "Bill created successfully",
      bill
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to create bill",
      error: error.message
    });
  }
};


const getBill = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate("customer", "name email phone")
      .populate("provider")
      .populate("booking");

    if (!bill) {
      return res.status(404).json({
        message: "Bill not found"
      });
    }

    const customerId = bill.customer._id || bill.customer;
    const providerUserId = bill.provider.user;

    if (
      req.user.role !== "admin" &&
      customerId.toString() !== req.user.userId &&
      providerUserId.toString() !== req.user.userId
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json({
      message: "Bill fetched successfully",
      bill
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch bill",
      error: error.message
    });
  }
};


const getBillByBooking = async (req, res) => {
  try {
    const bill = await Bill.findOne({ booking: req.params.bookingId })
      .populate("customer", "name email phone")
      .populate("provider", "businessName user")
      .populate("booking", "date time status");

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    const customerId = bill.customer._id || bill.customer;
    const providerUserId = bill.provider.user;

    if (
      req.user.role !== "admin" &&
      customerId.toString() !== req.user.userId &&
      providerUserId.toString() !== req.user.userId
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json({ bill });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch bill",
      error: error.message
    });
  }
};

const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body;

    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({
        message: "Bill not found"
      });
    }

    if (
      req.user.role !== "admin" &&
      bill.customer.toString() !== req.user.userId
    ) {
      return res.status(403).json({
        message: "Only the customer who owns this bill can update payment status"
      });
    }

    if (!["pending", "paid", "failed"].includes(paymentStatus)) {
      return res.status(400).json({ message: "Invalid payment status" });
    }

    bill.paymentStatus = paymentStatus;

    await bill.save();

    res.json({
      message: "Payment status updated successfully",
      bill
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to update payment status",
      error: error.message
    });
  }
};


module.exports = {
  createBill,
  getBill,
  getBillByBooking,
  updatePaymentStatus
};