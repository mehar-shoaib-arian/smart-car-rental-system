import React, { useCallback, useMemo, useState, useEffect } from "react";
import Tittle from "../components/Tittle";
import { assets } from "../assets/assets";
import CarCard from "../components/CarCard";
import { useSearchParams } from "react-router-dom";
import { useAppContext } from "../context/contextStore";

const CATEGORIES = ["Sedan", "SUV", "Hatchback"];
const FUEL_TYPES = ["Petrol", "Diesel", "Electric", "Hybrid"];
const TRANSMISSIONS = ["Automatic", "Manual", "Semi-automatic"];

const Cars = () => {
  const { axios } = useAppContext();
  const [searchParams] = useSearchParams();
  const [input, setInput] = useState("");
  const [cars, setCars] = useState([]);
  const [recommendedCars, setRecommendedCars] = useState([]);

  // Filters
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedFuels, setSelectedFuels] = useState([]);
  const [selectedTransmissions, setSelectedTransmissions] = useState([]);
  const [maxPrice, setMaxPrice] = useState(0);
  const [priceRange, setPriceRange] = useState([0, 0]);
  const [showFilters, setShowFilters] = useState(false);
  const [carsLoading, setCarsLoading] = useState(true);
  const [carsError, setCarsError] = useState(false);

  const selectedLocation = searchParams.get("location") || "";
  const queryFromUrl = searchParams.get("q") || "";

  useEffect(() => {
    setInput(queryFromUrl);
  }, [queryFromUrl]);

  useEffect(() => {
    const fetchCars = async () => {
      setCarsLoading(true);
      setCarsError(false);
      try {
        const categoryPreference = selectedCategories[0] || "";
        const seatsPreference = "";
        const params = new URLSearchParams();

        if (input.trim()) params.set("q", input.trim());
        if (selectedLocation.trim()) params.set("location", selectedLocation.trim());
        if (categoryPreference) params.set("category", categoryPreference);
        if (seatsPreference !== "") params.set("seats", String(seatsPreference));

        const queryString = params.toString();
        const res = await axios.get(
          `/api/user/cars${queryString ? `?${queryString}` : ""}`,
        );
        if (res.data.success && Array.isArray(res.data.cars)) {
          const carList = res.data.cars;
          setCars(carList);
          setRecommendedCars(
            Array.isArray(res.data.recommendedCars) ? res.data.recommendedCars : [],
          );

          // Compute max price from actual data and initialise range
          if (carList.length > 0) {
            const highest = Math.max(...carList.map((c) => c.pricePerDay || 0));
            const rounded = Math.ceil(highest / 1000) * 1000 || 50000;
            setMaxPrice(rounded);
            setPriceRange((prev) =>
              prev[0] === 0 && prev[1] === rounded ? prev : [0, rounded],
            );
          } else {
            setMaxPrice(50000);
            setPriceRange((prev) =>
              prev[0] === 0 && prev[1] === 50000 ? prev : [0, 50000],
            );
          }
        } else {
          setCars([]);
          setRecommendedCars([]);
          setMaxPrice(50000);
          setPriceRange((prev) =>
            prev[0] === 0 && prev[1] === 50000 ? prev : [0, 50000],
          );
        }
      } catch (error) {
        console.log("Error fetching cars:", error);
        setCars([]);
        setRecommendedCars([]);
        setCarsError(true);
        setMaxPrice(50000);
        setPriceRange((prev) =>
          prev[0] === 0 && prev[1] === 50000 ? prev : [0, 50000],
        );
      } finally {
        setCarsLoading(false);
      }
    };

    fetchCars();
  }, [axios, input, selectedLocation, selectedCategories]);

  const toggleItem = (list, setList, value) => {
    setList((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  const clearAllFilters = () => {
    setInput("");
    setSelectedCategories([]);
    setSelectedFuels([]);
    setSelectedTransmissions([]);
    setPriceRange([0, maxPrice]);
  };

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedFuels.length > 0 ||
    selectedTransmissions.length > 0 ||
    (maxPrice > 0 && (priceRange[0] > 0 || priceRange[1] < maxPrice)) ||
    input.trim().length > 0;

  const matchesCurrentFilters = useCallback((car) => {
    const query = input.trim().toLowerCase();

    const brand = (car.brand || "").toLowerCase();
    const model = (car.model || "").toLowerCase();
    const location = (car.location || "").toLowerCase();
    const matchesText = !query || brand.includes(query) || model.includes(query);

    const matchesLocation =
      !selectedLocation || location === selectedLocation.trim().toLowerCase();

    const matchesCategory =
      selectedCategories.length === 0 ||
      selectedCategories.includes(car.category);

    const matchesFuel =
      selectedFuels.length === 0 || selectedFuels.includes(car.fuel_type);

    const matchesTransmission =
      selectedTransmissions.length === 0 ||
      selectedTransmissions.includes(car.transmission);

    // Only apply price filter once maxPrice has been computed from real data
    const matchesPrice =
      maxPrice === 0 ||
      (car.pricePerDay >= priceRange[0] && car.pricePerDay <= priceRange[1]);

    return (
      matchesText &&
      matchesLocation &&
      matchesCategory &&
      matchesFuel &&
      matchesTransmission &&
      matchesPrice
    );
  }, [
    input,
    selectedLocation,
    selectedCategories,
    selectedFuels,
    selectedTransmissions,
    maxPrice,
    priceRange,
  ]);

  const filteredCars = useMemo(() => {
    return cars.filter(matchesCurrentFilters);
  }, [
    cars,
    matchesCurrentFilters,
  ]);

  const visibleRecommendedCars = useMemo(() => {
    if (hasActiveFilters || selectedLocation.trim()) return [];

    const filteredIds = new Set(filteredCars.map((car) => car._id));
    const seenIds = new Set();

    return recommendedCars.filter((car) => {
      if (!car?._id || seenIds.has(car._id)) return false;
      seenIds.add(car._id);
      return filteredIds.has(car._id) && matchesCurrentFilters(car);
    });
  }, [
    recommendedCars,
    filteredCars,
    hasActiveFilters,
    matchesCurrentFilters,
    selectedLocation,
  ]);

  const regularFilteredCars = useMemo(() => {
    const recommendedIds = new Set(
      visibleRecommendedCars.map((car) => car._id),
    );

    return filteredCars.filter((car) => !recommendedIds.has(car._id));
  }, [filteredCars, visibleRecommendedCars]);

  return (
    <div className="flex flex-col items-center py-20 bg-light max-md:px-4">
      <Tittle
        title="Available Cars"
        subTitle="Browse our selection of vehicles available for your next adventure"
      />

      {/* Search Bar */}
      <div className="flex items-center bg-white px-4 mt-6 max-w-140 w-full h-12 rounded-full shadow">
        <img src={assets.search_icon} alt="" className="w-4.5 h-4.5 mr-2" />
        <input
          onChange={(e) => setInput(e.target.value)}
          value={input}
          type="text"
          placeholder="Search by make or model"
          className="w-full h-full outline-none text-gray-500"
        />
        <button
          onClick={() => setShowFilters((prev) => !prev)}
          className="flex items-center gap-1 cursor-pointer"
          title="Toggle Filters"
        >
          <img src={assets.filter_icon} alt="" className="w-4.5 h-4.5 ml-2" />
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="w-full max-w-4xl mt-4 bg-white rounded-2xl shadow-md p-6 border border-borderColor">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Filters</h3>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-red-500 hover:text-red-600 cursor-pointer border border-red-200 px-3 py-1 rounded-full hover:bg-red-50 transition-all"
              >
                Clear All Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Price Range */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">
                Price Per Day
              </p>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Rs {priceRange[0].toLocaleString()}</span>
                <span>Rs {priceRange[1].toLocaleString()}</span>
              </div>
              <div className="flex flex-col gap-2">
                <input
                  type="range"
                  min={0}
                  max={maxPrice}
                  step={500}
                  value={priceRange[0]}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val <= priceRange[1]) {
                      setPriceRange([val, priceRange[1]]);
                    }
                  }}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <input
                  type="range"
                  min={0}
                  max={maxPrice}
                  step={500}
                  value={priceRange[1]}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val >= priceRange[0]) {
                      setPriceRange([priceRange[0], val]);
                    }
                  }}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1 text-center">
                Rs {priceRange[0].toLocaleString()} – Rs{" "}
                {priceRange[1].toLocaleString()} / day
              </p>
            </div>

            {/* Category */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">
                Category
              </p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() =>
                      toggleItem(selectedCategories, setSelectedCategories, cat)
                    }
                    className={`px-3 py-1.5 text-xs rounded-full border cursor-pointer transition-all ${
                      selectedCategories.includes(cat)
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-600 border-borderColor hover:bg-gray-50"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Fuel Type */}
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3 mt-5">
                Fuel Type
              </p>
              <div className="flex flex-wrap gap-2">
                {FUEL_TYPES.map((fuel) => (
                  <button
                    key={fuel}
                    onClick={() =>
                      toggleItem(selectedFuels, setSelectedFuels, fuel)
                    }
                    className={`px-3 py-1.5 text-xs rounded-full border cursor-pointer transition-all ${
                      selectedFuels.includes(fuel)
                        ? "bg-green-600 text-white border-green-600"
                        : "bg-white text-gray-600 border-borderColor hover:bg-gray-50"
                    }`}
                  >
                    {fuel}
                  </button>
                ))}
              </div>

              {/* Transmission */}
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3 mt-5">
                Transmission
              </p>
              <div className="flex flex-wrap gap-2">
                {TRANSMISSIONS.map((tr) => (
                  <button
                    key={tr}
                    onClick={() =>
                      toggleItem(
                        selectedTransmissions,
                        setSelectedTransmissions,
                        tr,
                      )
                    }
                    className={`px-3 py-1.5 text-xs rounded-full border cursor-pointer transition-all ${
                      selectedTransmissions.includes(tr)
                        ? "bg-purple-600 text-white border-purple-600"
                        : "bg-white text-gray-600 border-borderColor hover:bg-gray-50"
                    }`}
                  >
                    {tr}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mt-3 max-w-4xl w-full">
          {selectedCategories.map((cat) => (
            <span
              key={cat}
              className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
            >
              {cat}
              <button
                onClick={() =>
                  toggleItem(selectedCategories, setSelectedCategories, cat)
                }
                className="ml-1 cursor-pointer hover:text-blue-900 font-bold"
              >
                ×
              </button>
            </span>
          ))}
          {selectedFuels.map((fuel) => (
            <span
              key={fuel}
              className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full"
            >
              {fuel}
              <button
                onClick={() =>
                  toggleItem(selectedFuels, setSelectedFuels, fuel)
                }
                className="ml-1 cursor-pointer hover:text-green-900 font-bold"
              >
                ×
              </button>
            </span>
          ))}
          {selectedTransmissions.map((tr) => (
            <span
              key={tr}
              className="flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
            >
              {tr}
              <button
                onClick={() =>
                  toggleItem(
                    selectedTransmissions,
                    setSelectedTransmissions,
                    tr,
                  )
                }
                className="ml-1 cursor-pointer hover:text-purple-900 font-bold"
              >
                ×
              </button>
            </span>
          ))}
          {(priceRange[0] > 0 || priceRange[1] < maxPrice) && (
            <span className="flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
              Rs {priceRange[0].toLocaleString()} – Rs{" "}
              {priceRange[1].toLocaleString()}
              <button
                onClick={() => setPriceRange([0, maxPrice])}
                className="ml-1 cursor-pointer hover:text-orange-900 font-bold"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}

      {/* Results */}
      <div className="px-6 md:px-16 lg:px-24 xl:px-32 mt-10 w-full">
        {/* ── Loading State ── */}
        {carsLoading && (
          <div className="flex flex-col items-center justify-center mt-20 gap-4">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Loading available cars...</p>
          </div>
        )}

        {/* ── Error State ── */}
        {!carsLoading && carsError && (
          <div className="flex flex-col items-center justify-center mt-20 gap-3 text-center px-4">
            <p className="text-lg text-gray-500 font-medium">
              Could not load cars.
            </p>
            <p className="text-sm text-gray-400">
              Please make sure the server is running on{" "}
              <span className="font-mono text-blue-500">
                {import.meta.env.VITE_BASE_URL || "http://localhost:3000"}
              </span>
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-5 py-2 bg-blue-600 text-white text-sm rounded-full hover:bg-blue-700 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Results ── */}
        {!carsLoading && !carsError && (
          <>
            <p className="text-gray-500 xl:px-20 max-w-7xl mx-auto">
              Showing{" "}
              <span className="font-medium text-gray-700">
                {filteredCars.length}
              </span>{" "}
              {filteredCars.length === 1 ? "Car" : "Cars"}
              {hasActiveFilters && (
                <span className="text-blue-500 ml-1">(filtered)</span>
              )}
            </p>

            {filteredCars.length === 0 ? (
              <div className="flex flex-col items-center justify-center mt-16 text-gray-400">
                <p className="text-lg">No cars match your filters.</p>
                <button
                  onClick={clearAllFilters}
                  className="mt-4 px-5 py-2 bg-blue-600 text-white text-sm rounded-full hover:bg-blue-700 cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                {visibleRecommendedCars.length > 0 && (
                  <div className="mb-10 xl:px-20 max-w-7xl mx-auto">
                    <div className="mb-4">
                      <h3 className="text-xl font-semibold text-gray-800">
                        Recommended for You
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Smart matches based on your city, category, and budget.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                      {visibleRecommendedCars.map((car) => (
                        <div key={`recommended-${car._id}`} className="relative">
                          <span className="absolute left-6 top-11 z-20 rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-semibold text-white shadow">
                            Smart Pick
                          </span>
                          <CarCard car={car} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {regularFilteredCars.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-4 xl:px-20 max-w-7xl mx-auto">
                    {regularFilteredCars.map((car) => (
                      <div key={car._id}>
                        <CarCard car={car} />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Cars;
