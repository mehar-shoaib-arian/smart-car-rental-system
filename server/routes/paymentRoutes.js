import express from "express";
import Booking from "../models/Booking.js";
import Car from "../models/Car.js";
import User from "../models/User.js";
import PaymentAttempt from "../models/PaymentAttempt.js";
import { protect, requireUser } from "../middleware/auth.js";
import { sendBookingStatusEmail } from "../configs/emailService.js";
import {
  buildJazzCashCheckoutPayload,
  formatJazzCashDateTime,
  generateJazzCashSecureHash,
  generateJazzCashTxnRefNo,
  getJazzCashCheckoutUrl,
  parseJazzCashDateTime,
  sanitizeJazzCashText,
  verifyJazzCashSecureHash,
} from "../utils/jazzcash.js";
import {
  acquireCarBookingLock,
  releaseCarBookingLock,
} from "../utils/bookingLock.js";
import { calculateSmartBookingPrice } from "../utils/bookingPricing.js";

const router = express.Router();

const JAZZCASH_SUCCESS_CODES = new Set(["000"]);
const JAZZCASH_PENDING_CODES = new Set(["121", "124"]);
const JAZZCASH_CANCELLED_CODES = new Set(["157", "158"]);

const getEnv = (name, fallback = "") => {
  const value = process.env[name];
  return value === undefined || value === null ? fallback : String(value);
};

const getClientBaseUrl = () =>
  getEnv("CLIENT_URL", "http://localhost:5173").replace(/\/$/, "");

const getServerBaseUrl = () =>
  getEnv("SERVER_URL", "http://localhost:3000").replace(/\/$/, "");

const ensureValidPublicUrl = (rawUrl, envName) => {
  const value = String(rawUrl || "").trim();

  if (!value) {
    throw new Error(`${envName} is not configured.`);
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(value);
  } catch {
    throw new Error(`${envName} must be a valid absolute URL.`);
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  const blockedHosts = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

  if (blockedHosts.has(hostname)) {
    throw new Error(
      `${envName} cannot use localhost. Configure a public URL for JazzCash callbacks.`,
    );
  }

  return parsedUrl.toString().replace(/\/$/, "");
};

const getJazzCashReturnUrl = () => {
  const explicitReturnUrl = getEnv("JAZZCASH_RETURN_URL");

  if (explicitReturnUrl) {
    return ensureValidPublicUrl(explicitReturnUrl, "JAZZCASH_RETURN_URL");
  }

  const serverBaseUrl = ensureValidPublicUrl(
    "SERVER_URL" in process.env ? process.env.SERVER_URL : "",
    "SERVER_URL",
  );
  return `${serverBaseUrl}/api/payment/jazzcash/callback`;
};

const getJazzCashConfig = () => {
  const merchantId = getEnv("JAZZCASH_MERCHANT_ID");
  const password = getEnv("JAZZCASH_PASSWORD");
  const integritySalt =
    getEnv("JAZZCASH_INTEGERITY_SALT") || getEnv("JAZZCASH_INTEGRITY_SALT");
  const txnType = getEnv("JAZZCASH_TXN_TYPE", "MWALLET");
  const version = getEnv("JAZZCASH_VERSION", "1.1");
  const language = getEnv("JAZZCASH_LANGUAGE", "EN");
  const currency = getEnv("JAZZCASH_CURRENCY", "PKR");
  const subMerchantId = getEnv("JAZZCASH_SUBMERCHANT_ID", "");
  const bankId = getEnv("JAZZCASH_BANK_ID", "");
  const productId = getEnv("JAZZCASH_PRODUCT_ID", "");
  const sandboxValue = getEnv("JAZZCASH_SANDBOX", "true").toLowerCase();
  const sandbox = !["false", "0", "no"].includes(sandboxValue);

  if (!merchantId || !password || !integritySalt) {
    throw new Error(
      "JazzCash configuration is incomplete. Set JAZZCASH_MERCHANT_ID, JAZZCASH_PASSWORD, and JAZZCASH_INTEGRITY_SALT.",
    );
  }

  return {
    merchantId,
    password,
    integritySalt,
    txnType,
    version,
    language,
    currency,
    subMerchantId,
    bankId,
    productId,
    sandbox,
  };
};

const toDate = (value) => new Date(value);

const isCancelledLike = (responseCode = "", responseMessage = "") => {
  const code = String(responseCode || "");
  const message = String(responseMessage || "").toLowerCase();

  return (
    JAZZCASH_CANCELLED_CODES.has(code) ||
    message.includes("cancel") ||
    message.includes("declin") ||
    message.includes("abort") ||
    message.includes("fail")
  );
};

const determineAttemptStatus = (responseCode = "", responseMessage = "") => {
  const code = String(responseCode || "");

  if (JAZZCASH_SUCCESS_CODES.has(code)) return "paid";
  if (JAZZCASH_PENDING_CODES.has(code)) return "pending";
  if (isCancelledLike(code, responseMessage)) return "cancelled";
  return "failed";
};

const findOverlappingBooking = async (carId, pickupDate, returnDate) =>
  Booking.findOne({
    car: carId,
    status: { $ne: "cancelled" },
    pickupDate: { $lte: toDate(returnDate) },
    returnDate: { $gte: toDate(pickupDate) },
  });

const ensureBookingRequestIsValid = ({ carId, pickupDate, returnDate }) => {
  if (!carId || !pickupDate || !returnDate) {
    const error = new Error("carId, pickupDate and returnDate are required.");
    error.statusCode = 400;
    throw error;
  }

  if (toDate(returnDate) <= toDate(pickupDate)) {
    const error = new Error("Return date must be after pickup date.");
    error.statusCode = 400;
    throw error;
  }
};

const verifyUserCanBook = (req) => {
  if (!req.user?._id) {
    const error = new Error("Unauthorized.");
    error.statusCode = 401;
    throw error;
  }
};

const normalizeJazzCashCallbackPayload = (body = {}) => {
  if (!body || typeof body !== "object") return {};

  const normalized = {};
  for (const [key, value] of Object.entries(body)) {
    normalized[key] = Array.isArray(value) ? value[0] : value;
  }

  return normalized;
};

const createBookingFromAttempt = async (attempt) => {
  let bookingLock = null;
  const existingBooking = attempt.booking
    ? await Booking.findById(attempt.booking).populate(
        "car",
        "brand model location pricePerDay image category year",
      )
    : null;

  if (existingBooking) {
    return existingBooking;
  }

  try {
    bookingLock = await acquireCarBookingLock(attempt.car);

    const overlappingBooking = await findOverlappingBooking(
      attempt.car,
      attempt.pickupDate,
      attempt.returnDate,
    );

    if (overlappingBooking) {
      const error = new Error(
        "The selected dates are no longer available for this car.",
      );
      error.statusCode = 409;
      throw error;
    }

    const booking = await Booking.create({
      car: attempt.car,
      user: attempt.user,
      owner: attempt.owner,
      pickupDate: attempt.pickupDate,
      returnDate: attempt.returnDate,
      pickupLocation: attempt.pickupLocation,
      price: attempt.amount,
      basePrice: attempt.basePrice,
      discountAmount: attempt.discountAmount,
      discountRate: attempt.discountRate,
      discountLabel: attempt.discountLabel,
      status: "confirmed",
      paymentMethod: "online",
      paymentProvider: "jazzcash",
      jazzCashTxnRefNo: attempt.txnRefNo,
      jazzCashBillReference: attempt.billReference,
      jazzCashReferenceNo: attempt.jazzCashRefNo,
      jazzCashResponseCode: attempt.jazzCashResponseCode,
      jazzCashResponseMessage: attempt.jazzCashResponseMessage,
      jazzCashAuthCode: attempt.jazzCashAuthCode,
      onlinePaymentStatus: "paid",
      onlinePaidAt: attempt.paidAt || new Date(),
    });

    attempt.booking = booking._id;
    await attempt.save();

    return Booking.findById(booking._id).populate(
      "car",
      "brand model location pricePerDay image category year",
    );
  } finally {
    await releaseCarBookingLock(attempt.car, bookingLock?.token);
  }
};

const sendJazzCashConfirmationEmail = async (booking) => {
  try {
    const [car, bookingUser] = await Promise.all([
      Car.findById(booking.car).select("brand model location pricePerDay"),
      User.findById(booking.user).select("name email"),
    ]);

    if (bookingUser?.email) {
      sendBookingStatusEmail({
        userEmail: bookingUser.email,
        userName: bookingUser.name,
        status: "confirmed",
        carBrand: car?.brand || "",
        carModel: car?.model || "",
        pickupDate: booking.pickupDate,
        returnDate: booking.returnDate,
        price: Number(booking.price),
        location: car?.location || "",
      });
    }
  } catch (emailErr) {
    console.log("[JazzCash] Confirmation email error:", emailErr.message);
  }
};

const finalizeSuccessfulAttempt = async (attempt, callbackPayload = null) => {
  if (callbackPayload) {
    attempt.callbackPayload = callbackPayload;
    attempt.jazzCashResponseCode =
      callbackPayload.pp_ResponseCode || attempt.jazzCashResponseCode;
    attempt.jazzCashResponseMessage =
      callbackPayload.pp_ResponseMessage || attempt.jazzCashResponseMessage;
    attempt.jazzCashRefNo =
      callbackPayload.pp_RetreivalReferenceNo ||
      callbackPayload.pp_RetrievalReferenceNo ||
      attempt.jazzCashRefNo;
    attempt.jazzCashAuthCode =
      callbackPayload.pp_AuthCode || attempt.jazzCashAuthCode;
  }

  attempt.status = "paid";
  attempt.paidAt = attempt.paidAt || new Date();
  await attempt.save();

  try {
    const booking = await createBookingFromAttempt(attempt);
    await sendJazzCashConfirmationEmail(booking);
    return booking;
  } catch (error) {
    attempt.status = "failed";
    attempt.jazzCashResponseMessage = error.message;
    await attempt.save();
    throw error;
  }
};

const buildPaymentPageHtml = ({
  actionUrl,
  payload,
  title = "Redirecting to JazzCash",
}) => {
  const inputs = Object.entries(payload)
    .map(
      ([name, value]) =>
        `<input type="hidden" name="${String(name).replace(/"/g, "&quot;")}" value="${String(
          value ?? "",
        ).replace(/"/g, "&quot;")}" />`,
    )
    .join("\n");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body {
        font-family: Arial, sans-serif;
        background: #f8fafc;
        color: #1f2937;
        display: grid;
        place-items: center;
        min-height: 100vh;
        margin: 0;
      }
      .card {
        background: white;
        border-radius: 16px;
        padding: 32px;
        width: min(92vw, 520px);
        box-shadow: 0 10px 30px rgba(0,0,0,0.08);
        text-align: center;
      }
      .spinner {
        width: 44px;
        height: 44px;
        margin: 0 auto 16px;
        border: 4px solid #e5e7eb;
        border-top-color: #7c3aed;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      p {
        color: #6b7280;
        margin-top: 8px;
      }
      button {
        margin-top: 18px;
        border: none;
        border-radius: 10px;
        padding: 12px 18px;
        background: #7c3aed;
        color: white;
        font-weight: 600;
        cursor: pointer;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="spinner"></div>
      <h2>${title}</h2>
      <p>Please wait while we transfer you to the JazzCash payment page.</p>
      <form id="jazzcash-payment-form" method="POST" action="${actionUrl}">
        ${inputs}
        <button type="submit">Continue to JazzCash</button>
      </form>
    </div>
    <script>
      window.addEventListener("load", function () {
        var form = document.getElementById("jazzcash-payment-form");
        if (form) form.submit();
      });
    </script>
  </body>
</html>`;
};

router.post(
  "/create-checkout-session",
  protect,
  requireUser,
  async (req, res) => {
    try {
      verifyUserCanBook(req);

      const { carId, pickupDate, returnDate } = req.body;
      ensureBookingRequestIsValid({ carId, pickupDate, returnDate });

      const car = await Car.findById(carId);
      if (!car) {
        return res
          .status(404)
          .json({ success: false, message: "Car not found." });
      }

      if (!car.owner) {
        return res.status(400).json({
          success: false,
          message: "This car is not available for booking.",
        });
      }

      const overlapping = await findOverlappingBooking(
        carId,
        pickupDate,
        returnDate,
      );
      if (overlapping) {
        return res.status(409).json({
          success: false,
          message: "Car is not available for the selected dates.",
        });
      }

      const pricing = await calculateSmartBookingPrice({
        car,
        userId: req.user._id,
        pickupDate,
        returnDate,
      });
      const config = getJazzCashConfig();

      const txnRefNo = generateJazzCashTxnRefNo("T");
      const billReference = `CAR-${String(car._id).slice(-6).toUpperCase()}-${Date.now()}`;
      const returnUrl = getJazzCashReturnUrl();

      const payload = buildJazzCashCheckoutPayload({
        merchantId: config.merchantId,
        password: config.password,
        integritySalt: config.integritySalt,
        returnUrl,
        amount: pricing.totalPrice,
        billReference,
        description: sanitizeJazzCashText(
          `${car.brand} ${car.model} rental from ${pickupDate} to ${returnDate}`,
          "Car rental booking",
        ),
        txnRefNo,
        txnDateTime: formatJazzCashDateTime(new Date()),
        txnType: config.txnType,
        version: config.version,
        language: config.language,
        txnCurrency: config.currency,
        subMerchantId: config.subMerchantId,
        bankId: config.bankId,
        productId: config.productId,
        ppmpf1: String(req.user._id),
        ppmpf2: String(car._id),
        ppmpf3: pickupDate,
        ppmpf4: returnDate,
        ppmpf5: getClientBaseUrl(),
      });

      const attempt = await PaymentAttempt.create({
        car: car._id,
        user: req.user._id,
        owner: car.owner,
        pickupDate: toDate(pickupDate),
        returnDate: toDate(returnDate),
        pickupLocation: String(car.location || "").trim(),
        amount: pricing.totalPrice,
        basePrice: pricing.basePrice,
        discountAmount: pricing.discountAmount,
        discountRate: pricing.discountRate,
        discountLabel: pricing.discountLabel,
        currency: config.currency,
        status: "initiated",
        txnRefNo,
        billReference,
        returnUrl,
        expiresAt:
          parseJazzCashDateTime(payload.pp_TxnExpiryDateTime) ||
          toDate(payload.pp_TxnExpiryDateTime),
        ppmpf_1: payload.ppmpf_1,
        ppmpf_2: payload.ppmpf_2,
        ppmpf_3: payload.ppmpf_3,
        ppmpf_4: payload.ppmpf_4,
        ppmpf_5: payload.ppmpf_5,
        initiatedPayload: payload,
      });

      const jazzCashUrl = getJazzCashCheckoutUrl({ sandbox: config.sandbox });
      const html = buildPaymentPageHtml({
        actionUrl: jazzCashUrl,
        payload,
        title: "Redirecting to JazzCash",
      });

      res.json({
        success: true,
        provider: "jazzcash",
        paymentAttemptId: attempt._id,
        txnRefNo,
        action: jazzCashUrl,
        method: "POST",
        fields: payload,
        html,
      });
    } catch (error) {
      console.error("[JazzCash] Create checkout error:", error.message);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Payment initiation failed.",
      });
    }
  },
);

router.post("/verify-payment", protect, requireUser, async (req, res) => {
  try {
    const { txnRefNo, sessionId, paymentAttemptId } = req.body;
    const lookupTxnRefNo = txnRefNo || sessionId;

    let attempt = null;

    if (paymentAttemptId) {
      attempt = await PaymentAttempt.findById(paymentAttemptId);
    }

    if (!attempt && lookupTxnRefNo) {
      attempt = await PaymentAttempt.findOne({ txnRefNo: lookupTxnRefNo });
    }

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Payment attempt not found.",
      });
    }

    if (String(attempt.user) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized payment verification request.",
      });
    }

    if (attempt.status === "paid") {
      const booking = attempt.booking
        ? await Booking.findById(attempt.booking).populate(
            "car",
            "brand model location pricePerDay image category year",
          )
        : await createBookingFromAttempt(attempt);

      return res.json({
        success: true,
        message: "Payment already verified.",
        booking,
        alreadyExists: true,
      });
    }

    if (attempt.status === "pending" || attempt.status === "initiated") {
      return res.status(202).json({
        success: false,
        pending: true,
        message: "Payment is still pending confirmation from JazzCash.",
      });
    }

    return res.status(400).json({
      success: false,
      message:
        attempt.jazzCashResponseMessage ||
        "Payment was not completed successfully.",
      responseCode: attempt.jazzCashResponseCode,
    });
  } catch (error) {
    console.error("[JazzCash] Verify payment error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/jazzcash/callback", async (req, res) => {
  try {
    const payload = normalizeJazzCashCallbackPayload(req.body);
    const config = getJazzCashConfig();

    const txnRefNo = payload.pp_TxnRefNo;
    const responseCode = payload.pp_ResponseCode || "";
    const responseMessage = payload.pp_ResponseMessage || "";

    if (!txnRefNo) {
      return res.status(400).send("Missing pp_TxnRefNo.");
    }

    const attempt = await PaymentAttempt.findOne({ txnRefNo });
    if (!attempt) {
      return res.status(404).send("Payment attempt not found.");
    }

    const secureHash = String(payload.pp_SecureHash || "").trim();
    const isHashValid =
      Boolean(secureHash) &&
      verifyJazzCashSecureHash(payload, config.integritySalt);

    attempt.callbackPayload = payload;
    attempt.jazzCashResponseCode = responseCode;
    attempt.jazzCashResponseMessage = responseMessage;
    attempt.jazzCashRefNo =
      payload.pp_RetreivalReferenceNo ||
      payload.pp_RetrievalReferenceNo ||
      attempt.jazzCashRefNo;
    attempt.jazzCashAuthCode = payload.pp_AuthCode || attempt.jazzCashAuthCode;

    if (!isHashValid) {
      attempt.status = "failed";
      await attempt.save();

      return res.redirect(
        `${getClientBaseUrl()}/payment-success?status=failed&txnRefNo=${encodeURIComponent(
          txnRefNo,
        )}&message=${encodeURIComponent("JazzCash hash verification failed")}`,
      );
    }

    const attemptStatus = determineAttemptStatus(responseCode, responseMessage);

    if (attemptStatus === "paid") {
      await finalizeSuccessfulAttempt(attempt, payload);

      return res.redirect(
        `${getClientBaseUrl()}/payment-success?status=success&txnRefNo=${encodeURIComponent(
          txnRefNo,
        )}`,
      );
    }

    attempt.status = attemptStatus;
    await attempt.save();

    const targetStatus = attemptStatus === "cancelled" ? "cancelled" : "failed";

    return res.redirect(
      `${getClientBaseUrl()}/payment-success?status=${encodeURIComponent(
        targetStatus,
      )}&txnRefNo=${encodeURIComponent(txnRefNo)}&message=${encodeURIComponent(
        responseMessage || "Payment was not completed.",
      )}`,
    );
  } catch (error) {
    console.error("[JazzCash] Callback error:", error.message);
    res.status(500).send("JazzCash callback processing failed.");
  }
});

router.post("/webhook", async (req, res) => {
  res.status(200).json({
    received: true,
    provider: "jazzcash",
    message:
      "JazzCash webhook route is reserved. Use /jazzcash/callback for redirect flow.",
  });
});

export default router;
