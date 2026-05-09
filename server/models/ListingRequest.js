import mongoose from "mongoose";

const listingRequestSchema = new mongoose.Schema(
  {
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    cnic: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    year: { type: Number, required: true },
    category: { type: String, required: true, trim: true },
    transmission: { type: String, required: true, trim: true },
    fuel_type: { type: String, required: true, trim: true },
    seating_capacity: { type: Number, required: true },
    pricePerDay: { type: Number, required: true },
    location: { type: String, required: true, trim: true },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    description: { type: String, required: true, trim: true },
    image: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

const ListingRequest = mongoose.model("ListingRequest", listingRequestSchema);

export default ListingRequest;
