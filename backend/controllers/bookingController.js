const Booking = require("../models/Booking");
const Provider = require("../models/Provider");
const Home = require("../models/Home");
const Appliance = require("../models/Appliance");
const Availability = require("../models/Availability");
const createNotification = require("../utils/notificationHelper");

// Create booking
const createBooking = async (req, res) => {
  try {
    const {
      provider,
      home,
      appliance,
      service,
      date,
      time,
      description
    } = req.body;

    // Check customer's home
    const customerHome = await Home.findOne({
      _id: home,
      user: req.user.userId
    });

    if (!customerHome) {
      return res.status(403).json({
        message: "You can only book services for your own home"
      });
    }

    const customerAppliance = await Appliance.findOne({
      _id: appliance,
      home: customerHome._id
    });

    if (!customerAppliance) {
      return res.status(403).json({
        message: "You can only book services for appliances in your own home"
      });
    }

    // Check provider
    const providerExists = await Provider.findById(provider);

    if (!providerExists) {
      return res.status(404).json({
        message: "Provider not found"
      });
    }

    // Find provider availability for selected date
    const bookingDate = new Date(date);

    if (Number.isNaN(bookingDate.getTime())) {
      return res.status(400).json({ message: "A valid booking date is required" });
    }

    bookingDate.setUTCHours(0, 0, 0, 0);
    const nextDay = new Date(bookingDate);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);

    const availability = await Availability.findOne({
      provider,
      date: { $gte: bookingDate, $lt: nextDay }
    });

    if (!availability) {
      return res.status(400).json({
        message: "Provider is not available on this date"
      });
    }

    // Find selected time slot
    const slot = availability.timeSlots.find(
      (slot) => slot.time === time
    );

    if (!slot) {
      return res.status(400).json({
        message: "Selected time slot is not available"
      });
    }

    // Check if slot already booked
    if (slot.isBooked) {
      return res.status(400).json({
        message: "Selected time slot is already booked"
      });
    }

    // Create booking
    const booking = await Booking.create({
      customer: req.user.userId,
      provider,
      home,
      appliance,
      service,
      date,
      time,
      description,
      status: "requested"
    });

    // Mark slot as booked
    slot.isBooked = true;

    await availability.save();

    // Notify provider
    const providerDoc = await Provider.findById(provider);
    if (providerDoc?.user) {
      await createNotification({
        user: providerDoc.user,
        title: "New Booking Request",
        message: `You have received a new booking request for ${date} at ${time}.`,
        type: "booking",
        relatedId: booking._id
      });
    }

    res.status(201).json({
      message: "Booking request sent successfully",
      booking
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to create booking",
      error: error.message
    });
  }
};

// Customer bookings
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      customer: req.user.userId
    })
      .populate("provider")
      .populate("home")
      .populate("appliance")
      .populate("service")
      .sort({ createdAt: -1 });

    res.json({
      message: "Bookings fetched successfully",
      bookings
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch bookings",
      error: error.message
    });
  }
};

// Provider bookings
const getProviderBookings = async (req, res) => {
  try {
    const provider = await Provider.findOne({
      user: req.user.userId
    });

    if (!provider) {
      return res.status(404).json({
        message: "Provider profile not found"
      });
    }

    const bookings = await Booking.find({
      provider: provider._id
    })
      .populate("customer")
      .populate("home")
      .populate("appliance")
      .populate("service")
      .sort({ createdAt: -1 });

    res.json({
      message: "Provider bookings fetched successfully",
      bookings
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch provider bookings",
      error: error.message
    });
  }
};

// Update booking status
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found"
      });
    }

    // Find provider
    const provider = await Provider.findById(booking.provider);

    if (!provider) {
      return res.status(404).json({
        message: "Provider not found"
      });
    }

    // Provider actions
    if (provider.user.toString() === req.user.userId) {

      if (
        booking.status === "requested" &&
        (status === "accepted" || status === "rejected")
      ) {
        booking.status = status;
      }

      else if (
        booking.status === "customer_approved" &&
        status === "in_progress"
      ) {
        booking.status = status;
      }

      else if (
        booking.status === "in_progress" &&
        status === "completed"
      ) {
        booking.status = status;
      }

      else {
        return res.status(400).json({
          message: "Invalid status change for provider"
        });
      }
    }

    // Customer actions
    else if (booking.customer.toString() === req.user.userId) {

      if (
        booking.status === "accepted" &&
        status === "customer_approved"
      ) {
        booking.status = status;
      }

      else if (
        (booking.status === "requested" ||
          booking.status === "accepted") &&
        status === "cancelled"
      ) {
        booking.status = status;
      }

      else {
        return res.status(400).json({
          message: "Invalid status change for customer"
        });
      }
    }

    else {
      return res.status(403).json({
        message: "You are not allowed to update this booking"
      });
    }

    await booking.save();

    // Release time slots when a booking is cancelled or rejected.
    if (status === "cancelled" || status === "rejected") {

      const startOfDay = new Date(booking.date);
      startOfDay.setUTCHours(0, 0, 0, 0);

      const endOfDay = new Date(startOfDay);
      endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

      const availability = await Availability.findOne({
        provider: booking.provider,
        date: {
          $gte: startOfDay,
          $lt: endOfDay
        }
      });

      if (availability) {

        const slot = availability.timeSlots.find(
          (slot) => slot.time === booking.time
        );

        if (slot) {
          slot.isBooked = false;
          await availability.save();
        }
      }

      if (status === "cancelled") {
        await createNotification({
          user: provider.user,
          title: "Booking Cancelled",
          message: "A customer has cancelled the booking.",
          type: "booking",
          relatedId: booking._id
        });
      }
    }

    // Notifications
    if (status === "accepted") {
      await createNotification({
        user: booking.customer,
        title: "Booking Accepted",
        message: "Your booking has been accepted by the provider.",
        type: "booking",
        relatedId: booking._id
      });
    }

    if (status === "rejected") {
      await createNotification({
        user: booking.customer,
        title: "Booking Rejected",
        message: "Your booking has been rejected by the provider.",
        type: "booking",
        relatedId: booking._id
      });
    }

    if (status === "customer_approved") {
      await createNotification({
        user: provider.user,
        title: "Customer Approved Service",
        message: "The customer has approved the service.",
        type: "booking",
        relatedId: booking._id
      });
    }

    if (status === "in_progress") {
      await createNotification({
        user: booking.customer,
        title: "Service Started",
        message: "Your service has been started.",
        type: "service",
        relatedId: booking._id
      });
    }

    if (status === "completed") {
      await createNotification({
        user: booking.customer,
        title: "Service Completed",
        message: "Your service has been completed.",
        type: "service",
        relatedId: booking._id
      });
    }

    res.json({
      message: "Booking status updated successfully",
      booking
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to update booking status",
      error: error.message
    });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getProviderBookings,
  updateBookingStatus
};
       