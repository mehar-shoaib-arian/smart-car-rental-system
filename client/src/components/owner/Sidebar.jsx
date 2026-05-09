import React, { useEffect, useRef, useState } from "react";
import { ownerMenuLinks, assets } from "../../assets/assets";
import { NavLink } from "react-router-dom";
import { useAppContext } from "../../context/contextStore";
import { toast } from "react-hot-toast";

const Sidebar = () => {
  const { user, setUser, axios } = useAppContext();
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [openTicketCount, setOpenTicketCount] = useState(0);
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  const handleSaveImage = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const token = sessionStorage.getItem("token");
      const formData = new FormData();
      formData.append("image", selectedFile);

      const { data } = await axios.post("/api/owner/update-image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (data.success) {
        toast.success("Profile image updated!");
        const { data: userData } = await axios.get("/api/user/data");
        if (userData.success) {
          setUser(userData.user);
        }
        setPreviewImage(null);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = null;
      } else {
        toast.error(data.message || "Failed to update image.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update image.");
    } finally {
      setUploading(false);
    }
  };

  const handleCancelImage = () => {
    setPreviewImage(null);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = null;
  };

  const displayImage = previewImage || user?.image || assets.user_profile;

  const visibleMenuLinks = ownerMenuLinks.filter(
    (link) =>
      link.path !== "/owner/manage-users" || user?.role === "admin",
  );

  useEffect(() => {
    const fetchOpenTicketCount = async () => {
      if (!["owner", "admin"].includes(user?.role || "")) {
        setOpenTicketCount(0);
        return;
      }

      try {
        const token = sessionStorage.getItem("token");
        const { data } = await axios.get("/api/owner/support-tickets", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (data.success) {
          setOpenTicketCount(
            data.tickets.filter((ticket) => ticket.status === "open").length,
          );
        }
      } catch {
        setOpenTicketCount(0);
      }
    };

    fetchOpenTicketCount();
  }, [axios, user?.role]);

  return (
    <div
      className="relative min-h-screen md:flex flex-col items-center pt-8
    max-w-13 md:max-w-60 w-full border-r border-borderColor text-sm"
    >
      <div className="flex flex-col items-center gap-2 px-2">
        <div className="group relative">
          <label htmlFor="sidebar-image" className="cursor-pointer">
            <img
              src={displayImage}
              alt="profile"
              className="w-20 h-20 rounded-full object-cover border-2 border-borderColor"
            />
            <div
              className="absolute hidden top-0 right-0 left-0 bottom-0
              bg-black/20 rounded-full group-hover:flex items-center
              justify-center cursor-pointer"
            >
              <img src={assets.edit_icon} alt="edit" className="w-5 h-5" />
            </div>
          </label>
          <input
            ref={fileInputRef}
            type="file"
            id="sidebar-image"
            accept="image/*"
            hidden
            onChange={handleImageChange}
          />
        </div>

        <p className="mt-1 text-base font-medium text-gray-700 max-md:hidden text-center truncate w-full px-2">
          {user?.name || "Owner"}
        </p>

        <p className="text-xs text-gray-400 max-md:hidden text-center truncate w-full px-2">
          {user?.email || ""}
        </p>

        {selectedFile && (
          <div className="flex gap-2 mt-1 max-md:hidden">
            <button
              onClick={handleSaveImage}
              disabled={uploading}
              className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs rounded-md cursor-pointer disabled:cursor-not-allowed"
            >
              {uploading ? (
                "Saving..."
              ) : (
                <>
                  <img src={assets.check_icon} width={11} alt="" />
                  Save
                </>
              )}
            </button>
            <button
              onClick={handleCancelImage}
              className="px-3 py-1 border border-borderColor text-xs rounded-md cursor-pointer hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="w-full mt-4">
        {visibleMenuLinks.map((link, index) => (
          <NavLink
            key={index}
            to={link.path}
            end={link.path === "/owner"}
            className={({ isActive }) =>
              `relative flex cursor-pointer items-center gap-2 w-full py-3 pl-4 first:mt-6 ${
                isActive ? "bg-primary/10 text-primary" : "text-gray-600"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <img
                  src={isActive ? link.coloredIcon : link.icon}
                  alt={link.name}
                />
                <span className="max-md:hidden">{link.name}</span>
                {link.path === "/owner/support-tickets" &&
                  openTicketCount > 0 && (
                    <span className="ml-auto mr-4 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white max-md:hidden">
                      {openTicketCount}
                    </span>
                  )}
                {isActive && (
                  <div className="bg-primary w-1.5 h-8 rounded-r absolute right-0" />
                )}
              </>
            )}
          </NavLink>
        ))}

        <NavLink
          to="/owner/overdue-bookings"
          className={({ isActive }) =>
            `relative flex cursor-pointer items-center gap-2 w-full py-3 pl-4 ${
              isActive ? "bg-primary/10 text-primary" : "text-gray-600"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <img
                src={assets.cautionIconColored}
                alt=""
                className="w-5 h-5 object-contain"
              />
              <span className="max-md:hidden">Overdue Bookings</span>
              {isActive && (
                <div className="bg-primary w-1.5 h-8 rounded-r absolute right-0" />
              )}
            </>
          )}
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;
