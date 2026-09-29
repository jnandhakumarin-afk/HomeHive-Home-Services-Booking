const Service = require("../models/Service");

const createService = async (req, res) => {
  try {
    const { name, category, description } = req.body;

    const service = await Service.create({
      name,
      category,
      description
    });

    res.status(201).json({
      message: "Service created successfully",
      service
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to create service",
      error: error.message
    });
  }
};


const getServices = async (req, res) => {
  try {
    const { category } = req.query;

    const filter = {
      isActive: true
    };

    if (category) {
      filter.category = category;
    }

    const services = await Service.find(filter);

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


module.exports = {
  createService,
  getServices
};