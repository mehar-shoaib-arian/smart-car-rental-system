import React, { useState, useEffect, useCallback } from "react";
import Title from "../../components/owner/Title";
import { useAppContext } from "../../context/contextStore";
import { toast } from "react-hot-toast";
import { getCarImageSrc, handleCarImageError } from "../../utils/imageFallback";

const OverdueBookings = () => {
  const { axios } = useAppContext();
  const [overdueBookings, setOverdueBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingAlerts, setSendingAlerts] = useState(false);

  const getAuthHeaders = () => {
    const token = sessionStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchOverdueBookings = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/overdue/", {
        headers: getAuthHeaders(),
      });
      if (data.success) {
        setOverdueBookings(data.bookings || []);
      } else {
        toast.error(data.message || "Failed to fetch overdue bookings.");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to fetch overdue bookings.",
      );
    } finally {
      setLoading(false);
    }
  }, [axios]);

  useEffect(() => {
    fetchOverdueBookings();
  }, [fetchOverdueBookings]);

  const handleSendAlerts = async () => {
    setSendingAlerts(true);
    try {
      const { data } = await axios.post(
        "/api/overdue/check",
        {},
        { headers: getAuthHeaders() },
      );
      if (data.success) {
        toast.success(data.message || "Overdue check completed.");
        fetchOverdueBookings();
      } else {
        toast.error(data.message || "Failed to send alerts.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send alerts.");
    } finally {
      setSendingAlerts(false);
    }
  };

  const getDaysOverdue = (returnDate) => {
    return Math.ceil(
      (new Date() - new Date(returnDate)) / (1000 * 60 * 60 * 24),
    );
  };

  return (
    <div className="px-4 pt-10 md:px-10 w-full">
      {/* Header Row */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <Title
          title="Overdue Bookings"
          subtitle="Bookings where the return date has passed but the car has not been returned."
        />
        <button
          onClick={handleSendAlerts}
          disabled={sendingAlerts || loading}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-all"
        >
          {sendingAlerts ? (
            <>
              <svg
                className="w-4 h-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
              Sending...
            </>
          ) : (
            <>
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
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              Send Alert Emails
            </>
          )}
        </button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center mt-20 text-gray-500">
          <svg
            className="w-5 h-5 animate-spin mr-2"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            />
          </svg>
          Loading overdue bookings...
        </div>
      ) : overdueBookings.length === 0 ? (
        /* Empty State */
        <div className="flex items-center gap-3 mt-12 p-6 bg-green-50 border border-green-200 rounded-xl text-green-700">
          <svg
            className="w-6 h-6 text-green-500 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="font-medium">
            No overdue bookings! All cars returned on time.
          </p>
        </div>
      ) : (
        /* Table */
        <div className="w-full rounded-md overflow-hidden border border-borderColor mt-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-gray-600">
              <thead className="text-gray-500 bg-gray-50">
                <tr>
                  <th className="p-3 font-medium">Car</th>
                  <th className="p-3 font-medium">Customer</th>
                  <th className="p-3 font-medium">Return Date</th>
                  <th className="p-3 font-medium">Days Overdue</th>
                </tr>
              </thead>

              <tbody>
                {overdueBookings.map((booking) => {
                  const daysOverdue = getDaysOverdue(booking.returnDate);
                  const isHighlighted = daysOverdue > 3;

                  return (
                    <tr
                      key={booking._id}
                      className={`border-t border-borderColor transition-colors ${
                        isHighlighted ? "bg-red-50" : "hover:bg-gray-50"
                      }`}
                    >
                      {/* Car */}
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {booking.car?.image && (
                            <img
                    src={getCarImageSrc(booking.car.image)}
                              alt={`${booking.car?.brand} ${booking.car?.model}`}
                              className="h-10 w-14 rounded-md object-cover flex-shrink-0"
                              onError={handleCarImageError}
                            />
                          )}
                          <div>
                            <p className="font-medium text-gray-800">
                              {booking.car?.brand} {booking.car?.model}
                            </p>
                            <p className="text-xs text-gray-400">
                              {booking.car?.year} · {booking.car?.category}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="p-3">
                        <p className="font-medium text-gray-800">
                          {booking.user?.name || "N/A"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {booking.user?.email || ""}
                        </p>
                      </td>

                      {/* Return Date */}
                      <td className="p-3 text-gray-600">
                        {booking.returnDate?.split("T")[0] || "—"}
                      </td>

                      {/* Days Overdue */}
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            isHighlighted
                              ? "bg-red-100 text-red-600"
                              : "bg-yellow-100 text-yellow-600"
                          }`}
                        >
                          {isHighlighted && <span className="mr-1">🚨</span>}
                          {daysOverdue} day{daysOverdue !== 1 ? "s" : ""}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverdueBookings;
