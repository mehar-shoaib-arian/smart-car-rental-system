import React, { useEffect, useState } from "react";
import LocationMap from "../components/LocationMap";
import { useNavigate, useParams } from "react-router-dom";
import { assets } from "../assets/assets";
import Loader from "../components/Loader";
import CarCard from "../components/CarCard";
import { useAppContext } from "../context/contextStore";
import { toast } from "react-hot-toast";
import { getCarImageSrc, handleCarImageError } from "../utils/imageFallback";
import { isValidBookingDateRange, validationMessages } from "../utils/validators";

const SpecBadge = ({ icon, label, value }) => (
  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-borderColor">
    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-50">
      <img src={icon} alt={label} className="w-4 h-4" />
    </div>
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-700">{value}</p>
    </div>
  </div>
);

const getNextDate = (dateString) => {
  if (!dateString) return "";

  const date = new Date(dateString);
  date.setDate(date.getDate() + 1);
  return date.toISOString().split("T")[0];
};

const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getMonthMatrix = (activeMonth) => {
  const year = activeMonth.getFullYear();
  const month = activeMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days = [];

  for (let i = 0; i < firstDay.getDay(); i += 1) {
    days.push(null);
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    days.push(new Date(year, month, day));
  }

  while (days.length % 7 !== 0) {
    days.push(null);
  }

  return days;
};

const dateRangesOverlap = (startA, endA, startB, endB) =>
  new Date(startA) <= new Date(endB) && new Date(endA) >= new Date(startB);

const AvailabilityCalendar = ({
  activeMonth,
  unavailableDateKeys,
  pickupDate,
  returnDate,
  onPreviousMonth,
  onNextMonth,
}) => {
  const days = getMonthMatrix(activeMonth);
  const selectedRangeIsValid = pickupDate && returnDate && returnDate > pickupDate;
  const monthLabel = activeMonth.toLocaleDateString("en-PK", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="rounded-2xl border border-borderColor bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-800">
            Availability Calendar
          </p>
          <p className="text-xs text-gray-400">
            Red dates are already booked or pending.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPreviousMonth}
            className="h-8 w-8 rounded-full border border-borderColor text-sm text-gray-500 hover:bg-gray-50 cursor-pointer"
          >
            ‹
          </button>
          <span className="min-w-32 text-center text-sm font-semibold text-gray-700">
            {monthLabel}
          </span>
          <button
            type="button"
            onClick={onNextMonth}
            className="h-8 w-8 rounded-full border border-borderColor text-sm text-gray-500 hover:bg-gray-50 cursor-pointer"
          >
            ›
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-400">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          if (!day) {
            return <div key={`blank-${index}`} className="h-10" />;
          }

          const dateKey = formatDateKey(day);
          const isUnavailable = unavailableDateKeys.has(dateKey);
          const isPickup = dateKey === pickupDate;
          const isReturn = dateKey === returnDate;
          const isSelectedRange =
            selectedRangeIsValid && dateKey >= pickupDate && dateKey <= returnDate;
          const isPast = dateKey < formatDateKey(new Date());

          return (
            <div
              key={dateKey}
              className={`flex h-10 items-center justify-center rounded-lg border text-sm transition ${
                isUnavailable
                  ? "border-red-200 bg-red-100 text-red-600 line-through"
                  : isSelectedRange
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : isPast
                      ? "border-gray-100 bg-gray-50 text-gray-300"
                      : "border-gray-100 bg-white text-gray-600"
              } ${isPickup || isReturn ? "ring-2 ring-blue-500" : ""}`}
              title={isUnavailable ? "Unavailable" : "Available"}
            >
              {day.getDate()}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-white border border-gray-200" />
          Available
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-red-100 border border-red-200" />
          Unavailable
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-blue-50 border border-blue-200" />
          Selected range
        </span>
      </div>
    </div>
  );
};

const CarDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const currency = import.meta.env.VITE_CURRENCY;
  const { axios, setShowLogin, user, setPreferredLoginRole } = useAppContext();

  const [car, setCar] = useState(null);
  const [pickupDate, setPickupDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [jazzCashLoading, setJazzCashLoading] = useState(false);
  const [alternativeCars, setAlternativeCars] = useState([]);
  const [unavailableRanges, setUnavailableRanges] = useState([]);
  const [carReviews, setCarReviews] = useState([]);
  const [reviewSummary, setReviewSummary] = useState({
    averageRating: 0,
    totalReviews: 0,
  });
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const today = new Date().toISOString().split("T")[0];
  const unavailableDateKeys = new Set();

  unavailableRanges.forEach((range) => {
    const current = new Date(range.pickupDate);
    const end = new Date(range.returnDate);

    if (Number.isNaN(current.getTime()) || Number.isNaN(end.getTime())) return;

    current.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    while (current <= end) {
      unavailableDateKeys.add(formatDateKey(current));
      current.setDate(current.getDate() + 1);
    }
  });

  const selectedRangeIsUnavailable = (startDate, endDate) =>
    unavailableRanges.some((range) =>
      dateRangesOverlap(startDate, endDate, range.pickupDate, range.returnDate),
    );

  useEffect(() => {
    if (pickupDate && returnDate && returnDate <= pickupDate) {
      setReturnDate("");
    }
  }, [pickupDate, returnDate]);

  // ===============================
  // Fetch Car Details
  // ===============================
  useEffect(() => {
    const fetchCar = async () => {
      try {
        const res = await axios.get(`/api/cars/${id}`);
        const carData = res.data;
        setCar(carData || null);
      } catch (error) {
        console.log("Error fetching car:", error);
        setCar(null);
      }
    };

    fetchCar();
  }, [axios, id]);

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const { data } = await axios.get(`/api/cars/${id}/availability`);
        if (data?.success) {
          setUnavailableRanges(data.unavailableRanges || []);
        }
      } catch (error) {
        console.log("Error fetching car availability:", error);
      }
    };

    fetchAvailability();
  }, [axios, id]);

  useEffect(() => {
    const fetchCarReviews = async () => {
      try {
        const { data } = await axios.get(`/api/feedback/car/${id}`);
        if (data?.success) {
          setCarReviews(data.reviews || []);
          setReviewSummary({
            averageRating: data.averageRating || 0,
            totalReviews: data.totalReviews || 0,
          });
        }
      } catch (error) {
        console.log("Error fetching car reviews:", error);
      }
    };

    fetchCarReviews();
  }, [axios, id]);

  // ===============================
  // Create Booking
  // ===============================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!car) {
      toast.error("Car details are not available.");
      return;
    }

    if (!pickupDate || !returnDate) {
      toast.error("Please select dates");
      return;
    }

    if (!isValidBookingDateRange(pickupDate, returnDate)) {
      toast.error(validationMessages.dateRange);
      return;
    }

    if (selectedRangeIsUnavailable(pickupDate, returnDate)) {
      toast.error("Selected dates include unavailable days.");
      return;
    }

    try {
      setLoading(true);

      const token = sessionStorage.getItem("token");

      if (!token) {
        toast.error("Please login first");
        setPreferredLoginRole("user");
        setShowLogin(true);
        setLoading(false);
        return;
      }

      if (user?.role !== "user") {
        toast.error("Please login as user");
        setPreferredLoginRole("user");
        setShowLogin(true);
        setLoading(false);
        return;
      }

      const { data } = await axios.post(
        "/api/bookings/create",
        {
          carId: car._id,
          pickupDate,
          returnDate,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!data?.success) {
        toast.error(data?.message || "Booking failed");
        return;
      }

      setAlternativeCars([]);

      toast.success("Booking created successfully");

      // Redirect to booking confirmation page with booking details
      navigate("/booking-confirmation", {
        state: {
          car,
          pickupDate,
          returnDate,
          price:
            data.price ??
            (() => {
              const days = Math.ceil(
                (new Date(returnDate) - new Date(pickupDate)) /
                  (1000 * 60 * 60 * 24),
              );
              return car.pricePerDay * days;
            })(),
          pricing: data.pricing,
          bookingDate: new Date().toISOString(),
        },
      });
    } catch (error) {
      if (error.response?.status === 409) {
        setAlternativeCars(error.response?.data?.alternatives || []);
      }
      if (error.response?.status === 401) {
        toast.error("Please login first");
        setPreferredLoginRole("user");
        setShowLogin(true);
        return;
      }
      console.log("Booking error:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  // ── Pay Online with JazzCash ─────────────────────────────────────────────
  const handleJazzCashPayment = async (e) => {
    e.preventDefault();

    if (!car) {
      toast.error("Car details are not available.");
      return;
    }

    if (!pickupDate || !returnDate) {
      toast.error("Please select pickup and return dates.");
      return;
    }

    if (!isValidBookingDateRange(pickupDate, returnDate)) {
      toast.error(validationMessages.dateRange);
      return;
    }

    if (selectedRangeIsUnavailable(pickupDate, returnDate)) {
      toast.error("Selected dates include unavailable days.");
      return;
    }

    const token = sessionStorage.getItem("token");

    if (!token) {
      toast.error("Please login first.");
      setPreferredLoginRole("user");
      setShowLogin(true);
      return;
    }

    if (user?.role !== "user") {
      toast.error("Please login as a user to book.");
      setPreferredLoginRole("user");
      setShowLogin(true);
      return;
    }

    try {
      setJazzCashLoading(true);

      const { data } = await axios.post(
        "/api/payment/create-checkout-session",
        {
          carId: car._id,
          pickupDate,
          returnDate,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!data?.success) {
        toast.error(data?.message || "Failed to initiate JazzCash payment.");
        return;
      }

      if (data?.html) {
        const paymentWindow = window.open("", "_self");
        if (paymentWindow) {
          paymentWindow.document.open();
          paymentWindow.document.write(data.html);
          paymentWindow.document.close();
          return;
        }
      }

      if (data?.action && data?.fields) {
        const form = document.createElement("form");
        form.method = data.method || "POST";
        form.action = data.action;
        form.style.display = "none";

        Object.entries(data.fields).forEach(([key, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = value ?? "";
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
        return;
      }

      toast.error("JazzCash redirect details were not received.");
    } catch (error) {
      console.error(
        "JazzCash checkout error:",
        error.response?.data || error.message,
      );
      toast.error(
        error.response?.data?.message || "Payment initiation failed.",
      );
    } finally {
      setJazzCashLoading(false);
    }
  };

  if (!car) return <Loader />;

  return (
    <div className="px-6 md:px-16 lg:px-24 xl:px-32 mt-16">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 mb-6 text-gray-500 cursor-pointer"
      >
        <img src={assets.arrow_icon} alt="" className="rotate-180 opacity-65" />
        Back to all cars
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        {/* LEFT SIDE */}
        <div className="lg:col-span-2">
          <img
                src={getCarImageSrc(car.image)}
            alt=""
            onError={handleCarImageError}
            className="w-full h-auto md:max-h-100 object-cover rounded-xl mb-6 shadow-md"
          />

          <h1 className="text-3xl font-bold">
            {car.brand} {car.model}
          </h1>
          <p className="text-gray-500 text-lg mb-6">
            {car.category} {car.year}
          </p>

          <div className="mb-6 flex flex-wrap items-center gap-3">
            <div className="rounded-full border border-yellow-200 bg-yellow-50 px-4 py-2 text-sm font-semibold text-yellow-700">
              ★ {reviewSummary.averageRating || "0.0"} / 5
            </div>
            <p className="text-sm text-gray-500">
              {reviewSummary.totalReviews} car-specific{" "}
              {reviewSummary.totalReviews === 1 ? "review" : "reviews"}
            </p>
          </div>

          <p className="text-gray-500">{car.description}</p>

          {/* Specifications Card */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Car Specifications
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <SpecBadge
                icon={assets.users_icon}
                label="Seating Capacity"
                value={`${car.seating_capacity} Seats`}
              />
              <SpecBadge
                icon={assets.fuel_icon}
                label="Fuel Type"
                value={car.fuel_type}
              />
              <SpecBadge
                icon={assets.car_icon}
                label="Transmission"
                value={car.transmission}
              />
              <SpecBadge
                icon={assets.location_icon}
                label="Location"
                value={car.location}
              />
              <SpecBadge
                icon={assets.calendar_icon_colored}
                label="Year"
                value={car.year}
              />
              <SpecBadge
                icon={assets.listIconColored}
                label="Category"
                value={car.category}
              />
            </div>
          </div>

          {/* Pickup Location Map */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Pickup Location
            </h2>
            <LocationMap
              location={car.location}
              latitude={car.latitude}
              longitude={car.longitude}
              height="280px"
            />
          </div>

          <div className="mt-8">
            <AvailabilityCalendar
              activeMonth={calendarMonth}
              unavailableDateKeys={unavailableDateKeys}
              pickupDate={pickupDate}
              returnDate={returnDate}
              onPreviousMonth={() =>
                setCalendarMonth(
                  (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
                )
              }
              onNextMonth={() =>
                setCalendarMonth(
                  (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
                )
              }
            />
          </div>

          {alternativeCars.length > 0 && (
            <div className="mt-10">
              <h2 className="text-xl font-semibold text-gray-800">
                Similar Available Cars
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                This car is unavailable for the selected dates. Here are smart
                alternatives from the same city and category.
              </p>
              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                {alternativeCars.map((alternativeCar) => (
                  <CarCard key={alternativeCar._id} car={alternativeCar} />
                ))}
              </div>
            </div>
          )}

          <div className="mt-10">
            <h2 className="text-xl font-semibold text-gray-800">
              Customer Reviews for this Car
            </h2>
            {carReviews.length === 0 ? (
              <p className="mt-3 rounded-xl border border-borderColor bg-gray-50 px-4 py-4 text-sm text-gray-500">
                No car-specific reviews yet. Reviews will appear here after
                customers rate this car from My Bookings.
              </p>
            ) : (
              <>
                <div className="mt-4 grid gap-4">
                  {(showAllReviews ? carReviews : carReviews.slice(0, 3)).map(
                    (review) => (
                      <div
                        key={review._id}
                        className="rounded-xl border border-borderColor bg-white p-4 shadow-sm"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-gray-800">
                              {review.user?.name || review.name || "Customer"}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(review.createdAt).toLocaleDateString(
                                "en-PK",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                },
                              )}
                            </p>
                          </div>
                          <div className="rounded-full bg-yellow-50 px-3 py-1 text-sm font-semibold text-yellow-700">
                            ★ {review.rating}/5
                          </div>
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-gray-600">
                          “{review.comment}”
                        </p>
                      </div>
                    ),
                  )}
                </div>

                {!showAllReviews && carReviews.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setShowAllReviews(true)}
                    className="mt-5 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 cursor-pointer"
                  >
                    Explore More Reviews
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* RIGHT SIDE - BOOKING FORM */}
        <form
          onSubmit={handleSubmit}
          className="shadow-lg h-max sticky top-18 rounded-xl p-6 space-y-6 text-gray-500"
        >
          <p className="flex items-center justify-between text-2xl text-gray-800 font-semibold">
            {currency}
            {car.pricePerDay}
            <span className="text-base text-gray-400 font-normal">
              {" "}
              per day
            </span>
          </p>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm">
            <p className="font-semibold text-emerald-700">Smart Offers</p>
            <p className="mt-1 text-xs text-emerald-700">
              Rent more than 2 cars and get 10% discount. Loyal users with 5+
              bookings get 15% discount automatically.
            </p>
          </div>

          <hr />

          {/* Pickup */}
          <div className="flex flex-col gap-2">
            <label>Pickup Date</label>
            <input
              type="date"
              required
              value={pickupDate}
              onChange={(e) => {
                const nextDate = e.target.value;
                if (unavailableDateKeys.has(nextDate)) {
                  toast.error("This pickup date is unavailable.");
                  return;
                }
                setPickupDate(nextDate);
                if (returnDate && returnDate <= nextDate) setReturnDate("");
                setCalendarMonth(new Date(`${nextDate}T00:00:00`));
              }}
              min={today}
              className="border px-3 py-2 rounded-lg"
            />
          </div>

          {/* Return */}
          <div className="flex flex-col gap-2">
            <label>Return Date</label>
            <input
              type="date"
              required
              value={returnDate}
              onChange={(e) => {
                const nextDate = e.target.value;
                if (unavailableDateKeys.has(nextDate)) {
                  toast.error("This return date is unavailable.");
                  return;
                }
                if (pickupDate && selectedRangeIsUnavailable(pickupDate, nextDate)) {
                  toast.error("Selected date range includes unavailable days.");
                  return;
                }
                setReturnDate(nextDate);
              }}
              min={pickupDate ? getNextDate(pickupDate) : today}
              className="border px-3 py-2 rounded-lg"
            />
          </div>

          {/* Book Now — offline payment */}
          <button
            type="submit"
            disabled={loading || jazzCashLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 transition-all py-3 font-medium text-white rounded-xl cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Booking..." : "Book Now (Pay at Pickup)"}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Pay Online with JazzCash */}
          <button
            type="button"
            onClick={handleJazzCashPayment}
            disabled={jazzCashLoading || loading}
            className="w-full bg-violet-600 hover:bg-violet-700 transition-all py-3 font-medium text-white rounded-xl cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {jazzCashLoading ? (
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
                Redirecting to JazzCash...
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
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
                Pay Online with JazzCash
              </>
            )}
          </button>

          <p className="text-center text-xs text-gray-400">
            💡 "Book Now" = confirm &amp; pay at pickup &nbsp;|&nbsp; "Pay
            Online" = instant confirmation via JazzCash
          </p>
        </form>
      </div>
    </div>
  );
};

export default CarDetails;
