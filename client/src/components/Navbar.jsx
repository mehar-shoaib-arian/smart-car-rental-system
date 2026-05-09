import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { assets, menuLinks } from "../assets/assets";
import { useAppContext } from "../context/contextStore";
import { toast } from "react-hot-toast";

const Navbar = ({ setShowLogin }) => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { token, user, logout, setPreferredLoginRole } = useAppContext();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    navigate(query ? `/cars?q=${encodeURIComponent(query)}` : "/cars");
    setOpen(false);
  };

  return (
    <div
      className={`flex items-center justify-between px-6 md:px-16 lg:px-24
      xl:px-32 py-4 text-gray-600 border-b border-borderColor relative transition-all
      ${location.pathname === "/" && "bg-light"}`}
    >
      <Link to="/">
        <img src={assets.logo} alt="logo" className="h-8" />
      </Link>

      <div
        className={`max-sm:fixed max-sm:h-screen max-sm:w-full max-sm:top-16
        max-sm:border-t border-bordercolor right-0 flex flex-col sm:flex-row
        items-start sm:items-center gap-4 sm:gap-8 max-sm:p-4 transition-all
        duration-300 z-50 ${location.pathname === "/" ? "bg-light" : "bg-white"}
        ${open ? "max-sm:translate-x-0" : "max-sm:translate-x-full"}`}
      >
        {menuLinks.map((link, index) => (
          <Link key={index} to={link.path} onClick={() => setOpen(false)}>
            {link.name}
          </Link>
        ))}

        <form
          onSubmit={handleSearchSubmit}
          className="hidden lg:flex items-center text-sm gap-2 border
          border-borderColor px-3 rounded-full max-w-56"
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="py-1.5 w-full bg-transparent outline-none placeholder-gray-500"
            placeholder="Search cars"
          />
          <button
            type="submit"
            aria-label="Search cars"
            className="cursor-pointer"
          >
            <img
              src={assets.search_icon}
              alt="search"
              className="w-4 h-4 [filter:invert(37%)_sepia(98%)_saturate(1746%)_hue-rotate(203deg)_brightness(99%)_contrast(101%)]"
            />
          </button>
        </form>

        <div className="flex max-sm:flex-col items-start sm:items-center gap-6">
          <button
            onClick={() => {
              if (!(token && user)) {
                toast.error("Please login first");
                setPreferredLoginRole("owner");
                setShowLogin(true);
                return;
              }

              if (!["owner", "admin"].includes(user.role)) {
                toast.error("Only owner or admin can access dashboard");
                return;
              }

              navigate("/owner");
            }}
            className="cursor-pointer"
          >
            Dashboard
          </button>
          {token && user ? (
            <button
              onClick={logout}
              className="cursor-pointer px-8 py-2 bg-blue-500 hover:bg-blue-600 transition-all text-white rounded-lg"
            >
              Logout
            </button>
          ) : (
            <button
              onClick={() => {
                setPreferredLoginRole(null);
                setShowLogin(true);
              }}
              className="cursor-pointer px-8 py-2 bg-blue-500 hover:bg-blue-600 transition-all text-white rounded-lg"
            >
              Login
            </button>
          )}
        </div>
      </div>

      <button
        className="sm:hidden cursor-pointer"
        aria-label="Menu"
        onClick={() => setOpen(!open)}
      >
        <img src={open ? assets.close_icon : assets.menu_icon} alt="menu" />
      </button>
    </div>
  );
};

export default Navbar;
