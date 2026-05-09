import React, { useState } from "react";
import { assets } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/contextStore";

const cityList = ["Lahore", "Karachi", "Multan", "Islamabad"];
const getToday = () => new Date().toISOString().split("T")[0];
const getNextDate = (date) => {
  if (!date) return getToday();
  const next = new Date(date);
  next.setDate(next.getDate() + 1);
  return next.toISOString().split("T")[0];
};

const Hero = () => {
  const navigate = useNavigate();
  const { setPickupDate, setReturnDate } = useAppContext();
  const [pickupLocation, setPickupLocation] = useState("");
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");

  const handlePickupChange = (value) => {
    setPickup(value);
    if (dropoff && value && dropoff <= value) {
      setDropoff("");
    }
  };

  const onSearch = (e) => {
    e.preventDefault();

    if (!pickupLocation || !pickup || !dropoff) return;
    if (dropoff <= pickup) {
      alert("Return date must be after pick-up date");
      return;
    }

    setPickupDate(pickup);
    setReturnDate(dropoff);

    const params = new URLSearchParams({
      location: pickupLocation,
      pickupDate: pickup,
      returnDate: dropoff,
    });
    navigate(`/cars?${params.toString()}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-14 bg-light text-center px-4">
      <h1 className="text-4xl md:text-5xl font-semibold">Cars on Rent</h1>

      <form
        onSubmit={onSearch}
        className="flex flex-col md:flex-row items-center justify-between p-6 rounded-lg md:rounded-full w-full max-w-80 md:max-w-2xl bg-white shadow-[0px_8px_20px_rgba(0,0,0,0.1)] gap-6"
      >
        <div className="flex flex-col items-start gap-2 w-full">
          <select
            required
            value={pickupLocation}
            onChange={(e) => setPickupLocation(e.target.value)}
            className="border rounded p-2 w-full cursor-pointer"
          >
            <option value="">Pickup Location</option>
            {cityList.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-500">
            {pickupLocation ? pickupLocation : "Please select location"}
          </p>
        </div>

        <div className="flex flex-col items-start gap-2 w-full">
          <label htmlFor="pickup-date">Pick-up Date</label>
          <input
            type="date"
            id="pickup-date"
            value={pickup}
            onChange={(e) => handlePickupChange(e.target.value)}
            min={getToday()}
            className="text-sm text-gray-500 border rounded p-2 w-full"
            required
          />
        </div>

        <div className="flex flex-col items-start gap-2 w-full">
          <label htmlFor="return-date">Return Date</label>
          <input
            type="date"
            id="return-date"
            value={dropoff}
            onChange={(e) => setDropoff(e.target.value)}
            min={pickup ? getNextDate(pickup) : getToday()}
            className="text-sm text-gray-500 border rounded p-2 w-full"
            required
          />
        </div>

        <button
          type="submit"
          className="flex items-center justify-center gap-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-full md:w-auto cursor-pointer"
        >
          <img
            src={assets.search_icon}
            alt="search"
            className="w-5 h-5 brightness-200"
          />
          Search
        </button>
      </form>

      <img
        src={assets.main_car}
        alt="car"
        className="w-full max-w-3xl max-h-72 object-contain"
      />
    </div>
  );
};

export default Hero;
