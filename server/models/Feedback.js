import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    name: String,
    location: String,
    rating: Number,
    comment: String,
  },
  { timestamps: true }
);

export default mongoose.model("Feedback", feedbackSchema);
