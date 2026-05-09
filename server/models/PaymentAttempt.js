import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

const paymentAttemptSchema = new mongoose.Schema(
  {
    car: { type: ObjectId, ref: "Car", required: true },
    user: { type: ObjectId, ref: "User", required: true },
    owner: { type: ObjectId, ref: "User", required: true },

    pickupDate: { type: Date, required: true },
    returnDate: { type: Date, required: true },
    pickupLocation: { type: String, default: "" },

    amount: { type: Number, required: true },
    basePrice: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    discountRate: { type: Number, default: 0 },
    discountLabel: { type: String, default: "" },
    currency: { type: String, default: "PKR" },

    paymentProvider: {
      type: String,
      enum: ["jazzcash"],
      default: "jazzcash",
    },
    paymentMethod: {
      type: String,
      enum: ["offline", "online"],
      default: "online",
    },

    status: {
      type: String,
      enum: ["initiated", "pending", "paid", "failed", "cancelled", "expired"],
      default: "initiated",
    },

    booking: { type: ObjectId, ref: "Booking", default: null },

    txnRefNo: { type: String, required: true, unique: true, index: true },
    billReference: { type: String, required: true, index: true },
    jazzCashRefNo: { type: String, default: null },
    jazzCashResponseCode: { type: String, default: null },
    jazzCashResponseMessage: { type: String, default: null },
    jazzCashAuthCode: { type: String, default: null },

    ppmpf_1: { type: String, default: null },
    ppmpf_2: { type: String, default: null },
    ppmpf_3: { type: String, default: null },
    ppmpf_4: { type: String, default: null },
    ppmpf_5: { type: String, default: null },

    returnUrl: { type: String, default: null },
    expiresAt: { type: Date, default: null },
    paidAt: { type: Date, default: null },

    initiatedPayload: { type: mongoose.Schema.Types.Mixed, default: null },
    callbackPayload: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true },
);

paymentAttemptSchema.index({ user: 1, createdAt: -1 });
paymentAttemptSchema.index({ booking: 1 });
paymentAttemptSchema.index({ status: 1, createdAt: -1 });

const PaymentAttempt = mongoose.model("PaymentAttempt", paymentAttemptSchema);

export default PaymentAttempt;
