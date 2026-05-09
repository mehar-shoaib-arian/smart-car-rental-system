import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { useAppContext } from "../../context/contextStore";
import Title from "../../components/owner/Title";
import { assets } from "../../assets/assets";

const Profile = () => {
  const { user, setUser, axios } = useAppContext();

  // Profile form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [roleLoading, setRoleLoading] = useState(false);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Image state
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const getAuthHeaders = () => {
    const token = sessionStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // ── Update name & email ──────────────────────────────────────────────
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Name and email are required.");
      return;
    }
    setProfileLoading(true);
    try {
      const { data } = await axios.put(
        "/api/owner/update-profile",
        { name: name.trim(), email: email.trim() },
        { headers: getAuthHeaders() },
      );
      if (data.success) {
        toast.success(data.message);
        setUser(data.user);
      } else {
        toast.error(data.message || "Failed to update profile.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile.");
    } finally {
      setProfileLoading(false);
    }
  };

  // ── Update password ──────────────────────────────────────────────────
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill all password fields.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    setPasswordLoading(true);
    try {
      const { data } = await axios.put(
        "/api/owner/update-profile",
        { currentPassword, newPassword },
        { headers: getAuthHeaders() },
      );
      if (data.success) {
        toast.success("Password updated successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(data.message || "Failed to update password.");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update password.",
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  // ── Update profile image ─────────────────────────────────────────────
  const handleImageUpdate = async () => {
    if (!imageFile) return;
    setImageLoading(true);
    try {
      const token = sessionStorage.getItem("token");
      const formData = new FormData();
      formData.append("image", imageFile);

      const { data } = await axios.post("/api/owner/update-image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (data.success) {
        toast.success("Profile image updated!");
        // Refresh user data to get new image URL
        const { data: userData } = await axios.get("/api/user/data", {
          headers: getAuthHeaders(),
        });
        if (userData.success) setUser(userData.user);
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = null;
      } else {
        toast.error(data.message || "Failed to update image.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update image.");
    } finally {
      setImageLoading(false);
    }
  };

  const handleChangeBackToOwner = async () => {
    setRoleLoading(true);
    try {
      const { data } = await axios.post(
        "/api/owner/change-role",
        {},
        { headers: getAuthHeaders() },
      );

      if (data.success) {
        toast.success(data.message || "Role updated successfully.");
        if (data.user) {
          setUser(data.user);
        } else {
          const { data: userData } = await axios.get("/api/user/data", {
            headers: getAuthHeaders(),
          });
          if (userData.success) setUser(userData.user);
        }
      } else {
        toast.error(data.message || "Failed to update role.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update role.");
    } finally {
      setRoleLoading(false);
    }
  };

  const displayImage = imagePreview || user?.image || assets.user_profile;

  return (
    <div className="px-4 pt-10 md:px-10 w-full pb-16">
      <Title
        title="My Profile"
        subtitle="Manage your account information, profile picture, and password."
      />

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl">
        {/* ── LEFT: Profile Image Card ── */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-borderColor rounded-xl p-6 flex flex-col items-center gap-4">
            <div className="relative group">
              <img
                src={displayImage}
                alt="profile"
                className="w-28 h-28 rounded-full object-cover border-4 border-borderColor shadow"
              />
              <label
                htmlFor="profile-image-input"
                className="absolute inset-0 bg-black/30 rounded-full hidden group-hover:flex items-center justify-center cursor-pointer"
              >
                <img src={assets.edit_icon} alt="edit" className="w-6 h-6" />
              </label>
              <input
                ref={fileInputRef}
                type="file"
                id="profile-image-input"
                accept="image/*"
                hidden
                onChange={(e) => setImageFile(e.target.files[0] || null)}
              />
            </div>

            <div className="text-center">
              <p className="text-base font-semibold text-gray-800">
                {user?.name || "Owner"}
              </p>
              <p className="text-sm text-gray-400">{user?.email || ""}</p>
              <span className="inline-block mt-2 px-3 py-1 bg-blue-50 text-blue-600 text-xs rounded-full border border-blue-100 capitalize">
                {user?.role || "owner"}
              </span>
            </div>

            {imageFile && (
              <div className="flex flex-col gap-2 w-full mt-2">
                <button
                  onClick={handleImageUpdate}
                  disabled={imageLoading}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm rounded-lg cursor-pointer disabled:cursor-not-allowed transition-all"
                >
                  {imageLoading ? "Uploading..." : "Save New Photo"}
                </button>
                <button
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = null;
                  }}
                  className="w-full py-2 border border-borderColor text-sm rounded-lg cursor-pointer hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            )}

            {!imageFile && (
              <label
                htmlFor="profile-image-input"
                className="w-full text-center py-2 border border-borderColor text-sm rounded-lg cursor-pointer hover:bg-gray-50 transition-all text-gray-600"
              >
                Change Photo
              </label>
            )}
          </div>
        </div>

        {/* ── RIGHT: Forms ── */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Personal Info Form */}
          <div className="bg-white border border-borderColor rounded-xl p-6">
            <h3 className="text-base font-semibold text-gray-700 mb-5">
              Personal Information
            </h3>
            <form
              onSubmit={handleProfileUpdate}
              className="flex flex-col gap-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-500">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    required
                    className="border border-borderColor rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-500">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="border border-borderColor rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-500">Role</label>
                <input
                  type="text"
                  value={user?.role || "owner"}
                  disabled
                  className="border border-borderColor rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 capitalize cursor-not-allowed"
                />
              </div>

              {user?.role === "admin" && (
                <div className="flex items-center justify-between gap-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-blue-700">
                      Switch this account back to owner
                    </p>
                    <p className="text-xs text-blue-600">
                      Use this if you want the profile to show owner access
                      again.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleChangeBackToOwner}
                    disabled={roleLoading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm rounded-lg cursor-pointer disabled:cursor-not-allowed transition-all whitespace-nowrap"
                  >
                    {roleLoading ? "Updating..." : "Make Owner"}
                  </button>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm rounded-lg cursor-pointer disabled:cursor-not-allowed transition-all"
                >
                  {profileLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="bg-white border border-borderColor rounded-xl p-6">
            <h3 className="text-base font-semibold text-gray-700 mb-5">
              Change Password
            </h3>
            <form
              onSubmit={handlePasswordUpdate}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-500">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                    className="border border-borderColor rounded-lg px-3 py-2 pr-11 text-sm outline-none focus:border-blue-400 transition-all w-full"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                    aria-label={
                      showCurrentPassword ? "Hide password" : "Show password"
                    }
                  >
                    <img
                      src={
                        showCurrentPassword
                          ? assets.eye_close_icon
                          : assets.eye_icon
                      }
                      alt=""
                      className="w-5 h-5"
                    />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-500">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      required
                      className="border border-borderColor rounded-lg px-3 py-2 pr-11 text-sm outline-none focus:border-blue-400 transition-all w-full"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                      aria-label={
                        showNewPassword ? "Hide password" : "Show password"
                      }
                    >
                      <img
                        src={
                          showNewPassword
                            ? assets.eye_close_icon
                            : assets.eye_icon
                        }
                        alt=""
                        className="w-5 h-5"
                      />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-500">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      required
                      className="border border-borderColor rounded-lg px-3 py-2 pr-11 text-sm outline-none focus:border-blue-400 transition-all w-full"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                    >
                      <img
                        src={
                          showConfirmPassword
                            ? assets.eye_close_icon
                            : assets.eye_icon
                        }
                        alt=""
                        className="w-5 h-5"
                      />
                    </button>
                  </div>
                </div>
              </div>

              {newPassword &&
                confirmPassword &&
                newPassword !== confirmPassword && (
                  <p className="text-xs text-red-500">
                    Passwords do not match.
                  </p>
                )}
              {newPassword &&
                newPassword.length > 0 &&
                newPassword.length < 6 && (
                  <p className="text-xs text-red-500">
                    Password must be at least 6 characters.
                  </p>
                )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm rounded-lg cursor-pointer disabled:cursor-not-allowed transition-all"
                >
                  {passwordLoading ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
