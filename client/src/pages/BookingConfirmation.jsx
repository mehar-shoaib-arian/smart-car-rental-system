import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { getCarImageSrc, handleCarImageError } from "../utils/imageFallback";

const BookingConfirmation = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const currency = import.meta.env.VITE_CURRENCY;

  // If user navigates here directly without booking state, redirect to home
  if (!state || !state.car) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          No booking found.
        </h2>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
        >
          Go Home
        </button>
      </div>
    );
  }

  const {
    car,
    pickupDate,
    returnDate,
    pickupLocation,
    price,
    pricing,
    bookingDate,
  } = state;
  const discountAmount = Number(pricing?.discountAmount || 0);
  const basePrice = Number(pricing?.basePrice || price || 0);

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-PK", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const noOfDays = (() => {
    if (!pickupDate || !returnDate) return 1;
    const picked = new Date(pickupDate);
    const returned = new Date(returnDate);
    return Math.ceil((returned - picked) / (1000 * 60 * 60 * 24));
  })();

  return (
    <div className="min-h-screen bg-light flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Success Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-8 py-10 text-white text-center">
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
          <h1 className="text-2xl font-bold mb-1">Booking Confirmed!</h1>
          <p className="text-blue-100 text-sm">
            Your booking request has been submitted successfully.
          </p>
        </div>

        {/* Car Info */}
        <div className="flex items-center gap-4 px-8 py-5 border-b border-borderColor">
          <img
            src={getCarImageSrc(car.image)}
            alt={`${car.brand} ${car.model}`}
            onError={handleCarImageError}
            className="w-24 h-16 object-cover rounded-xl shadow-sm"
          />
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              {car.brand} {car.model}
            </h2>
            <p className="text-sm text-gray-500">
              {car.category} · {car.year}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <img
                src={assets.location_icon}
                alt=""
                className="w-3.5 h-3.5 opacity-60"
              />
              <span className="text-xs text-gray-400">{car.location}</span>
            </div>
          </div>
          {/* Status Badge */}
          <div className="ml-auto">
            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full border border-yellow-200">
              Pending
            </span>
          </div>
        </div>

        {/* Booking Details */}
        <div className="px-8 py-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Booking Details
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {/* Pickup Date */}
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-borderColor">
              <img
                src={assets.calendar_icon_colored}
                alt=""
                className="w-5 h-5 mt-0.5"
              />
              <div>
                <p className="text-xs text-gray-400">Pick-up Date</p>
                <p className="text-sm font-medium text-gray-700">
                  {formatDate(pickupDate)}
                </p>
              </div>
            </div>

            {/* Return Date */}
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-borderColor">
              <img
                src={assets.calendar_icon_colored}
                alt=""
                className="w-5 h-5 mt-0.5"
              />
              <div>
                <p className="text-xs text-gray-400">Return Date</p>
                <p className="text-sm font-medium text-gray-700">
                  {formatDate(returnDate)}
                </p>
              </div>
            </div>

            {/* Duration */}
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

            {/* Location */}
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-borderColor">
              <img
                src={assets.location_icon_colored}
                alt=""
                className="w-5 h-5 mt-0.5"
              />
              <div>
                <p className="text-xs text-gray-400">Pick-up Location</p>
                <p className="text-sm font-medium text-gray-700">
                  {pickupLocation || car.location}
                </p>
              </div>
            </div>
          </div>

          {/* Price Summary */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100 mt-2">
            <div>
              <p className="text-xs text-gray-500">
                {currency}
                {car.pricePerDay} × {noOfDays} {noOfDays === 1 ? "day" : "days"}
              </p>
              {discountAmount > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  {pricing?.discountLabel || "Smart discount"}: -{currency}
                  {discountAmount.toLocaleString()}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-0.5">
                Booked on {formatDate(bookingDate || new Date().toISOString())}
              </p>
            </div>
            <div className="text-right">
              {discountAmount > 0 && (
                <p className="text-xs text-gray-400 line-through">
                  {currency}
                  {basePrice.toLocaleString()}
                </p>
              )}
              <p className="text-xs text-gray-400">Total Price</p>
              <p className="text-2xl font-bold text-blue-600">
                {currency}
                {price?.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Payment Note */}
          <p className="text-xs text-center text-gray-400 mt-1">
            💡 Payment is collected offline at the time of vehicle pickup.
          </p>
        </div>

        {/* Action Buttons */}
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
      </div>
    </div>
  );
};

export default BookingConfirmation;
