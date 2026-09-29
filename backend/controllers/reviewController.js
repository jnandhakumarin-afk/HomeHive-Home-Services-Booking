const Review = require("../models/Review");
const Booking = require("../models/Booking");
const Provider = require("../models/Provider");

const createReview = async (req, res) => {
  try {
    const { booking, rating, comment } = req.body;

    const bookingData = await Booking.findById(booking);

    if (!bookingData) {
      return res.status(404).json({
        message: "Booking not found"
      });
    }

    if (bookingData.customer.toString() !== req.user.userId) {
      return res.status(403).json({
        message: "You cannot review this booking"
      });
    }

    if (bookingData.status !== "completed") {
      return res.status(400).json({
        message: "Review can be added only after service completion"
      });
    }

    const existingReview = await Review.findOne({ booking });

    if (existingReview) {
      return res.status(400).json({
        message: "Review already submitted"
      });
    }

    const review = await Review.create({
      booking,
      customer: bookingData.customer,
      provider: bookingData.provider,
      rating,
      comment
    });

    // Get all reviews of this provider
    const reviews = await Review.find({
      provider: bookingData.provider
    });

    const totalReviews = reviews.length;

    const totalRating = reviews.reduce(
      (sum, item) => sum + item.rating,
      0
    );

    const averageRating = totalRating / totalReviews;

    await Provider.findByIdAndUpdate(
      bookingData.provider,
      {
        rating: Number(averageRating.toFixed(1)),
        totalReviews
      }
    );

    res.status(201).json({
      message: "Review submitted successfully",
      review
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to submit review",
      error: error.message
    });
  }
};


const getProviderReviews = async (req, res) => {
  try {
    const reviews = await Review.find({
      provider: req.params.providerId
    })
      .populate("customer", "name")
      .sort({ createdAt: -1 });

    res.json({
      message: "Reviews fetched successfully",
      reviews
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch reviews",
      error: error.message
    });
  }
};


module.exports = {
  createReview,
  getProviderReviews
};