const Bill = require("../models/Bill");
const Booking = require("../models/Booking");
const Provider = require("../models/Provider");
const createNotification = require("../utils/notificationHelper");

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

    await createNotification({
      user: bookingData.customer,
      title: "New Bill Created",
      message: `A bill of ₹${totalAmount} has been generated for your completed service.`,
      type: "booking",
      relatedId: bill._id
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

const getBills = async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === "customer") {
      filter.customer = req.user.userId;
    } else if (req.user.role === "provider") {
      const provider = await Provider.findOne({ user: req.user.userId });
      if (!provider) {
        return res.json({ message: "Bills fetched successfully", bills: [] });
      }
      filter.provider = provider._id;
    }

    const bills = await Bill.find(filter)
      .populate("customer", "name email phone")
      .populate({
        path: "provider",
        select: "businessName upiId phone user location"
      })
      .populate({
        path: "booking",
        populate: [
          { path: "service", select: "name category basePrice" },
          { path: "appliance", select: "name brand category" },
          { path: "home", select: "name address city" }
        ]
      })
      .sort({ createdAt: -1 });

    res.json({
      message: "Bills fetched successfully",
      bills
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch bills",
      error: error.message
    });
  }
};

const getBill = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate("customer", "name email phone")
      .populate("provider")
      .populate({
        path: "booking",
        populate: [
          { path: "service", select: "name category basePrice" },
          { path: "appliance", select: "name brand category" },
          { path: "home", select: "name address city" }
        ]
      });

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
      .populate("provider", "businessName upiId user")
      .populate({
        path: "booking",
        populate: [
          { path: "service", select: "name category basePrice" },
          { path: "appliance", select: "name brand category" },
          { path: "home", select: "name address city" }
        ]
      });

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    const customerId = bill.customer._id || bill.customer;
    const providerUserId = bill.provider?.user;

    if (
      req.user.role !== "admin" &&
      customerId.toString() !== req.user.userId &&
      (!providerUserId || providerUserId.toString() !== req.user.userId)
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
    const { paymentStatus, paymentMethod, transactionId } = req.body;

    const bill = await Bill.findById(req.params.id)
      .populate("provider");

    if (!bill) {
      return res.status(404).json({
        message: "Bill not found"
      });
    }

    const customerId = bill.customer.toString();
    const providerUserId = bill.provider?.user?.toString();
    const isCustomer = req.user.role === "customer" && customerId === req.user.userId;
    const isProvider = req.user.role === "provider" && providerUserId === req.user.userId;
    const isAdmin = req.user.role === "admin";

    if (!isCustomer && !isProvider && !isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!["pending", "payment_submitted", "paid", "failed"].includes(paymentStatus)) {
      return res.status(400).json({ message: "Invalid payment status" });
    }

    // Customer can only submit payment (or cancel submission)
    if (isCustomer) {
      if (paymentStatus === "paid") {
        return res.status(403).json({ message: "Only the service provider or admin can verify and mark a bill as PAID" });
      }

      bill.paymentStatus = paymentStatus;
      if (paymentMethod) bill.paymentMethod = paymentMethod;
      if (transactionId !== undefined) bill.transactionId = transactionId.trim();

      await bill.save();

      // Notify the provider
      if (paymentStatus === "payment_submitted" && providerUserId) {
        await createNotification({
          user: providerUserId,
          title: "Payment Received / Awaiting Verification",
          message: `Customer submitted payment (Ref: ${transactionId || "Cash"}) for ₹${bill.totalAmount}. Please verify and mark as Paid.`,
          type: "booking",
          relatedId: bill._id
        });
      }

      const populatedBill = await Bill.findById(bill._id)
        .populate("customer", "name email phone")
        .populate("provider", "businessName upiId user")
        .populate({
          path: "booking",
          populate: [
            { path: "service", select: "name category basePrice" },
            { path: "appliance", select: "name brand category" },
            { path: "home", select: "name address city" }
          ]
        });

      return res.json({
        message: "Payment submission recorded. Awaiting provider verification.",
        bill: populatedBill
      });
    }

    // Provider or Admin can mark as paid or update status
    bill.paymentStatus = paymentStatus;
    if (paymentMethod) bill.paymentMethod = paymentMethod;
    if (transactionId !== undefined) bill.transactionId = transactionId.trim();

    if (paymentStatus === "paid") {
      bill.paidAt = new Date();

      // Increment completed jobs on the provider
      if (bill.provider?._id) {
        await Provider.findByIdAndUpdate(bill.provider._id, {
          $inc: { completedJobs: 1 }
        });
      }

      // Notify customer
      await createNotification({
        user: customerId,
        title: "Payment Verified & Completed",
        message: `Your payment of ₹${bill.totalAmount} has been verified and confirmed by the provider. Thank you!`,
        type: "booking",
        relatedId: bill._id
      });
    }

    await bill.save();

    const populatedBill = await Bill.findById(bill._id)
      .populate("customer", "name email phone")
      .populate("provider", "businessName upiId user")
      .populate({
        path: "booking",
        populate: [
          { path: "service", select: "name category basePrice" },
          { path: "appliance", select: "name brand category" },
          { path: "home", select: "name address city" }
        ]
      });

    res.json({
      message: "Payment status updated successfully",
      bill: populatedBill
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
  getBills,
  getBill,
  getBillByBooking,
  updatePaymentStatus
};