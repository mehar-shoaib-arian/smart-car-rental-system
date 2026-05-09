import React, { useEffect, useState } from "react";
import LocationMap from "../components/LocationMap";
import { useNavigate, useParams } from "react-router-dom";
import { assets } from "../assets/assets";
import Loader from "../components/Loader";
import CarCard from "../components/CarCard";
import { useAppContext } from "../context/contextStore";
import { toast } from "react-hot-toast";
import { getCarImageSrc, handleCarImageError } from "../utils/imageFallback";

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
  const today = new Date().toISOString().split("T")[0];

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

    if (returnDate <= pickupDate) {
      toast.error("Return date must be after pickup date");
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

    if (returnDate <= pickupDate) {
      toast.error("Return date must be after pickup date.");
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
              onChange={(e) => setPickupDate(e.target.value)}
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
              onChange={(e) => setReturnDate(e.target.value)}
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
