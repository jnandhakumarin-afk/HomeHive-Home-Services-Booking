const Availability = require("../models/Availability");
const Provider = require("../models/Provider");

const createAvailability = async (req, res) => {
  try {
    const { date } = req.body;
    const timeSlots = req.body.timeSlots || req.body.slots;

    const availabilityDate = new Date(date);

    if (
      !date ||
      Number.isNaN(availabilityDate.getTime()) ||
      !Array.isArray(timeSlots)
    ) {
      return res.status(400).json({
        message: "A valid date and an array of time slots are required"
      });
    }

    availabilityDate.setUTCHours(0, 0, 0, 0);

    const normalizedSlots = timeSlots.map((slot) => ({
      time: typeof slot === "string" ? slot : slot.time,
      isBooked: typeof slot === "string" ? false : Boolean(slot.isBooked)
    }));

    if (normalizedSlots.some((slot) => !slot.time)) {
      return res.status(400).json({
        message: "Each time slot must include a time"
      });
    }

    const provider = await Provider.findOne({
      user: req.user.userId
    });

    if (!provider) {
      return res.status(404).json({
        message: "Provider profile not found"
      });
    }

    if (
      req.params.id &&
      provider._id.toString() !== req.params.id
    ) {
      return res.status(403).json({
        message: "You can only manage your own availability"
      });
    }

    const nextDay = new Date(availabilityDate);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);

    const existingAvailability = await Availability.findOne({
      provider: provider._id,
      date: { $gte: availabilityDate, $lt: nextDay }
    });

    const slotsToSave = normalizedSlots.map((slot) => ({
      ...slot,
      isBooked: slot.isBooked || Boolean(
        existingAvailability?.timeSlots.find((existingSlot) =>
          existingSlot.time === slot.time && existingSlot.isBooked
        )
      )
    }));

    existingAvailability?.timeSlots.forEach((existingSlot) => {
      if (
        existingSlot.isBooked &&
        !slotsToSave.some((slot) => slot.time === existingSlot.time)
      ) {
        slotsToSave.push({ time: existingSlot.time, isBooked: true });
      }
    });

    const availability = await Availability.findOneAndUpdate(
      {
        provider: provider._id,
        date: { $gte: availabilityDate, $lt: nextDay }
      },
      {
        $set: {
          date: availabilityDate,
          timeSlots: slotsToSave
        }
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(201).json({
      message: "Availability added successfully",
      availability
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to add availability",
      error: error.message
    });
  }
};


const getProviderAvailability = async (req, res) => {
  try {
    const providerId = req.params.providerId || req.params.id;

    const availability = await Availability.find({
      provider: providerId
    }).sort({ date: 1 });

    res.json({
      message: "Availability fetched successfully",
      availability
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch availability",
      error: error.message
    });
  }
};


module.exports = {
  createAvailability,
  getProviderAvailability
};