import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import Tittle from "../components/Tittle";
import { useAppContext } from "../context/contextStore";
import { assets } from "../assets/assets";

const initialState = {
  fullName: "",
  email: "",
  phone: "",
  cnic: "",
  brand: "",
  model: "",
  year: "",
  category: "",
  transmission: "",
  fuel_type: "",
  seating_capacity: "",
  pricePerDay: "",
  location: "",
  latitude: "",
  longitude: "",
  description: "",
};

const ListYourCar = ({ asModal = false, onClose = null }) => {
  const { axios, token, user, setShowLogin, setPreferredLoginRole } =
    useAppContext();
  const [form, setForm] = useState(initialState);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!asModal) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow || "auto";
    };
  }, [asModal]);

  useEffect(() => {
    if (!asModal) return undefined;

    if (!(token && user)) {
      toast.error("Please login first");
      setPreferredLoginRole("user");
      setShowLogin(true);
      if (onClose) onClose();
      return;
    }

    if (user.role !== "user") {
      toast.error("Please login as user");
      setPreferredLoginRole("user");
      setShowLogin(true);
      if (onClose) onClose();
    }
  }, [token, user, setShowLogin, onClose, setPreferredLoginRole, asModal]);

  useEffect(() => {
    if (!image) {
      setPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(image);
    setPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [image]);

  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      fullName: user.name || prev.fullName,
      email: user.email || prev.email,
    }));
  }, [user]);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!image) {
      toast.error("Please upload car image");
      return;
    }

    try {
      setLoading(true);
      const rawToken = sessionStorage.getItem("token");
      const formData = new FormData();
      formData.append("image", image);
      formData.append("listingData", JSON.stringify(form));

      const { data } = await axios.post("/api/listing-requests", formData, {
        headers: {
          ...(rawToken ? { Authorization: `Bearer ${rawToken}` } : {}),
          "Content-Type": "multipart/form-data",
        },
      });

      if (data.success) {
        toast.success(data.message);
        setForm(initialState);
        setImage(null);
        const imageInput = document.getElementById("listing-car-image");
        if (imageInput) imageInput.value = null;
        if (asModal && onClose) onClose();
      } else {
        toast.error(data.message || "Failed to submit request.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit request.");
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <div className="px-6 md:px-8 py-6">
      <Tittle
        title="List Your Car"
        subTitle="Submit your car details. Admin will review and approve or reject your request."
        align="left"
      />

      <form
        onSubmit={onSubmit}
        className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl"
      >
        <div className="md:col-span-2 flex items-center gap-3">
          <label htmlFor="listing-car-image" className="cursor-pointer">
            <img
              src={preview || assets.upload_icon}
              alt="upload"
              className="h-14 rounded"
            />
            <input
              type="file"
              id="listing-car-image"
              accept="image/*"
              hidden
              onChange={(e) => setImage(e.target.files?.[0] || null)}
            />
          </label>
          <p className="text-sm text-gray-500">Upload a picture of your car</p>
        </div>

        <input
          value={form.fullName}
          onChange={(e) => updateField("fullName", e.target.value)}
          readOnly={Boolean(user?.name)}
          className="border border-borderColor rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-600 outline-none"
          placeholder="Full name"
          required
        />
        <input
          type="email"
          value={form.email}
          onChange={(e) => updateField("email", e.target.value)}
          readOnly={Boolean(user?.email)}
          className="border border-borderColor rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-600 outline-none"
          placeholder="Email"
          required
        />
        <input
          value={form.phone}
          onChange={(e) => updateField("phone", e.target.value)}
          className="border border-borderColor rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-600 outline-none"
          placeholder="Phone number"
          required
        />
        <input
          value={form.cnic}
          onChange={(e) => updateField("cnic", e.target.value)}
          className="border border-borderColor rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-600 outline-none"
          placeholder="CNIC (e.g. 35202-1234567-1)"
          required
        />
        <input
          value={form.location}
          onChange={(e) => updateField("location", e.target.value)}
          className="border border-borderColor rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-600 outline-none"
          placeholder="Location (e.g. Multan)"
          required
        />
        <input
          type="number"
          step="any"
          min="-90"
          max="90"
          value={form.latitude}
          onChange={(e) => updateField("latitude", e.target.value)}
          className="border border-borderColor rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-600 outline-none"
          placeholder="Latitude (e.g. 30.1575)"
          required
        />
        <input
          type="number"
          step="any"
          min="-180"
          max="180"
          value={form.longitude}
          onChange={(e) => updateField("longitude", e.target.value)}
          className="border border-borderColor rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-600 outline-none"
          placeholder="Longitude (e.g. 71.5249)"
          required
        />
        <input
          value={form.brand}
          onChange={(e) => updateField("brand", e.target.value)}
          className="border border-borderColor rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-600 outline-none"
          placeholder="Brand"
          required
        />
        <input
          value={form.model}
          onChange={(e) => updateField("model", e.target.value)}
          className="border border-borderColor rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-600 outline-none"
          placeholder="Model"
          required
        />
        <input
          type="number"
          value={form.year}
          onChange={(e) => updateField("year", e.target.value)}
          className="border border-borderColor rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-600 outline-none"
          placeholder="Year"
          required
        />
        <input
          type="number"
          value={form.pricePerDay}
          onChange={(e) => updateField("pricePerDay", e.target.value)}
          className="border border-borderColor rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-600 outline-none"
          placeholder="Price per day"
          required
        />
        <select
          value={form.category}
          onChange={(e) => updateField("category", e.target.value)}
          className="border border-borderColor rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-600 outline-none text-gray-500"
          required
        >
          <option value="">Category</option>
          <option value="Sedan">Sedan</option>
          <option value="SUV">SUV</option>
          <option value="Hatchback">Hatchback</option>
        </select>
        <select
          value={form.transmission}
          onChange={(e) => updateField("transmission", e.target.value)}
          className="border border-borderColor rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-600 outline-none text-gray-500"
          required
        >
          <option value="">Transmission</option>
          <option value="Automatic">Automatic</option>
          <option value="Manual">Manual</option>
          <option value="Semi-automatic">Semi-automatic</option>
        </select>
        <select
          value={form.fuel_type}
          onChange={(e) => updateField("fuel_type", e.target.value)}
          className="border border-borderColor rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-600 outline-none text-gray-500"
          required
        >
          <option value="">Fuel type</option>
          <option value="Petrol">Petrol</option>
          <option value="Diesel">Diesel</option>
          <option value="Electric">Electric</option>
          <option value="Hybrid">Hybrid</option>
        </select>
        <input
          type="number"
          value={form.seating_capacity}
          onChange={(e) => updateField("seating_capacity", e.target.value)}
          className="border border-borderColor rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-600 outline-none"
          placeholder="Seating capacity"
          required
        />
        <textarea
          value={form.description}
          onChange={(e) => updateField("description", e.target.value)}
          rows={5}
          className="border border-borderColor rounded-md px-3 py-2 md:col-span-2 focus:ring-2 focus:ring-blue-600 outline-none"
          placeholder="Car description"
          required
        />
        <div className="md:col-span-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-md cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? "Submitting..." : "Submit For Review"}
          </button>
          {asModal && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-md border border-borderColor cursor-pointer"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );

  if (!asModal) {
    return (
      <div className="px-6 md:px-16 lg:px-24 xl:px-32 py-14">{content}</div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[1px] flex items-start justify-center p-4 overflow-y-auto"
      onClick={onClose || undefined}
    >
      <div
        className="w-full max-w-5xl bg-white rounded-xl shadow-xl mt-10 mb-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-5">
          <h2 className="text-xl font-semibold">List Your Car</h2>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-sm cursor-pointer"
            >
              Close
            </button>
          )}
        </div>
        {content}
      </div>
    </div>
  );
};

export default ListYourCar;
