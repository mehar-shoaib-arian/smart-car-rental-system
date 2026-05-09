import Booking from "../models/Booking.js";
import Car from "../models/Car.js";
import User from "../models/User.js";
import {
  sendBookingStatusEmail,
  sendNewBookingNotificationToOwner,
} from "../configs/emailService.js";
import {
  acquireCarBookingLock,
  releaseCarBookingLock,
} from "../utils/bookingLock.js";
import { calculateSmartBookingPrice } from "../utils/bookingPricing.js";

const MAX_CANCELLATION_REASON_LENGTH = 280;

const normalizeCancellationReason = (value) => {
  const normalized = String(value || "")
    .replace(/\s+/g, " ")
    .trim();

  return normalized.slice(0, MAX_CANCELLATION_REASON_LENGTH);
};

// Function to Check Availability of Car for a given Date
const checkAvailability = async (car, pickupDate, returnDate) => {
  const bookings = await Booking.find({
    car,
    status: { $ne: "cancelled" },
    pickupDate: { $lte: returnDate },
    returnDate: { $gte: pickupDate },
  });

  return bookings.length === 0;
};

const getAlternativeCars = async ({
  carData,
  pickupDate,
  returnDate,
  excludeCarId,
}) => {
  if (!carData) return [];

  const candidateCars = await Car.find({
    _id: { $ne: excludeCarId },
    owner: { $ne: null },
    isAvailable: true,
    location: carData.location,
    category: carData.category,
  }).sort({ pricePerDay: 1, year: -1 });

  const alternatives = [];

  for (const candidate of candidateCars) {
    const isCandidateAvailable = await checkAvailability(
      candidate._id,
      pickupDate,
      returnDate,
    );

    if (!isCandidateAvailable) continue;

    alternatives.push(candidate);
    if (alternatives.length >= 3) break;
  }

  return alternatives;
};

// API to Check Availability of Cars for the given Date and location
export const checkAvailabilityOfCar = async (req, res) => {
  try {
    const { location, pickupDate, returnDate } = req.body;

    // fetch all available cars for the given location
    const cars = await Car.find({ location, isAvailable: true });

    // check car availability for the given date range using promise
    const availableCarsPromises = cars.map(async (car) => {
      const isAvailable = await checkAvailability(
        car._id,
        pickupDate,
        returnDate,
      );
      return { ...car._doc, isAvailable };
    });

    let availableCars = await Promise.all(availableCarsPromises);
    availableCars = availableCars.filter((car) => car.isAvailable === true);

    res.json({ success: true, availableCars });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// API to create booking
export const createBooking = async (req, res) => {
  let bookingLock = null;
  const selectedCarId = req.body.carId || req.body.car;
  try {
    const { _id } = req.user;
    const { car, carId, pickupDate, returnDate } = req.body;
    const selectedCarId = carId || car;

    if (!selectedCarId || !pickupDate || !returnDate) {
      return res.status(400).json({
        success: false,
        message: "carId, pickupDate and returnDate are required",
      });
    }

    if (new Date(returnDate) <= new Date(pickupDate)) {
      return res.status(400).json({
        success: false,
        message: "Return date must be after pickup date",
      });
    }

    bookingLock = await acquireCarBookingLock(selectedCarId);

    const carData = await Car.findById(selectedCarId);
    if (!carData) {
      return res.status(404).json({ success: false, message: "Car not found" });
    }
    if (!carData.owner) {
      return res.status(400).json({
        success: false,
        message: "This car is currently unavailable for booking",
      });
    }

    const isAvailable = await checkAvailability(
      selectedCarId,
      pickupDate,
      returnDate,
    );
    if (!isAvailable) {
      const alternatives = await getAlternativeCars({
        carData,
        pickupDate,
        returnDate,
        excludeCarId: selectedCarId,
      });
      return res.status(409).json({
        success: false,
        message: "Car is not available for the selected dates",
        alternatives,
      });
    }

    const pricing = await calculateSmartBookingPrice({
      car: carData,
      userId: _id,
      pickupDate,
      returnDate,
    });

    const newBooking = await Booking.create({
      car: selectedCarId,
      owner: carData.owner,
      user: _id,
      pickupDate,
      returnDate,
      pickupLocation: String(carData.location || "").trim(),
      price: pricing.totalPrice,
      basePrice: pricing.basePrice,
      discountAmount: pricing.discountAmount,
      discountRate: pricing.discountRate,
      discountLabel: pricing.discountLabel,
    });

    // ── Send emails (non-blocking) ──
    try {
      const [bookingUser, ownerUser] = await Promise.all([
        User.findById(_id).select("name email"),
        User.findById(carData.owner).select("name email"),
      ]);

      // Notify owner about new booking
      if (ownerUser?.email) {
        sendNewBookingNotificationToOwner({
          ownerEmail: ownerUser.email,
          ownerName: ownerUser.name,
          userName: bookingUser?.name || "Customer",
          userEmail: bookingUser?.email || "",
          carBrand: carData.brand,
          carModel: carData.model,
          pickupDate,
          returnDate,
          price: pricing.totalPrice,
          location: carData.location,
        });
      }
    } catch (emailErr) {
      console.log("[Email] Booking notification error:", emailErr.message);
    }

    res.json({
      success: true,
      message: "Booking Created",
      price: pricing.totalPrice,
      pricing,
      bookingId: newBooking._id,
    });
  } catch (error) {
    console.log(error.message);
    res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message });
  } finally {
    await releaseCarBookingLock(selectedCarId, bookingLock?.token);
  }
};

// API to List User Bookings
export const getUserBookings = async (req, res) => {
  try {
    const { _id } = req.user;
    const bookings = await Booking.find({ user: _id })
      .populate("car")
      .sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// API to get Owner Bookings
export const getOwnerBookings = async (req, res) => {
  try {
    if (!["owner", "admin"].includes(req.user.role)) {
      return res.json({ success: false, message: "Unauthorized" });
    }

    const bookings = await Booking.find({ owner: req.user._id })
      .populate({
        path: "car",
        select:
          "brand model image pricePerDay location latitude longitude currentLatitude currentLongitude liveLocationUpdatedAt",
      })
      .populate({
        path: "user",
        select: "name email",
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// API to change booking status
export const changeBookingStatus = async (req, res) => {
  try {
    const { _id, role } = req.user;
    const { bookingId, status, cancellationReason, cancellationDetails } =
      req.body;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    // Owner can confirm, cancel, or change any status
    const isOwner = booking.owner.toString() === _id.toString();

    // User can only cancel their own pending bookings
    const isUser = booking.user.toString() === _id.toString();

    if (isOwner) {
      // Owner can set any valid status
      const validStatuses = ["pending", "confirmed", "cancelled"];
      if (!validStatuses.includes(status)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid status" });
      }

      if (status === "cancelled") {
        const normalizedReason = normalizeCancellationReason(
          cancellationReason || cancellationDetails,
        );

        if (!normalizedReason) {
          return res.status(400).json({
            success: false,
            message: "Cancellation reason is required.",
          });
        }

        booking.cancelledAt = new Date();
        booking.cancelledByRole = role === "admin" ? "admin" : "owner";
        booking.cancellationReason = normalizedReason;
        booking.cancellationDetails = normalizedReason;
      } else {
        booking.cancelledAt = null;
        booking.cancelledByRole = null;
        booking.cancellationReason = null;
        booking.cancellationDetails = null;
      }

      booking.status = status;
    } else if (
      isUser &&
      status === "cancelled" &&
      booking.status === "pending"
    ) {
      // User can only cancel their own pending booking
      booking.status = "cancelled";
      booking.cancelledAt = new Date();
      booking.cancelledByRole = "user";
      booking.cancellationReason = "Cancelled by customer before confirmation.";
      booking.cancellationDetails = "Cancelled by customer before confirmation.";
    } else {
      return res.json({ success: false, message: "Unauthorized" });
    }

    await booking.save();

    // ── Send status email to user (non-blocking) ──
    try {
      if (status === "confirmed" || status === "cancelled") {
        const populatedBooking = await Booking.findById(bookingId)
          .populate("car", "brand model location pricePerDay")
          .populate("user", "name email");

        if (populatedBooking?.user?.email) {
          sendBookingStatusEmail({
            userEmail: populatedBooking.user.email,
            userName: populatedBooking.user.name,
            status,
            carBrand: populatedBooking.car?.brand || "",
            carModel: populatedBooking.car?.model || "",
            pickupDate: populatedBooking.pickupDate,
            returnDate: populatedBooking.returnDate,
            price: populatedBooking.price,
            location: populatedBooking.car?.location || "",
            cancellationReason: populatedBooking.cancellationReason,
            cancellationDetails: populatedBooking.cancellationDetails,
          });
        }
      }
    } catch (emailErr) {
      console.log("[Email] Status change email error:", emailErr.message);
    }

    res.json({ success: true, message: "Status Updated" });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};
