const Appliance = require("../models/Appliance");
const Home = require("../models/Home");
const ServiceReport = require("../models/ServiceReport");
const Bill = require("../models/Bill");
const Booking = require("../models/Booking");

const getMyAssets = async (req, res) => {
  try {
    const homes = await Home.find({ user: req.user.userId }).select("_id");
    const appliances = await Appliance.find({
      home: { $in: homes.map((home) => home._id) }
    })
      .populate("home", "name address city")
      .sort({ createdAt: -1 });

    res.json({ assets: appliances, appliances });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch appliances",
      error: error.message
    });
  }
};

const createAsset = async (req, res) => {
  try {
    const homeId = req.body.home || req.body.homeId;
    const name = req.body.name || req.body.type;
    const category = req.body.category || req.body.type || req.body.name;

    if (!homeId || !name || !category) {
      return res.status(400).json({
        message: "Home, appliance name/type, and category are required"
      });
    }

    const home = await Home.findOne({
      _id: homeId,
      user: req.user.userId
    });

    if (!home) {
      return res.status(404).json({ message: "Home not found" });
    }

    const appliance = await Appliance.create({
      home: home._id,
      name,
      category,
      brand: req.body.brand,
      model: req.body.model,
      serialNumber: req.body.serialNumber,
      purchaseDate: req.body.purchaseDate,
      warrantyUntil: req.body.warrantyUntil,
      lastServiceDate: req.body.lastServiceDate,
      nextServiceDate: req.body.nextServiceDue || req.body.nextServiceDate
    });

    res.status(201).json({ asset: appliance, appliance });
  } catch (error) {
    res.status(400).json({
      message: "Failed to create appliance",
      error: error.message
    });
  }
};

const updateAsset = async (req, res) => {
  try {
    const homes = await Home.find({ user: req.user.userId }).select("_id");
    const appliance = await Appliance.findOne({
      _id: req.params.applianceId,
      home: { $in: homes.map((home) => home._id) }
    });

    if (!appliance) {
      return res.status(404).json({ message: "Appliance not found" });
    }

    const fields = [
      "name",
      "category",
      "brand",
      "model",
      "serialNumber",
      "purchaseDate",
      "warrantyUntil",
      "nextServiceDate"
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        appliance[field] = req.body[field];
      }
    });

    if (req.body.type !== undefined) {
      appliance.name = req.body.type;
    }

    if (req.body.nextServiceDue !== undefined) {
      appliance.nextServiceDate = req.body.nextServiceDue;
    }

    await appliance.save();
    res.json({ asset: appliance, appliance });
  } catch (error) {
    res.status(400).json({
      message: "Failed to update appliance",
      error: error.message
    });
  }
};

const getServicePassport = async (req, res) => {
  try {
    const { applianceId } = req.params;

    // Check appliance
    const appliance = await Appliance.findById(applianceId);

    if (!appliance) {
      return res.status(404).json({
        message: "Appliance not found"
      });
    }

    // Check ownership
    const home = await Home.findById(appliance.home);

    if (!home || (req.user.role !== "admin" && home.user.toString() !== req.user.userId)) {
      return res.status(403).json({
        message: "Access denied"
      });
    }

    // Service history
    const serviceHistory = await ServiceReport.find({
      appliance: applianceId
    })
      .populate("provider", "businessName skills experience location serviceAreas rating totalReviews")
      .populate("booking", "date time status")
      .sort({ serviceDate: -1 });

    // Related bookings
    const bookings = await Booking.find({
      appliance: applianceId,
      customer: req.user.userId
    })
      .populate("provider", "businessName location rating")
      .populate("service", "name category")
      .sort({ date: -1 });

    // Related bills
    const bookingIds = bookings.map((booking) => booking._id);

    const bills = await Bill.find({
      booking: { $in: bookingIds },
      customer: req.user.userId
    }).sort({ createdAt: -1 });

    res.json({
      message: "Digital Service Passport fetched successfully",

      passport: {
        appliance: {
          id: appliance._id,
          name: appliance.name,
          category: appliance.category,
          brand: appliance.brand,
          model: appliance.model,
          serialNumber: appliance.serialNumber,
          purchaseDate: appliance.purchaseDate,
          warrantyUntil: appliance.warrantyUntil,
          totalSpent: appliance.totalSpent,
          lastServiceDate: appliance.lastServiceDate,
          nextServiceDate: appliance.nextServiceDate,
          nextServiceDue: appliance.nextServiceDate
        },

        home: {
          id: home._id,
          name: home.name,
          city: home.city
        },

        serviceHistory,

        bookings,

        bills
      }
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch service passport",
      error: error.message
    });
  }
};

module.exports = {
  getMyAssets,
  createAsset,
  updateAsset,
  getServicePassport
};