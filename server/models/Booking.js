import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

const bookingSchema = new mongoose.Schema(
  {
    car: { type: ObjectId, ref: "Car", required: true },
    user: { type: ObjectId, ref: "User", required: true },
    owner: { type: ObjectId, ref: "User", required: true },
    pickupDate: { type: Date, required: true },
    returnDate: { type: Date, required: true },
    pickupLocation: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },
    overdueAlertSent: { type: Boolean, default: false },
    overdueAlertSentAt: { type: Date, default: null },
    lastOverdueCheckedAt: { type: Date, default: null },
    price: { type: Number, required: true },
    basePrice: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    discountRate: { type: Number, default: 0 },
    discountLabel: { type: String, default: "" },
    paymentMethod: {
      type: String,
      enum: ["offline", "online"],
      default: "offline",
    },
    paymentProvider: {
      type: String,
      enum: ["jazzcash", null],
      default: null,
    },
    jazzCashTxnRefNo: { type: String, default: null },
    jazzCashBillReference: { type: String, default: null },
    jazzCashReferenceNo: { type: String, default: null },
    jazzCashResponseCode: { type: String, default: null },
    jazzCashResponseMessage: { type: String, default: null },
    jazzCashAuthCode: { type: String, default: null },
    onlinePaymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "cancelled", "expired", null],
      default: null,
    },
    onlinePaidAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    cancelledByRole: {
      type: String,
      enum: ["user", "owner", "admin", null],
      default: null,
    },
    cancellationReasonCode: { type: String, default: null },
    cancellationReason: { type: String, default: null },
    cancellationDetails: { type: String, default: null },
  },
  { timestamps: true },
);

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
