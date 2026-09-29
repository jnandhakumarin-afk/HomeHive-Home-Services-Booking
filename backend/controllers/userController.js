const User = require("../models/User");

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    res.json({
      message: "Profile fetched successfully",
      user
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch profile",
      error: error.message
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const updates = {};

    for (const field of ["name", "phone", "location"]) {
      if (req.body[field] !== undefined) {
        updates[field] = typeof req.body[field] === "string"
          ? req.body[field].trim()
          : req.body[field];
      }
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({ message: "Provide a name, phone, or location to update" });
    }

    if (updates.name !== undefined && !updates.name) {
      return res.status(400).json({ message: "Name cannot be empty" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Profile updated successfully", user });
  } catch (error) {
    res.status(400).json({
      message: "Failed to update profile",
      error: error.message
    });
  }
};

module.exports = {
  getProfile,
  updateProfile
};