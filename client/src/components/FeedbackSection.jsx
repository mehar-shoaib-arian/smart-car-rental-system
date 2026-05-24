import React, { useCallback, useEffect, useState } from "react";
import Tittle from "./Tittle";
import { assets } from "../assets/assets";
import { useAppContext } from "../context/contextStore";
import { toast } from "react-hot-toast";
import {
  hasAlphabeticCharacter,
  isAlphabeticCity,
  isAlphabeticName,
  validationMessages,
} from "../utils/validators";

const getInitial = (name = "") => name.trim().charAt(0).toUpperCase() || "U";

const FeedbackSection = () => {
  const { axios } = useAppContext();
  const [feedbacks, setFeedbacks] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [showAll, setShowAll] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    rating: "",
    comment: "",
  });

  const fetchFeedbacks = useCallback(async () => {
    try {
      const res = await axios.get("/api/feedback");
      setFeedbacks(res.data);
    } catch (error) {
      console.error("Error fetching feedbacks", error);
    }
  }, [axios]);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAlphabeticName(formData.name)) {
      toast.error(validationMessages.name);
      return;
    }

    if (!isAlphabeticCity(formData.location)) {
      toast.error(validationMessages.city);
      return;
    }

    if (!hasAlphabeticCharacter(formData.comment)) {
      toast.error("Feedback must contain alphabetic characters.");
      return;
    }

    try {
      await axios.post("/api/feedback", formData);

      setSuccessMessage("Your feedback has been successfully submitted!");

      setFormData({ name: "", location: "", rating: "", comment: "" });

      fetchFeedbacks();

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error("Error submitting feedback", error);
      toast.error(error.response?.data?.message || "Error submitting feedback");
    }
  };

  // Show only 3 feedbacks initially
  const displayedFeedbacks = showAll ? feedbacks : feedbacks.slice(0, 3);

  return (
    <div className="py-28 px-6 md:px-16 lg:px-24 xl:px-44 bg-gray-50">
      <Tittle
        title="Customer Feedback"
        subTitle="Real experiences from our valued customers"
      />

      {/* Feedback Form */}
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8 mt-14">
        <h3 className="text-2xl font-semibold text-center mb-6">
          Share Your Experience
        </h3>

        {successMessage && (
          <div className="mb-4 p-3 text-green-700 bg-green-100 rounded-lg text-center">
            {successMessage}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <input
            type="text"
            placeholder="Your Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-gray-500"
            required
          />

          <input
            type="text"
            placeholder="City, Country"
            value={formData.location}
            onChange={(e) =>
              setFormData({ ...formData, location: e.target.value })
            }
            className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-gray-500"
            required
          />

          <select
            value={formData.rating}
            onChange={(e) =>
              setFormData({ ...formData, rating: e.target.value })
            }
            className={`p-3 border rounded-lg focus:ring-2 focus:ring-blue-600 outline-none md:col-span-2 font-normal cursor-pointer ${
              formData.rating ? "text-black" : "text-gray-400"
            }`}
            required
          >
            <option value="" disabled hidden className="text-gray-400">
              Rate our service
            </option>
            <option value="5" className="text-black">
              ⭐⭐⭐⭐⭐ Excellent
            </option>
            <option value="4" className="text-black">
              ⭐⭐⭐⭐ Very Good
            </option>
            <option value="3" className="text-black">
              ⭐⭐⭐ Good
            </option>
            <option value="2" className="text-black">
              ⭐⭐ Fair
            </option>
            <option value="1" className="text-black">
              ⭐ Poor
            </option>
          </select>

          <textarea
            rows="4"
            placeholder="Write your feedback..."
            value={formData.comment}
            onChange={(e) =>
              setFormData({ ...formData, comment: e.target.value })
            }
            className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-600 outline-none md:col-span-2 text-gray-500"
            required
          />

          <button className="md:col-span-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition cursor-pointer">
            Submit Feedback
          </button>
        </form>
      </div>

      {/* Feedback Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-20">
        {displayedFeedbacks.map((fb) => (
          <div
            key={fb._id}
            className="bg-white rounded-2xl shadow-lg p-6 hover:-translate-y-2 transition duration-300"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full border border-blue-300 bg-blue-50 flex items-center justify-center text-xl font-semibold text-blue-600 shrink-0">
                {getInitial(fb.name)}
              </div>
              <div>
                <h4 className="text-lg font-semibold">{fb.name}</h4>
                <p className="text-gray-500 text-sm">{fb.location}</p>
              </div>
            </div>

            <div className="flex gap-1 mt-4">
              {Array(Number(fb.rating))
                .fill(0)
                .map((_, i) => (
                  <img key={i} src={assets.star_icon} alt="star" />
                ))}
            </div>

            <p className="text-gray-600 mt-4 leading-relaxed">“{fb.comment}”</p>
          </div>
        ))}
      </div>

      {/* Explore More Button */}
      {!showAll && feedbacks.length > 3 && (
        <div className="text-center mt-10">
          <button
            onClick={() => setShowAll(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition cursor-pointer"
          >
            Explore More
          </button>
        </div>
      )}
    </div>
  );
};

export default FeedbackSection;
