import express from "express";
import Booking from "../models/Booking.js";
import Feedback from "../models/Feedback.js";
import { protect, requireUser } from "../middleware/auth.js";
import {
  hasAlphabeticCharacter,
  isAlphabeticCity,
  isAlphabeticName,
} from "../utils/validators.js";

const router = express.Router();

/* GET all feedbacks */
router.get("/", async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ type: "general" }).sort({
      createdAt: -1,
    });
    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: "Error fetching feedbacks" });
  }
});

router.get("/car/:carId", async (req, res) => {
  try {
    const reviews = await Feedback.find({
      type: "car",
      car: req.params.carId,
    })
      .populate("user", "name")
      .sort({ createdAt: -1 });

    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) /
          reviews.length
        : 0;

    res.json({
      success: true,
      reviews,
      averageRating: Number(averageRating.toFixed(1)),
      totalReviews: reviews.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching reviews" });
  }
});

/* POST new feedback */
router.post("/", async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    const location = String(req.body?.location || "").trim();
    const rating = Number(req.body?.rating);
    const comment = String(req.body?.comment || "").trim();

    if (!isAlphabeticName(name)) {
      return res.status(400).json({
        message: "Invalid name.",
      });
    }

    if (!isAlphabeticCity(location)) {
      return res.status(400).json({
        message: "City must contain alphabetic characters only.",
      });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5.",
      });
    }

    if (comment.length < 5 || comment.length > 500) {
      return res.status(400).json({
        message: "Feedback comment must be between 5 and 500 characters.",
      });
    }

    if (!hasAlphabeticCharacter(comment)) {
      return res.status(400).json({
        message: "Feedback must contain alphabetic characters.",
      });
    }

    const feedback = new Feedback({ name, location, rating, comment });
    await feedback.save();
    res.status(201).json(feedback);
  } catch (error) {
    res.status(500).json({ message: "Error saving feedback" });
  }
});

router.post("/car", protect, requireUser, async (req, res) => {
  try {
    const bookingId = String(req.body?.bookingId || "").trim();
    const rating = Number(req.body?.rating);
    const comment = String(req.body?.comment || "").trim();

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking is required.",
      });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5.",
      });
    }

    if (comment.length < 5 || comment.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Review must be between 5 and 500 characters.",
      });
    }

    if (!hasAlphabeticCharacter(comment)) {
      return res.status(400).json({
        success: false,
        message: "Review must contain alphabetic characters.",
      });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      user: req.user._id,
      status: "confirmed",
    }).populate("car", "location");

    if (!booking || !booking.car) {
      return res.status(404).json({
        success: false,
        message: "Confirmed booking not found for this account.",
      });
    }

    const existingReview = await Feedback.findOne({
      type: "car",
      booking: booking._id,
      user: req.user._id,
    });

    if (existingReview) {
      return res.status(409).json({
        success: false,
        message: "You have already reviewed this booking.",
      });
    }

    const review = await Feedback.create({
      type: "car",
      car: booking.car._id,
      booking: booking._id,
      user: req.user._id,
      name: req.user.name,
      location: booking.pickupLocation || booking.car.location || "",
      rating,
      comment,
    });

    res.status(201).json({
      success: true,
      message: "Car review submitted successfully.",
      review,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error saving review" });
  }
});

export default router;
