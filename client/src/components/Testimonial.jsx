import React, { useEffect, useState } from "react";
import Tittle from "./Tittle";
import { assets } from "../assets/assets";
import { useAppContext } from "../context/contextStore";

const getInitial = (name = "") => name.trim().charAt(0).toUpperCase() || "U";

const Testimonial = () => {
  const { axios } = useAppContext();
  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const res = await axios.get("/api/feedback");
        setTestimonials(res.data);
      } catch (error) {
        console.error("Error fetching testimonials", error);
      }
    };

    fetchTestimonials();
  }, [axios]);

  return (
    <div className="py-28 px-6 md:px-16 lg:px-24 xl:px-44">
      <Tittle
        title="What Our Customers Say"
        subTitle="From short stays to long drives, discover why SmartRent is Pakistan’s rental favorite."
      />

      <div className="flex flex-wrap items-center justify-center gap-6 mt-20 mb-10">
        {testimonials.map((testimonial) => (
          <div
            key={testimonial._id}
            className="bg-white p-6 rounded-xl shadow-lg hover:-translate-y-1 transition-all duration-500"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full border border-blue-300 bg-blue-50 flex items-center justify-center text-xl font-semibold text-blue-600 shrink-0">
                {getInitial(testimonial.name)}
              </div>
              <div>
                <p className="text-xl font-semibold">{testimonial.name}</p>
                <p className="text-gray-500">
                  {testimonial.location || "Pakistan"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 mt-4">
              {Array(testimonial.rating)
                .fill(0)
                .map((_, index) => (
                  <img key={index} src={assets.star_icon} alt="star_icon" />
                ))}
            </div>

            <p className="text-gray-500 max-w-90 mt-4">
              "{testimonial.comment}"
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Testimonial;
