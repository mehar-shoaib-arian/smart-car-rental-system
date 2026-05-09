import React, { useEffect, useState } from "react";
import Tittle from "./Tittle";
import { assets } from "../assets/assets";
import CarCard from "./CarCard";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/contextStore";

const FeaturedSection = () => {
  const navigate = useNavigate();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const { axios } = useAppContext();

  useEffect(() => {
    const fetchCars = async () => {
      try {
        const res = await axios.get("/api/user/cars");

        if (res.data.success && Array.isArray(res.data.cars)) {
          setCars(res.data.cars.slice(0, 6)); // show only first 6
        } else {
          setCars([]);
        }
      } catch (error) {
        console.log("Error fetching featured cars:", error);
        setCars([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCars();
  }, [axios]);

  return (
    <div className="flex flex-col items-center py-24 px-6 md:px-16 lg:px-24 xl:px-32">
      <div>
        <Tittle
          title="Featured Vehicles"
          subTitle="Explore our selection of premium vehicles available for your next adventure."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-18">
        {!loading && cars.length === 0 && (
          <p className="text-gray-500 col-span-full text-center">
            No featured cars available right now.
          </p>
        )}
        {cars.filter(Boolean).map((car) => (
          <div key={car._id}>
            <CarCard car={car} />
          </div>
        ))}
      </div>

      <button
        onClick={() => {
          navigate("/cars");
          window.scrollTo(0, 0);
        }}
        className="flex items-center justify-center gap-2 px-6 py-2 border border-borderColor hover:bg-gray-50 rounded-md mt-18 cursor-pointer"
      >
        Explore all cars <img src={assets.arrow_icon} alt="arrow" />
      </button>
    </div>
  );
};

export default FeaturedSection;
