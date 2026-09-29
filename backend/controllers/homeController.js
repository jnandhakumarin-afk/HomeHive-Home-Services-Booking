const Home = require("../models/Home");

const createHome = async (req, res) => {
  try {
    const { name, address, city, pincode } = req.body;

    const home = await Home.create({
      user: req.user.userId,
      name,
      address,
      city,
      pincode
    });

    res.status(201).json({
      message: "Home added successfully",
      home
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to add home",
      error: error.message
    });
  }
};


const getMyHomes = async (req, res) => {
  try {
    const homes = await Home.find({
      user: req.user.userId
    });

    res.json({
      message: "Homes fetched successfully",
      homes
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch homes",
      error: error.message
    });
  }
};


module.exports = {
  createHome,
  getMyHomes
};