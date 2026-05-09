import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useAppContext } from "../context/contextStore";
import { assets } from "../assets/assets";
import { getCarImageSrc, handleCarImageError } from "../utils/imageFallback";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { axios, currency } = useAppContext();

  const txnRefNo = searchParams.get("txnRefNo");
  const redirectStatus = searchParams.get("status");
  const redirectMessage = searchParams.get("message");

  const [status, setStatus] = useState("verifying");
  const [booking, setBooking] = useState(null);
  const verifiedRef = useRef(false);

  useEffect(() => {
    if (!txnRefNo) {
      setStatus("failed");
      return;
    }

    if (verifiedRef.current) return;
    verifiedRef.current = true;

    const verifyPayment = async () => {
      try {
        const token = sessionStorage.getItem("token");

        if (!token) {
          setStatus("failed");
          toast.error("Please login to verify your JazzCash payment.");
          return;
        }

        if (redirectStatus === "cancelled") {
          setStatus("failed");
          toast.error(redirectMessage || "JazzCash payment was cancelled.");
          return;
        }

        if (redirectStatus === "failed") {
          setStatus("failed");
          toast.error(redirectMessage || "JazzCash payment failed.");
          return;
        }

        const { data } = await axios.post(
          "/api/payment/verify-payment",
          { txnRefNo },
          { headers: { Authorization: `Bearer ${token}` } },
        );

        if (data.success) {
          setBooking(data.booking);
          setStatus("success");
          toast.success("JazzCash payment confirmed! Booking is confirmed.");
          return;
        }

        if (data.pending) {
          setStatus("failed");
          toast.error(
            data.message ||
              "Your JazzCash payment is still pending. Please check again shortly.",
          );
          return;
        }

        setStatus("failed");
        toast.error(data.message || "JazzCash payment verification failed.");
      } catch (error) {
        console.error("Payment verification error:", error);
        setStatus("failed");
        toast.error(
          error.response?.data?.message ||
            redirectMessage ||
            "JazzCash payment verification failed. Please contact support.",
        );
      }
    };

    verifyPayment();
  }, [axios, redirectMessage, redirectStatus, txnRefNo]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";

    return new Date(dateStr).toLocaleDateString("en-PK", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const noOfDays = (() => {
    if (!booking?.pickupDate || !booking?.returnDate) return 1;

    return Math.ceil(
      (new Date(booking.returnDate) - new Date(booking.pickupDate)) /
        (1000 * 60 * 60 * 24),
    );
  })();
  const discountAmount = Number(booking?.discountAmount || 0);
  const basePrice = Number(
    booking?.basePrice || (booking?.car?.pricePerDay || 0) * noOfDays,
  );

  if (status === "verifying") {
    return (
      <div className="min-h-screen bg-light flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Verifying Your Payment...
          </h2>
          <p className="text-sm text-gray-400">
            Please wait while we confirm your booking.
          </p>
        </div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="min-h-screen bg-light flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-10 text-center">
          <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-5">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Payment Verification Failed
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            We could not verify your JazzCash payment. If you were charged,
            please contact support with your transaction reference.
          </p>

          {txnRefNo && (
            <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-4 py-2 mb-6 font-mono break-all">
              Transaction: {txnRefNo}
            </p>
          )}

          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate("/cars")}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl cursor-pointer transition-all text-sm"
            >
              Browse Cars
            </button>
            <button
              onClick={() => navigate("/")}
              className="w-full py-3 border border-borderColor hover:bg-gray-50 text-gray-600 font-medium rounded-xl cursor-pointer transition-all text-sm"
            >
              Go Home
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-borderColor">
            <p className="text-xs text-gray-400">
              Need help? Contact us at{" "}
              <a
                href="mailto:mshoaib6307181@gmail.com"
                className="text-blue-500 hover:text-blue-600"
              >
                mshoaib6307181@gmail.com
              </a>{" "}
              or call{" "}
              <a
                href="tel:+923008143370"
                className="text-blue-500 hover:text-blue-600"
              >
                +92 300 8143370
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-green-400 px-8 py-10 text-white text-center">
          <div className="flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mx-auto mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-1">Payment Successful!</h1>
          <p className="text-green-100 text-sm">
            Your booking is confirmed. A confirmation email has been sent to
            you.
          </p>

          <div className="inline-flex items-center gap-2 mt-4 bg-white/20 px-4 py-1.5 rounded-full text-sm">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
            Online Payment - Confirmed
          </div>
        </div>

        {booking && (
          <>
            <div className="flex items-center gap-4 px-8 py-5 border-b border-borderColor">
              {booking.car?.image && (
                <img
                  src={getCarImageSrc(booking.car.image)}
                  alt=""
                  onError={handleCarImageError}
                  className="w-24 h-16 object-cover rounded-xl shadow-sm"
                />
              )}
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-800">
                  {booking.car?.brand} {booking.car?.model}
                </h2>
                <p className="text-sm text-gray-500">
                  {booking.car?.category} / {booking.car?.year}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <img
                    src={assets.location_icon}
                    alt=""
                    className="w-3.5 h-3.5 opacity-60"
                  />
                  <span className="text-xs text-gray-400">
                    {booking.pickupLocation || booking.car?.location}
                  </span>
                </div>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full border border-green-200 whitespace-nowrap">
                Confirmed
              </span>
            </div>

            <div className="px-8 py-6 space-y-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Booking Details
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-borderColor">
                  <img
                    src={assets.calendar_icon_colored}
                    alt=""
                    className="w-5 h-5 mt-0.5"
                  />
                  <div>
                    <p className="text-xs text-gray-400">Pick-up Date</p>
                    <p className="text-sm font-medium text-gray-700">
                      {formatDate(booking.pickupDate)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-borderColor">
                  <img
                    src={assets.calendar_icon_colored}
                    alt=""
                    className="w-5 h-5 mt-0.5"
                  />
                  <div>
                    <p className="text-xs text-gray-400">Return Date</p>
                    <p className="text-sm font-medium text-gray-700">
                      {formatDate(booking.returnDate)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-borderColor">
                  <img
                    src={assets.listIconColored}
                    alt=""
                    className="w-5 h-5 mt-0.5"
                  />
                  <div>
                    <p className="text-xs text-gray-400">Duration</p>
                    <p className="text-sm font-medium text-gray-700">
                      {noOfDays} {noOfDays === 1 ? "Day" : "Days"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-borderColor">
                  <img
                    src={assets.location_icon_colored}
                    alt=""
                    className="w-5 h-5 mt-0.5"
                  />
                  <div>
                    <p className="text-xs text-gray-400">Pick-up Location</p>
                    <p className="text-sm font-medium text-gray-700">
                      {booking.pickupLocation || booking.car?.location}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-100 mt-2">
                <div>
                  <p className="text-xs text-gray-500">
                    {currency}
                    {booking.car?.pricePerDay?.toLocaleString()} x {noOfDays}{" "}
                    {noOfDays === 1 ? "day" : "days"}
                  </p>
                  {discountAmount > 0 && (
                    <p className="text-xs text-green-600 mt-1">
                      {booking.discountLabel || "Smart discount"}: -{currency}
                      {discountAmount.toLocaleString()}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                    <svg
                      className="w-3 h-3 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Paid online via JazzCash
                  </p>
                </div>
                <div className="text-right">
                  {discountAmount > 0 && (
                    <p className="text-xs text-gray-400 line-through">
                      {currency}
                      {basePrice.toLocaleString()}
                    </p>
                  )}
                  <p className="text-xs text-gray-400">Amount Paid</p>
                  <p className="text-2xl font-bold text-green-600">
                    {currency}
                    {Number(booking.price)?.toLocaleString()}
                  </p>
                </div>
              </div>

              {booking._id && (
                <div className="text-center">
                  <p className="text-xs text-gray-400">
                    Booking ID:{" "}
                    <span className="font-mono text-gray-600">
                      #{String(booking._id).slice(-8).toUpperCase()}
                    </span>
                  </p>
                </div>
              )}
            </div>

            <div className="px-8 pb-8 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate("/my-bookings")}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl cursor-pointer transition-all text-sm"
              >
                View My Bookings
              </button>
              <button
                onClick={() => navigate("/cars")}
                className="flex-1 py-3 border border-borderColor hover:bg-gray-50 text-gray-600 font-medium rounded-xl cursor-pointer transition-all text-sm"
              >
                Browse More Cars
              </button>
            </div>
          </>
        )}

        {!booking && status === "success" && (
          <div className="px-8 py-10 text-center">
            <p className="text-sm text-gray-500 mb-6">
              Your payment was successful. Your booking is being processed.
            </p>
            <button
              onClick={() => navigate("/my-bookings")}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl cursor-pointer transition-all text-sm"
            >
              View My Bookings
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
