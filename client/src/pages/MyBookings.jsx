import React, { useCallback, useEffect, useState } from "react";
import { assets } from "../assets/assets";
import Tittle from "../components/Tittle";
import { toast } from "react-hot-toast";
import { generateBookingPDF } from "../utils/generateBookingPDF";
import { useAppContext } from "../context/contextStore";
import { getCarImageSrc } from "../utils/imageFallback";

const handleBookingCarImageError = (event) => {
  if (!event?.currentTarget) return;

  if (event.currentTarget.dataset.fallbackApplied === "true") return;

  event.currentTarget.dataset.fallbackApplied = "true";
  event.currentTarget.src = assets.car_image4;
};

const MyBookings = () => {
  const { axios, token, user, setShowLogin, setPreferredLoginRole } =
    useAppContext();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const currency = import.meta.env.VITE_CURRENCY;

  const fetchMyBookings = useCallback(async () => {
    try {
      // use token from context so we react to login/logout immediately
      if (!token) {
        setLoading(false);
        setBookings([]); // clear bookings when not logged in
        return;
      }

      const { data } = await axios.get("/api/bookings/user", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (data.success) {
        setBookings(data.bookings);
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  }, [axios, token]);

  useEffect(() => {
    // refetch when the fetch function, token, or user context changes
    fetchMyBookings();
  }, [fetchMyBookings, token, user]);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?"))
      return;

    setCancellingId(bookingId);
    try {
      const token = sessionStorage.getItem("token");

      const { data } = await axios.post(
        "/api/bookings/change-status",
        { bookingId, status: "cancelled" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (data.success) {
        toast.success("Booking cancelled successfully.");
        fetchMyBookings();
      } else {
        toast.error(data.message || "Failed to cancel booking.");
      }
    } catch (error) {
      toast.error("Failed to cancel booking.");
      console.error("Cancel error:", error);
    } finally {
      setCancellingId(null);
    }
  };

  const filterTabs = ["all", "pending", "confirmed", "cancelled"];

  const filteredBookings =
    activeFilter === "all"
      ? bookings
      : bookings.filter((b) => b.status === activeFilter);

  // Not logged in — show login prompt
  if (!loading && !token) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="bg-white border border-borderColor rounded-2xl shadow-lg p-10 max-w-md w-full">
          {/* Lock Icon */}
          <div className="flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full mx-auto mb-5">
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Login Required
          </h2>
          <p className="text-gray-500 text-sm mb-8">
            Please login as a user to view and manage your bookings.
          </p>

          <button
            onClick={() => {
              setPreferredLoginRole("user");
              setShowLogin(true);
            }}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl cursor-pointer transition-all text-sm"
          >
            Login to View Bookings
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center mt-20">Loading bookings...</div>;
  }

  return (
    <div className="px-6 md:px-16 lg:px-24 xl:px-32 2xl:px-48 mt-16 text-sm max-w-7xl">
      <Tittle
        title="My Bookings"
        subTitle="View and manage all your car bookings"
        align="left"
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mt-8 flex-wrap">
        {filterTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium border cursor-pointer capitalize transition-all ${
              activeFilter === tab
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-500 border-borderColor hover:bg-gray-50"
            }`}
          >
            {tab === "all"
              ? `All (${bookings.length})`
              : `${tab.charAt(0).toUpperCase() + tab.slice(1)} (${bookings.filter((b) => b.status === tab).length})`}
          </button>
        ))}
      </div>

      {filteredBookings.length === 0 ? (
        <p className="mt-12 text-gray-500">
          {activeFilter === "all"
            ? "No bookings found."
            : `No ${activeFilter} bookings found.`}
        </p>
      ) : (
        filteredBookings.map((booking, index) => (
          <div
            key={booking._id}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6 border border-borderColor rounded-lg mt-5 first:mt-12"
          >
            {/* Car Info */}
            <div className="md:col-span-1">
              <div className="rounded-md overflow-hidden mb-3">
                <img
                    src={getCarImageSrc(booking.car?.image)}
                  alt=""
                  onError={handleBookingCarImageError}
                  className="w-full h-auto aspect-video object-cover"
                />
              </div>

              <p className="text-lg font-medium mt-2">
                {booking.car?.brand} {booking.car?.model}
              </p>

              <p className="text-gray-500">
                {booking.car?.year}. {booking.car?.category}.{" "}
                {booking.car?.location}
              </p>
            </div>

            {/* Booking Info */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2">
                <p className="px-3 py-1.5 bg-light rounded">
                  Booking #{index + 1}
                </p>

                <p
                  className={`px-3 py-1 text-xs rounded-full ${
                    booking.status === "confirmed"
                      ? "bg-green-400/15 text-green-600"
                      : booking.status === "pending"
                        ? "bg-yellow-400/15 text-yellow-600"
                        : "bg-red-400/15 text-red-600"
                  }`}
                >
                  {booking.status}
                </p>
              </div>

              <div className="flex items-start gap-2 mt-3">
                <img
                  src={assets.calendar_icon_colored}
                  alt=""
                  className="w-4 h-4 mt-1"
                />
                <div>
                  <p className="text-gray-500">Rental Period</p>
                  <p>
                    {booking.pickupDate?.split("T")[0]} To{" "}
                    {booking.returnDate?.split("T")[0]}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 mt-3">
                <img
                  src={assets.location_icon_colored}
                  alt=""
                  className="w-4 h-4 mt-1"
                />
                <div>
                  <p className="text-gray-500">Pick-up Location</p>
                  <p>{booking.pickupLocation || booking.car?.location}</p>
                </div>
              </div>

              {booking.status === "cancelled" &&
                (booking.cancellationReason || booking.cancellationDetails) && (
                  <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                    <p className="text-xs font-semibold text-red-600">
                      Cancellation Reason
                    </p>
                    <p className="mt-1 text-xs text-red-700">
                      {booking.cancellationReason || booking.cancellationDetails}
                    </p>
                  </div>
                )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 mt-4">
                {/* Cancel Button — only for pending bookings */}
                {booking.status === "pending" && (
                  <button
                    onClick={() => handleCancelBooking(booking._id)}
                    disabled={cancellingId === booking._id}
                    className="px-4 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs rounded-md cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 transition-all"
                  >
                    {cancellingId === booking._id
                      ? "Cancelling..."
                      : "Cancel Booking"}
                  </button>
                )}

                {/* Download PDF Receipt */}
                <button
                  onClick={() => {
                    try {
                      generateBookingPDF(booking, currency);
                      toast.success("Receipt downloaded!");
                    } catch (err) {
                      toast.error("Failed to generate receipt.");
                      console.error(err);
                    }
                  }}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 text-xs rounded-md cursor-pointer transition-all"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h4a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                    />
                  </svg>
                  Download Receipt
                </button>
              </div>
            </div>

            {/* Price Section */}
            <div className="md:col-span-1 flex flex-col justify-between gap-6">
              <div className="text-sm text-gray-500 text-right">
                <p>Total Price</p>
                {Number(booking.discountAmount || 0) > 0 && (
                  <>
                    <p className="text-xs text-gray-400 line-through">
                      {currency}
                      {Number(booking.basePrice || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-green-600">
                      {booking.discountLabel || "Smart discount"}: -{currency}
                      {Number(booking.discountAmount).toLocaleString()}
                    </p>
                  </>
                )}
                <h1 className="text-2xl font-semibold text-primary">
                  {currency}
                  {Number(booking.price).toLocaleString()}
                </h1>
                <p>Booked on {booking.createdAt?.split("T")[0]}</p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default MyBookings;
