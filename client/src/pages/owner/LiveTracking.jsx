import React, { useCallback, useEffect, useState } from "react";
import Title from "../../components/Tittle";
import LocationMap from "../../components/LocationMap";
import { useAppContext } from "../../context/contextStore";
import { toast } from "react-hot-toast";
import { getCarImageSrc, handleCarImageError } from "../../utils/imageFallback";
import { generateLiveTrackingPDF } from "../../utils/generateLiveTrackingPDF";

const LiveTracking = () => {
  const { axios, setShowLogin } = useAppContext();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionBookingId, setActionBookingId] = useState(null);

  const getAuthHeaders = () => {
    const token = sessionStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchLiveTrackingBookings = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/owner/live-tracking", {
        headers: getAuthHeaders(),
      });

      if (data.success) {
        setBookings(data.bookings || []);
      } else {
        toast.error(data.message || "Failed to load live tracking.");
      }
    } catch (error) {
      if (error.response?.status === 401) {
        setShowLogin(true);
        return;
      }
      toast.error(
        error.response?.data?.message || "Failed to load live tracking.",
      );
    } finally {
      setLoading(false);
    }
  }, [axios, setShowLogin]);

  useEffect(() => {
    fetchLiveTrackingBookings();
    const intervalId = window.setInterval(fetchLiveTrackingBookings, 4000);
    return () => window.clearInterval(intervalId);
  }, [fetchLiveTrackingBookings]);

  const handleTrackingAction = async (bookingId, action) => {
    try {
      setActionBookingId(bookingId);
      const { data } = await axios.post(
        `/api/owner/live-tracking/${bookingId}/${action}`,
        {},
        { headers: getAuthHeaders() },
      );

      if (data.success) {
        toast.success(
          action === "start" ? "Live tracking started." : "Live tracking stopped.",
        );
        fetchLiveTrackingBookings();
      } else {
        toast.error(data.message || "Tracking action failed.");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Tracking action failed.",
      );
    } finally {
      setActionBookingId(null);
    }
  };

  return (
    <div className="flex-1 px-4 py-10 md:px-10">
      <Title
        title="Live Tracking"
        subTitle="Stay updated with the current movement of your rented cars and monitor their latest location in real time."
        align="left"
      />

      {loading ? (
        <p className="mt-6 text-sm text-gray-500">Loading live tracking...</p>
      ) : bookings.length === 0 ? (
        <div className="mt-6 rounded-xl border border-borderColor bg-white p-6 text-sm text-gray-500">
          No active confirmed rentals are currently available for tracking.
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {bookings.map((booking) => {
            const isTrackingActive = Boolean(
              booking.car?.trackingSimulationActive,
            );
            const mapLatitude =
              booking.car?.currentLatitude ?? booking.car?.latitude ?? null;
            const mapLongitude =
              booking.car?.currentLongitude ?? booking.car?.longitude ?? null;

            return (
              <div
                key={booking._id}
                className="rounded-2xl border border-borderColor bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-start gap-4">
	                    <img
	                      src={getCarImageSrc(booking.car?.image)}
	                      alt=""
	                      onError={handleCarImageError}
	                      className="h-20 w-28 rounded-xl object-cover"
                    />
                    <div>
                      <p className="text-lg font-semibold text-gray-800">
                        {booking.car?.brand} {booking.car?.model}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        Customer: {booking.user?.name || "Unknown"}{" "}
                        {booking.user?.email ? `• ${booking.user.email}` : ""}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        Rental: {booking.pickupDate?.split("T")[0]} to{" "}
                        {booking.returnDate?.split("T")[0]}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        Pickup city: {booking.car?.location || "Not set"}
                      </p>
                      <p className="mt-2 text-xs font-medium text-blue-600">
                        {isTrackingActive
                          ? "Tracking is active and updates every few seconds."
                          : "Tracking is currently stopped."}
                      </p>
                      {booking.car?.liveLocationUpdatedAt && (
                        <p className="mt-1 text-xs text-gray-500">
                          Last update:{" "}
                          {new Date(
                            booking.car.liveLocationUpdatedAt,
                          ).toLocaleString("en-PK")}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => generateLiveTrackingPDF(booking)}
                      className="rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-600 cursor-pointer hover:bg-blue-50"
                    >
                      Download Report
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleTrackingAction(
                          booking._id,
                          isTrackingActive ? "stop" : "start",
                        )
                      }
                      disabled={actionBookingId === booking._id}
                      className={`rounded-full px-4 py-2 text-sm font-medium text-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
                        isTrackingActive
                          ? "bg-red-500 hover:bg-red-600"
                          : "bg-blue-600 hover:bg-blue-700"
                      }`}
                    >
                      {actionBookingId === booking._id
                        ? "Updating..."
                        : isTrackingActive
                          ? "Stop Tracking"
                          : "Start Tracking"}
                    </button>
                  </div>
                </div>

                <div className="mt-5">
                  <LocationMap
                    location={booking.car?.location}
                    latitude={mapLatitude}
                    longitude={mapLongitude}
                    height="300px"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LiveTracking;
