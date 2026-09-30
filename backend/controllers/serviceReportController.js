const ServiceReport = require("../models/ServiceReport");
const Booking = require("../models/Booking");
const Provider = require("../models/Provider");
const Appliance = require("../models/Appliance");
const Home = require("../models/Home");
const createNotification = require("../utils/notificationHelper");

const createServiceReport = async (req, res) => {
  try {
    const {
      booking,
      problem,
      workPerformed,
      partsReplaced,
      serviceCost,
      labourCost,
      tax,
      total,
      warrantyDays,
      nextServiceDue,
      remarks,
      notes
    } = req.body;

    const bookingData = await Booking.findById(booking);

    if (!bookingData) {
      return res.status(404).json({
        message: "Booking not found"
      });
    }

    if (
      req.params.assetId &&
      bookingData.appliance.toString() !== req.params.assetId
    ) {
      return res.status(400).json({
        message: "Booking does not belong to the requested appliance"
      });
    }

    const provider = await Provider.findById(bookingData.provider);

    if (
      !provider ||
      (req.user.role !== "admin" &&
        provider.user.toString() !== req.user.userId)
    ) {
      return res.status(403).json({
        message: "Only the assigned provider can create this service report"
      });
    }

    if (bookingData.status !== "completed" && bookingData.status !== "in_progress") {
      return res.status(400).json({
        message: "Service must be in progress or completed before creating report"
      });
    }

    if (bookingData.status === "in_progress") {
      bookingData.status = "completed";
      await bookingData.save();
    }

    const existingReport = await ServiceReport.findOne({
      booking
    });

    if (existingReport) {
      return res.status(400).json({
        message: "Service report already exists"
      });
    }

    const report = await ServiceReport.create({
      booking,
      customer: bookingData.customer,
      provider: bookingData.provider,
      appliance: bookingData.appliance,
      problem,
      workPerformed,
      partsReplaced,
      serviceCost,
      labourCost,
      tax,
      total: total ?? (
        Number(labourCost || 0) +
        Number(serviceCost || 0) +
        Number(tax || 0) +
        (partsReplaced || []).reduce(
          (sum, part) => sum + Number(part.cost || 0),
          0
        )
      ),
      warrantyDays,
      nextServiceDue,
      remarks,
      notes
    });

    // Update appliance service information
    const applianceUpdate = {
      $set: { lastServiceDate: report.serviceDate },
      $inc: { totalSpent: report.total || 0 }
    };

    if (nextServiceDue !== undefined) {
      applianceUpdate.$set.nextServiceDate = nextServiceDue || null;
    }

    await Appliance.findByIdAndUpdate(bookingData.appliance, applianceUpdate);

    await createNotification({
      user: bookingData.customer,
      title: "Service Completed",
      message: `Your service for booking #${bookingData._id.toString().slice(-6)} has been completed. Bill and report are now available.`,
      type: "booking",
      relatedId: bookingData._id
    });

    res.status(201).json({
      message: "Service report created successfully",
      report
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to create service report",
      error: error.message
    });
  }
};


const getApplianceHistory = async (req, res) => {
  try {
    const appliance = await Appliance.findById(req.params.applianceId);

    if (!appliance) {
      return res.status(404).json({ message: "Appliance not found" });
    }

    if (req.user.role !== "admin") {
      const home = await Home.findOne({
        _id: appliance.home,
        user: req.user.userId
      });

      if (!home) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    const reports = await ServiceReport.find({
      appliance: req.params.applianceId
    })
      .populate("provider", "businessName skills experience location serviceAreas rating totalReviews")
      .populate("appliance")
      .populate("booking", "date time status")
      .sort({ serviceDate: -1 });

    res.json({
      message: "Service history fetched successfully",
      reports
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch service history",
      error: error.message
    });
  }
};


module.exports = {
  createServiceReport,
  getApplianceHistory
};