import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

const carSchema = new mongoose.Schema(
  {
    owner: { type: ObjectId, ref: "User" },
    brand: { type: String, required: true },
    model: { type: String, required: true },
    image: { type: String, required: true },
    year: { type: Number, required: true },
    category: { type: String, required: true },
    seating_capacity: { type: Number, required: true },
    fuel_type: { type: String, required: true },
    transmission: { type: String, required: true },
    pricePerDay: { type: Number, required: true },
    location: { type: String, required: true },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    currentLatitude: { type: Number, default: null },
    currentLongitude: { type: Number, default: null },
    liveLocationUpdatedAt: { type: Date, default: null },
    trackingSimulationActive: { type: Boolean, default: false },
    trackingSimulationStep: { type: Number, default: 0 },
    trackingSimulationUpdatedAt: { type: Date, default: null },
    description: { type: String, required: true },
    isAvailable: { type: Boolean, default: true },
    bookingLockUntil: { type: Date, default: null },
    bookingLockToken: { type: String, default: null },
  },
  { timestamps: true },
);

const Car = mongoose.model("Car", carSchema);

export default Car;
