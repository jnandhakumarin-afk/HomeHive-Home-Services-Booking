const Appliance = require("../models/Appliance");
const Home = require("../models/Home");

const addAppliance = async (req, res) => {
  try {
    const { homeId } = req.params;
    const {
      name,
      category,
      brand,
      model,
      serialNumber,
      purchaseDate,
      warrantyUntil,
      lastServiceDate,
      nextServiceDate
    } = req.body;

    const home = await Home.findOne({
      _id: homeId,
      user: req.user.userId
    });

    if (!home) {
      return res.status(404).json({
        message: "Home not found"
      });
    }

    const appliance = await Appliance.create({
      home: homeId,
      name,
      category,
      brand,
      model,
      serialNumber,
      purchaseDate,
      warrantyUntil,
      lastServiceDate,
      nextServiceDate
    });

    res.status(201).json({
      message: "Appliance added successfully",
      appliance
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to add appliance",
      error: error.message
    });
  }
};


const getAppliances = async (req, res) => {
  try {
    const { homeId } = req.params;

    const home = await Home.findOne({
      _id: homeId,
      user: req.user.userId
    });

    if (!home) {
      return res.status(404).json({
        message: "Home not found"
      });
    }

    const appliances = await Appliance.find({
      home: homeId
    });

    res.json({
      message: "Appliances fetched successfully",
      appliances
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch appliances",
      error: error.message
    });
  }
};


module.exports = {
  addAppliance,
  getAppliances
};