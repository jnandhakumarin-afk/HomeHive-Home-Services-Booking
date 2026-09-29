const User = require("../models/User");
const Provider = require("../models/Provider");
const Booking = require("../models/Booking");
const Service = require("../models/Service");
const Bill = require("../models/Bill");
const ServiceReport = require("../models/ServiceReport");


// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");

    res.json({
      message: "Users fetched successfully",
      users
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch users",
      error: error.message
    });
  }
};


// Get all providers
const getAllProviders = async (req, res) => {
  try {
    const providers = await Provider.find()
      .populate("user", "name email phone");

    res.json({
      message: "Providers fetched successfully",
      providers
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch providers",
      error: error.message
    });
  }
};


// Get all bookings
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("customer", "name email phone")
      .populate("provider", "businessName")
      .populate("service", "name category")
      .populate("appliance", "name brand model")
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


// Get all services
const getAllServices = async (req, res) => {
  try {
    const services = await Service.find()
      .sort({ createdAt: -1 });

    res.json({
      message: "Services fetched successfully",
      services
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch services",
      error: error.message
    });
  }
};


// Admin dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({
      role: "customer"
    });

    const totalProviders = await Provider.countDocuments();

    const totalBookings = await Booking.countDocuments();

    const completedBookings = await Booking.countDocuments({
      status: "completed"
    });

    const pendingBookings = await Booking.countDocuments({
      status: "requested"
    });

    const totalServices = await Service.countDocuments();

    res.json({
      message: "Dashboard statistics fetched successfully",

      stats: {
        totalUsers,
        totalProviders,
        totalBookings,
        completedBookings,
        pendingBookings,
        totalServices
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch dashboard statistics",
      error: error.message
    });
  }
};


const getAllBills = async (req, res) => {
  try {
    const bills = await Bill.find()
      .populate("customer", "name email phone")
      .populate("provider", "businessName")
      .populate("booking", "date time status")
      .sort({ createdAt: -1 });

    res.json({ bills });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch bills",
      error: error.message
    });
  }
};

const getAllServiceReports = async (req, res) => {
  try {
    const reports = await ServiceReport.find()
      .populate("customer", "name email")
      .populate("provider", "businessName")
      .populate("appliance", "name category brand model")
      .populate("booking", "date time status")
      .sort({ serviceDate: -1 });

    res.json({ reports });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch service activity",
      error: error.message
    });
  }
};

module.exports = {
  getAllUsers,
  getAllProviders,
  getAllBookings,
  getAllServices,
  getDashboardStats,
  getAllBills,
  getAllServiceReports
};