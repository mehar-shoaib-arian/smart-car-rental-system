import React from "react";
import { assets } from "../assets/assets";
import { Link } from "react-router-dom";
import { useAppContext } from "../context/contextStore";
import { toast } from "react-hot-toast";

const Footer = () => {
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

  const handleHelpCenterClick = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-chatbot-support"));
    }
  };

  return (
    <div className="px-6 md:px-16 1g:px-24 x1:px-32 mt-60 text-sm text-gray-500">
      <div className="flex flex-wrap justify-between items-start gap-8 pb-6 border-borderColor border-b">
        <div>
          <img src={assets.logo} alt="logo" className="h-8 md:h-9" />
          <p className="max-w-80 mt-3">
            Rent a car easily with SmartRent — fast, reliable, and affordable
            rides for every journey.
          </p>

          <div className="flex items-center gap-3 mt-6">
            <a href="#">
              <img src={assets.facebook_logo} className="w-5 h-5" alt="" />
            </a>
            <a href="#">
              <img src={assets.instagram_logo} className="w-5 h-5" alt="" />
            </a>
            <a href="#">
              <img src={assets.twitter_logo} className="w-5 h-5" alt="" />
            </a>
            <a href="#">
              <img src={assets.gmail_logo} className="w-5 h-5" alt="" />
            </a>
          </div>
        </div>

        <div>
          <h2 className="text-base font-medium text-gray-800 uppercase">
            Quick Links
          </h2>
          <ul className="mt-3 flex flex-col gap-1.5">
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/cars">Browse Cars</Link>
            </li>
            <li>
              <button onClick={handleListCarClick} className="cursor-pointer">
                List Your Car
              </button>
            </li>
            <li>
              <Link to="/about">About us</Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-medium text-gray-800 uppercase">
            Resources
          </h2>
          <ul className="mt-3 flex flex-col gap-1.5">
            <li>
              <button
                type="button"
                onClick={handleHelpCenterClick}
                className="cursor-pointer"
              >
                Help Center
              </button>
            </li>
            <li>
              <Link to="/terms">Terms of Service</Link>
            </li>
            <li>
              <Link to="/privacy">Privacy Policy</Link>
            </li>
            <li>
              <Link to="/insurance">Insurance</Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-medium text-gray-800 uppercase">
            Contact
          </h2>
          <ul className="mt-3 flex flex-col gap-1.5">
            <li>4567 Luxury Drive</li>
            <li>Mailsi, Pakistan</li>
            <li>
              <a
                href="tel:+923008143370"
                className="text-blue-600 hover:underline"
              >
                +92 300 8143370
              </a>
            </li>
            <li>
              <a
                href="mailto:mshoaib6307181@gmail.com"
                className="text-blue-600 hover:underline"
              >
                mshoaib6307181@gmail.com
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-2 items-center justify-between py-5">
        <p>© {new Date().getFullYear()} Brand. All rights reserved.</p>
        <ul className="flex items-center gap-4">
          <li>
            <Link to="/privacy">Privacy</Link>
          </li>
          <li>|</li>
          <li>
            <Link to="/terms">Terms</Link>
          </li>
          <li>|</li>
          <li>
            <Link to="/cookies">Cookies</Link>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Footer;
