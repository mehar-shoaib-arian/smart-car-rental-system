import React from "react";
import { assets } from "../assets/assets";
import { useAppContext } from "../context/contextStore";
import { toast } from "react-hot-toast";

const Banner = () => {
  const {
    token,
    user,
    setShowLogin,
    setShowListCarForm,
    setPreferredLoginRole,
  } = useAppContext();

  const handleListCarClick = () => {
    if (!(token && user)) {
      toast.error("Please login first");
      setPreferredLoginRole("user");
      setShowLogin(true);
      return;
    }

    if (user.role !== "user") {
      toast.error("Please login as user");
      setPreferredLoginRole("user");
      setShowLogin(true);
      return;
    }

    setShowListCarForm(true);
  };

  return (
    <div
      className="flex flex-col md:flex-row md:items-start items-center
    justify-between px-8 md:pl-14 pt-10 bg-gradient-to-r from-[#0558FE] to-[#A9CFFF]
    max-w-6xl mx-3 md:mx-auto rounded-2xl overflow-hidden"
    >
      <div className="text-white">
        <h2 className="text-3xl font-medium">Do You Own a Luxury Car?</h2>
        <p className="mt-2">
          Monetize your vehicle effortlessly by listing it on CarRental.
        </p>
        <p className="max-w-[520px]">
          We take care of insurance, driver verification and secure payments so
          you can earn passive income, stress-free.
        </p>

        <button
          onClick={handleListCarClick}
          className="inline-block px-6 py-2 bg-white hover:bg-slate-100 transition-all
        text-[#0558FE] rounded-lg text-sm mt-4 cursor-pointer"
        >
          List your car
        </button>
      </div>

      <img
        src={assets.banner_car_image}
        alt="car"
        className="max-h-[180px] mt-10"
      />
    </div>
  );
};

export default Banner;
