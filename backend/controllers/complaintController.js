const Complaint = require("../models/Complaint");
const Booking = require("../models/Booking");


// Customer creates complaint
const createComplaint = async (req, res) => {
  try {
    const {
      booking,
      subject,
      description
    } = req.body;

    const bookingExists = await Booking.findOne({
      _id: booking,
      customer: req.user.userId
    });

    if (!bookingExists) {
      return res.status(404).json({
        message: "Booking not found"
      });
    }

    const complaint = await Complaint.create({
      customer: req.user.userId,
      booking,
      subject,
      description
    });

    res.status(201).json({
      message: "Complaint submitted successfully",
      complaint
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to create complaint",
      error: error.message
    });
  }
};


// Customer views own complaints
const getMyComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({
      customer: req.user.userId
    })
      .populate("booking", "date time status")
      .sort({ createdAt: -1 });

    res.json({
      message: "Complaints fetched successfully",
      complaints
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch complaints",
      error: error.message
    });
  }
};


// Admin views all complaints
const getAllComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate("customer", "name email phone")
      .populate("booking", "date time status")
      .sort({ createdAt: -1 });

    res.json({
      message: "All complaints fetched successfully",
      complaints
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch complaints",
      error: error.message
    });
  }
};


// Admin updates complaint
const updateComplaint = async (req, res) => {
  try {
    const {
      status,
      adminResponse
    } = req.body;

    const complaint = await Complaint.findById(
      req.params.id
    );

    if (!complaint) {
      return res.status(404).json({
        message: "Complaint not found"
      });
    }

    if (status) {
      complaint.status = status;
    }

    if (adminResponse !== undefined) {
      complaint.adminResponse = adminResponse;
    }

    await complaint.save();

    res.json({
      message: "Complaint updated successfully",
      complaint
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to update complaint",
      error: error.message
    });
  }
};


module.exports = {
  createComplaint,
  getMyComplaints,
  getAllComplaints,
  updateComplaint
};