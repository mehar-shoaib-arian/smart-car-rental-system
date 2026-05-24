import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

const feedbackSchema = new mongoose.Schema(
  {
    name: String,
    location: String,
    rating: Number,
    comment: String,
    car: { type: ObjectId, ref: "Car", default: null },
    user: { type: ObjectId, ref: "User", default: null },
    booking: { type: ObjectId, ref: "Booking", default: null },
    type: {
      type: String,
      enum: ["general", "car"],
      default: "general",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Feedback", feedbackSchema);
