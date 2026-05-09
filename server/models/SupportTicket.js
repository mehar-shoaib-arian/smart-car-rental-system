import mongoose from "mongoose";

const supportMessageSchema = new mongoose.Schema(
  {
    senderRole: {
      type: String,
      enum: ["user", "owner", "admin", "system"],
      required: true,
    },
    senderName: { type: String, default: "" },
    text: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const supportTicketSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },
    category: {
      type: String,
      enum: [
        "vehicle_issue",
        "pickup_issue",
        "return_issue",
        "payment_issue",
        "driver_safety",
        "other",
      ],
      default: "other",
    },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    messages: {
      type: [supportMessageSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved"],
      default: "open",
    },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

const SupportTicket = mongoose.model("SupportTicket", supportTicketSchema);

export default SupportTicket;
