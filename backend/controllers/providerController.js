const Provider = require("../models/Provider");

const createProvider = async (req, res) => {
  try {
    if (req.user.role !== "provider" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Provider role required" });
    }

    const {
      businessName,
      skills,
      categories,
      experience,
      hourlyRate,
      location,
      serviceAreas,
      description,
      upiId
    } = req.body;

    const existingProvider = await Provider.findOne({
      user: req.user.userId
    });

    if (existingProvider) {
      return res.status(400).json({
        message: "Provider profile already exists"
      });
    }

    const provider = await Provider.create({
      user: req.user.userId,
      businessName,
      skills,
      categories,
      experience,
      hourlyRate,
      location,
      serviceAreas,
      description,
      upiId: upiId ? upiId.trim() : ""
    });

    res.status(201).json({
      message: "Provider profile created successfully",
      provider
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to create provider",
      error: error.message
    });
  }
};


const getMyProvider = async (req, res) => {
  try {
    const provider = await Provider.findOne({ user: req.user.userId })
      .populate("user", "name email phone");

    if (!provider) {
      return res.status(404).json({ message: "Provider profile not found" });
    }

    res.json({ provider });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch provider profile",
      error: error.message
    });
  }
};

const getProviders = async (req, res) => {
  try {
    const { skill, location, category } = req.query;

    const filter = {};

    if (skill) {
      filter.skills = {
        $regex: skill,
        $options: "i"
      };
    }

    if (location) {
      filter.$or = [
        { location: { $regex: location, $options: "i" } },
        { serviceAreas: { $regex: location, $options: "i" } }
      ];
    }

    if (category) {
      filter.categories = {
        $regex: category,
        $options: "i"
      };
    }

    const providers = await Provider.find(filter)
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


const getProviderById = async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id)
      .populate("user", "name email phone");

    if (!provider) {
      return res.status(404).json({
        message: "Provider not found"
      });
    }

    res.json({
      message: "Provider fetched successfully",
      provider
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch provider",
      error: error.message
    });
  }
};

const updateMyProvider = async (req, res) => {
  try {
    const provider = await Provider.findOne({ user: req.user.userId });

    if (!provider) {
      return res.status(404).json({ message: "Provider profile not found" });
    }

    const fields = [
      "businessName",
      "skills",
      "categories",
      "experience",
      "hourlyRate",
      "location",
      "serviceAreas",
      "description",
      "isAvailable",
      "upiId"
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        provider[field] = req.body[field];
      }
    });

    if (req.body.experienceYears !== undefined) {
      provider.experience = req.body.experienceYears;
    }

    await provider.save();
    res.json({
      message: "Provider profile updated successfully",
      provider
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to update provider profile",
      error: error.message
    });
  }
};


module.exports = {
  createProvider,
  getMyProvider,
  getProviders,
  getProviderById,
  updateMyProvider
};