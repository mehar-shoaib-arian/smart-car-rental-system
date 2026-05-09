import React, { useState, useEffect, useCallback } from "react";
import { assets } from "../../assets/assets";
import Title from "../../components/Tittle";
import { useAppContext } from "../../context/contextStore";
import { toast } from "react-hot-toast";
import { getCarImageSrc } from "../../utils/imageFallback";

const ManageCars = () => {
  const { axios, currency, setShowLogin } = useAppContext();
  const [cars, setCars] = useState([]);

  // ✅ FIX: image error handler (prevents crash)
  const handleCarImageError = (e) => {
    e.target.onerror = null; // جلوگیری infinite loop
    e.target.src = assets.car_image4;
  };

  const getAuthHeaders = () => {
    const token = sessionStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchOwnerCars = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/owner/cars", {
        headers: getAuthHeaders(),
      });

      if (data.success) {
        setCars(data.cars || []);
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error("Error fetching cars:", error);
      if (error.response?.status === 401) {
        toast.error("Please login first");
        setShowLogin(true);
      }
    }
  }, [axios, setShowLogin]);

  const toggleAvailability = async (carId) => {
    try {
      const { data } = await axios.post(
        "/api/owner/toggle-car",
        { carId },
        { headers: getAuthHeaders() }
      );

      if (data.success) {
        fetchOwnerCars();
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error("Error toggling availability:", error);
    }
  };

  const deleteCar = async (carId) => {
    try {
      const { data } = await axios.post(
        "/api/owner/delete-car",
        { carId },
        { headers: getAuthHeaders() }
      );

      if (data.success) {
        fetchOwnerCars();
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error("Error deleting car:", error);
    }
  };

  useEffect(() => {
    fetchOwnerCars();
  }, [fetchOwnerCars]);

  return (
    <div className="px-4 pt-10 md:px-10 w-full">
      <Title
        title="Manage Cars"
        subTitle="View all listed cars, update their details, or remove them."
        align="left"
      />

      <div className="max-w-3xl w-full rounded-md overflow-hidden border border-borderColor mt-6">
        <table className="w-full border-collapse text-left text-sm text-gray-600">
          <thead className="text-gray-500">
            <tr>
              <th className="p-3 font-medium">Car</th>
              <th className="p-3 font-medium max-md:hidden">Category</th>
              <th className="p-3 font-medium">Price</th>
              <th className="p-3 font-medium max-md:hidden">Status</th>
              <th className="p-3 font-medium">Actions</th>
            </tr>
          </thead>

          <tbody>
            {cars.filter(Boolean).map((car) => (
              <tr key={car._id} className="border-t border-borderColor">
                <td className="p-3 flex items-center gap-3">
	                  <img
	                    src={getCarImageSrc(car.image)}
	                    alt="car"
	                    onError={handleCarImageError}
	                    className="h-12 w-12 aspect-square rounded-md object-cover"
                  />
                  <div className="max-md:hidden">
                    <p className="font-medium">
                      {car.brand} {car.model}
                    </p>
                    <p className="text-xs text-gray-500">
                      {car.seating_capacity} • {car.transmission}
                    </p>
                  </div>
                </td>

                <td className="p-3 max-md:hidden">{car.category}</td>

                <td className="p-3">
                  {currency}
                  {car.pricePerDay}/day
                </td>

	                <td className="p-3 max-md:hidden">
	                  <div className="flex flex-col gap-2">
	                    <span
	                      className={`px-3 py-1 rounded-full text-xs w-fit ${
	                        car.isAvailable
	                          ? "bg-green-100 text-green-500"
	                          : "bg-red-100 text-red-500"
	                      }`}
	                    >
	                      {car.isAvailable ? "Available" : "Unavailable"}
	                    </span>
                      <span className="text-[11px] text-gray-500">
                        Trips completed: {car.completedTrips || 0}
                      </span>
                      {car.maintenanceDue && (
                        <span className="px-3 py-1 rounded-full text-[11px] w-fit bg-amber-100 text-amber-700">
                          Maintenance Due
                        </span>
                      )}
                    </div>
	                </td>

                <td className="flex items-center p-3 gap-3">
                  <img
                    src={
                      car.isAvailable
                        ? assets.eye_close_icon
                        : assets.eye_icon
                    }
                    alt="toggle"
                    className="cursor-pointer"
                    onClick={() => toggleAvailability(car._id)}
                  />
                  <img
                    src={assets.delete_icon}
                    alt="delete"
                    className="cursor-pointer"
                    onClick={() => deleteCar(car._id)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageCars;
