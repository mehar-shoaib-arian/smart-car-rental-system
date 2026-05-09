import React from "react";
import NavbarOwner from "../../components/owner/NavbarOwner";
import Sidebar from "../../components/owner/Sidebar";
import { Navigate, Outlet } from "react-router-dom";
import { useAppContext } from "../../context/contextStore";

const Layout = () => {
  const { token, user } = useAppContext();

  if (!token || !user || !["owner", "admin"].includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex flex-col">
      <NavbarOwner />
      <div className="flex">
        <Sidebar />
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
