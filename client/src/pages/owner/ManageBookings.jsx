import React, { useState, useEffect, useCallback } from "react";
import Title from "../../components/Tittle";
import { useAppContext } from "../../context/contextStore";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { getCarImageSrc, handleCarImageError } from "../../utils/imageFallback";

const ManageBookings = () => {
  const { axios, currency, setShowLogin } = useAppContext();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);

  const getAuthHeaders = () => {
    const token = sessionStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchOwnerBookings = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/bookings/owner", {
        headers: getAuthHeaders(),
      });

      if (data.success) {
        setBookings(data.bookings);
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      if (error.response?.status === 401) {
        toast.error("Please login first");
        setShowLogin(true);
        navigate("/", { replace: true });
      }
    }
  }, [axios, navigate, setShowLogin]);

  const updateBookingStatus = async (bookingId, newStatus) => {
    try {
      let payload = {
        bookingId,
        status: newStatus,
      };

      if (newStatus === "cancelled") {
        const enteredReason = window.prompt(
          "Enter the cancellation reason for the customer receipt.\n\nExample: Another confirmed rental was prioritized for a longer duration, so this car is no longer available for these dates.",
        );

        if (enteredReason === null) {
          return;
        }

        const trimmedReason = enteredReason.trim();
        if (!trimmedReason) {
          toast.error("Cancellation reason is required.");
          return;
        }

        payload = {
          ...payload,
          cancellationReason: trimmedReason,
        };
      }

      const { data } = await axios.post(
        "/api/bookings/change-status",
        payload,
        { headers: getAuthHeaders() },
      );

      if (data.success) {
        toast.success(
          newStatus === "cancelled"
            ? "Booking cancelled with reason."
            : "Booking status updated.",
        );
        fetchOwnerBookings();
      } else {
        toast.error(data.message || "Failed to update booking.");
      }
    } catch (error) {
      console.error("Error updating booking:", error);
      toast.error(
        error.response?.data?.message || "Failed to update booking status.",
      );
    }
  };

  useEffect(() => {
    fetchOwnerBookings();
  }, [fetchOwnerBookings]);

  return (
    <div className="px-4 pt-10 md:px-10 w-full">
      <Title
        title="Manage Bookings"
        subTitle="Track all customer bookings, approve or cancel requests, and manage booking status."
        align="left"
      />

      <div className="max-w-3xl w-full rounded-md overflow-hidden border border-borderColor mt-6">
        <table className="w-full border-collapse text-left text-sm text-gray-600">
          <thead className="text-gray-500">
            <tr>
              <th className="p-3 font-medium">Car</th>
              <th className="p-3 font-medium max-md:hidden">Date Range</th>
              <th className="p-3 font-medium">Total</th>
              <th className="p-3 font-medium max-md:hidden">Payment</th>
              <th className="p-3 font-medium">Actions</th>
            </tr>
          </thead>

          <tbody>
            {bookings.length === 0 && (
              <tr>
                <td className="p-4 text-gray-500" colSpan={5}>
                  No bookings found.
                </td>
              </tr>
            )}
            {bookings.map((booking) => (
              <tr key={booking._id} className="border-t border-borderColor">
                <td className="p-3 flex items-center gap-3">
	                  <img
	                    src={getCarImageSrc(booking.car?.image)}
	                    alt=""
	                    onError={handleCarImageError}
	                    className="h-12 w-12 rounded-md object-cover"
                  />
                  <p className="font-medium max-md:hidden">
                    {booking.car?.brand} {booking.car?.model}
                  </p>
                </td>

                <td className="p-3 max-md:hidden">
                  {booking.pickupDate?.split("T")[0]} to{" "}
                  {booking.returnDate?.split("T")[0]}
                </td>

                <td className="p-3">
                  {currency} {booking.price}
                </td>

                <td className="p-3 max-md:hidden">
                  <span className="bg-gray-100 px-3 py-1 rounded-full text-xs capitalize">
                    {booking.paymentMethod === "online" &&
                    booking.paymentProvider === "jazzcash"
                      ? "JazzCash"
                      : "offline"}
                  </span>
                </td>

                <td className="p-3">
                  {booking.status === "pending" ? (
                    <select
                      value={booking.status}
                      onChange={(e) =>
                        updateBookingStatus(booking._id, e.target.value)
                      }
                      className="px-2 py-1.5 border border-borderColor rounded-md cursor-pointer"
                    >
                      <option value="pending">Pending</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="confirmed">Confirmed</option>
                    </select>
                  ) : (
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        booking.status === "confirmed"
                          ? "bg-green-100 text-green-500"
                          : "bg-red-100 text-red-500"
                      }`}
                    >
                      {booking.status}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageBookings;
