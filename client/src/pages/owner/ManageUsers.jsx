import React, { useCallback, useEffect, useState } from "react";
import Title from "../../components/owner/Title";
import { useAppContext } from "../../context/contextStore";
import { toast } from "react-hot-toast";
import { assets } from "../../assets/assets";
import { Navigate } from "react-router-dom";

const ManageUsers = () => {
  const { axios, user: currentUser } = useAppContext();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [updatingUserId, setUpdatingUserId] = useState("");

  const getAuthHeaders = () => {
    const token = sessionStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/owner/all-users", {
        headers: getAuthHeaders(),
      });
      if (data.success) {
        setUsers(data.users);
      } else {
        toast.error(data.message || "Failed to fetch users.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch users.");
    } finally {
      setLoading(false);
    }
  }, [axios]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      !search.trim() ||
      user.name?.toLowerCase().includes(search.trim().toLowerCase()) ||
      user.email?.toLowerCase().includes(search.trim().toLowerCase());

    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const totalUsers = users.length;
  const totalAdmins = users.filter((u) => u.role === "admin").length;
  const totalOwners = users.filter((u) => u.role === "owner").length;
  const totalRegularUsers = users.filter((u) => u.role === "user").length;

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-PK", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getRoleBadgeClasses = (role) => {
    if (role === "admin") return "bg-purple-100 text-purple-600";
    if (role === "owner") return "bg-blue-100 text-blue-600";
    return "bg-green-100 text-green-600";
  };

  const getRoleLabel = (role) => {
    if (role === "admin") return "Admin";
    if (role === "owner") return "Owner";
    return "Renter";
  };

  const handleMakeAdmin = async (targetUser) => {
    setUpdatingUserId(targetUser._id);
    try {
      const { data } = await axios.post(
        "/api/owner/change-role-admin",
        { userId: targetUser._id },
        { headers: getAuthHeaders() },
      );

      if (data.success) {
        toast.success(data.message || "User promoted to admin.");
        setUsers((prev) =>
          prev.map((user) =>
            user._id === targetUser._id ? { ...user, role: "admin" } : user,
          ),
        );
      } else {
        toast.error(data.message || "Failed to update user role.");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update user role.",
      );
    } finally {
      setUpdatingUserId("");
    }
  };

  if (currentUser?.role && currentUser.role !== "admin") {
    return <Navigate to="/owner" replace />;
  }

  return (
    <div className="px-4 pt-10 md:px-10 w-full pb-16">
      <Title
        title="Manage Users"
        subtitle="View all registered users on the SmartRent platform."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6 max-w-4xl">
        <div className="bg-white border border-borderColor rounded-xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-gray-800">{totalUsers}</p>
          <p className="text-xs text-gray-400 mt-1">Total Users</p>
        </div>
        <div className="bg-white border border-borderColor rounded-xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-purple-600">{totalAdmins}</p>
          <p className="text-xs text-gray-400 mt-1">Admins</p>
        </div>
        <div className="bg-white border border-borderColor rounded-xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-blue-600">{totalOwners}</p>
          <p className="text-xs text-gray-400 mt-1">Owners</p>
        </div>
        <div className="bg-white border border-borderColor rounded-xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-green-600">
            {totalRegularUsers}
          </p>
          <p className="text-xs text-gray-400 mt-1">Renters</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5 max-w-4xl">
        <div className="flex items-center bg-white border border-borderColor rounded-lg px-3 h-10 gap-2 flex-1 w-full">
          <img
            src={assets.search_icon}
            alt="search"
            className="w-4 h-4 opacity-50"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="flex-1 outline-none text-sm text-gray-600 bg-transparent"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-gray-400 hover:text-gray-600 cursor-pointer text-lg leading-none"
            >
              x
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 flex-wrap">
          {[
            { key: "all", label: `All (${totalUsers})` },
            { key: "admin", label: `Admins (${totalAdmins})` },
            { key: "owner", label: `Owners (${totalOwners})` },
            { key: "user", label: `Renters (${totalRegularUsers})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setRoleFilter(tab.key)}
              className={`px-3 py-1.5 text-xs rounded-md cursor-pointer transition-all whitespace-nowrap ${
                roleFilter === tab.key
                  ? "bg-white text-blue-600 font-semibold shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl w-full rounded-xl overflow-hidden border border-borderColor shadow-sm bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
            Loading users...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <p className="text-base">No users found.</p>
            {(search || roleFilter !== "all") && (
              <button
                onClick={() => {
                  setSearch("");
                  setRoleFilter("all");
                }}
                className="mt-3 text-xs text-blue-500 hover:text-blue-600 cursor-pointer"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <table className="w-full border-collapse text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-400 text-xs">
              <tr>
                <th className="p-4 font-medium">#</th>
                <th className="p-4 font-medium">User</th>
                <th className="p-4 font-medium max-md:hidden">Email</th>
                <th className="p-4 font-medium">Role</th>
                <th className="p-4 font-medium max-md:hidden">Joined</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => (
                <tr
                  key={user._id}
                  className="border-t border-borderColor hover:bg-gray-50 transition-colors"
                >
                  <td className="p-4 text-gray-400 text-xs">{index + 1}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {user.image ? (
                        <img
                          src={user.image}
                          alt={user.name}
                          className="w-9 h-9 rounded-full object-cover border border-borderColor"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center border border-borderColor">
                          <span className="text-blue-600 text-sm font-semibold uppercase">
                            {user.name?.charAt(0) || "U"}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-700 text-sm">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-400 md:hidden">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 max-md:hidden">
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getRoleBadgeClasses(user.role)}`}
                    >
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="p-4 max-md:hidden">
                    <p className="text-xs text-gray-400">
                      {formatDate(user.createdAt)}
                    </p>
                  </td>
                  <td className="p-4">
                    {user.role !== "admin" && user._id !== currentUser?._id ? (
                      <button
                        type="button"
                        onClick={() => handleMakeAdmin(user)}
                        disabled={updatingUserId === user._id}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs rounded-md cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {updatingUserId === user._id
                          ? "Updating..."
                          : "Make Admin"}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">
                        {user.role === "admin"
                          ? "Already admin"
                          : "Current account"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!loading && filteredUsers.length > 0 && (
        <p className="text-xs text-gray-400 mt-3 max-w-4xl">
          Showing{" "}
          <span className="font-medium text-gray-600">
            {filteredUsers.length}
          </span>{" "}
          of <span className="font-medium text-gray-600">{totalUsers}</span>{" "}
          users
          {(search || roleFilter !== "all") && " (filtered)"}
        </p>
      )}
    </div>
  );
};

export default ManageUsers;
