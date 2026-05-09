import React from "react";
import { assets } from "../../assets/assets";
import { Link } from "react-router-dom";
import { useAppContext } from "../../context/contextStore";

const NavbarOwner = () => {
  const { logout, user } = useAppContext();

  return (
    <div
      className="flex items-center justify-between px-6
    md:px-10 py-4 text-gray-500 border-b border-borderColor
    relative transition-all"
    >
      <Link to="/">
        <img src={assets.logo} alt=" " className="h-7" />
      </Link>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {user?.image && (
            <img
              src={user.image}
              alt="profile"
              className="w-8 h-8 rounded-full object-cover border border-borderColor"
            />
          )}
          <p>Welcome, {user?.name || "Owner"}</p>
        </div>
        <button
          onClick={logout}
          className="px-4 py-1.5 rounded bg-blue-500 hover:bg-blue-600 text-white cursor-pointer"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default NavbarOwner;
