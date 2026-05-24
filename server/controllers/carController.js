import Car from "../models/Car.js";
import Booking from "../models/Booking.js";

// Get all cars
export const getAllCars = async (req, res) => {
  try {
    const cars = await Car.find();
    res.json(cars);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single car by ID
export const getCarById = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ message: "Car not found" });
    res.json(car);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCarAvailability = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id).select("_id");
    if (!car) return res.status(404).json({ message: "Car not found" });

    const bookings = await Booking.find({
      car: req.params.id,
      status: { $ne: "cancelled" },
    })
      .select("pickupDate returnDate status")
      .sort({ pickupDate: 1 });

    const unavailableRanges = bookings.map((booking) => ({
      pickupDate: booking.pickupDate,
      returnDate: booking.returnDate,
      status: booking.status,
    }));

    res.json({ success: true, unavailableRanges });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
