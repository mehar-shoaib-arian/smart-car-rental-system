import React, { useEffect, useRef } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Login from "./components/Login";
import Chatbot from "./components/ChatbotRestored";

import Home from "./pages/Home";
import Cars from "./pages/Cars";
import CarDetails from "./pages/CarDetails";
import MyBookings from "./pages/MyBookings";
import ListYourCar from "./pages/ListYourCar";

import Layout from "./pages/owner/Layout";
import Dashboard from "./pages/owner/Dashboard";
import AddCar from "./pages/owner/AddCar";
import ManageCars from "./pages/owner/ManageCars";
import ManageBookings from "./pages/owner/ManageBookings";
import LiveTracking from "./pages/owner/LiveTracking";
import ListingRequests from "./pages/owner/ListingRequests";
import BookingConfirmation from "./pages/BookingConfirmation";
import PaymentSuccess from "./pages/PaymentSuccess";

import AdminFaq from "./pages/owner/AdminFaq";
import Profile from "./pages/owner/Profile";
import ManageUsers from "./pages/owner/ManageUsers";
import OverdueBookings from "./pages/owner/OverdueBookings";
import SupportTickets from "./pages/owner/SupportTickets";
import { useAppContext } from "./context/contextStore";

const App = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const returnToRef = useRef(null);
  const {
    showLogin,
    setShowLogin,
    preferredLoginRole,
    setPreferredLoginRole,
    showListCarForm,
    setShowListCarForm,
    axios,
    token,
    user,
    authLoading,
    setToken,
    setUser,
    setIsOwner,
  } = useAppContext();

  // Remember the current path before login opens so we can return after success
  const openLoginWithReturn = (show) => {
    if (show && !returnToRef.current) {
      returnToRef.current = location.pathname + location.search;
    }
    if (!show) {
      returnToRef.current = null;
    }
  };

  // Owner panel check
  const isOwnerPath = location.pathname.startsWith("/owner");
  const isAuthenticated = Boolean(token && user);
  const hasOwnerAccess = Boolean(
    user?.role === "owner" || user?.role === "admin",
  );

  useEffect(() => {
    if (!authLoading && isOwnerPath && !isAuthenticated) {
      setShowLogin(true);
      navigate("/", { replace: true });
    }
  }, [authLoading, isOwnerPath, isAuthenticated, navigate, setShowLogin]);

  useEffect(() => {
    const verifyOwnerAccess = async () => {
      if (!isOwnerPath) return;

      const rawToken = sessionStorage.getItem("token");
      if (!rawToken) {
        setShowLogin(true);
        navigate("/", { replace: true });
        return;
      }

      try {
        const { data } = await axios.get("/api/user/data", {
          headers: { Authorization: `Bearer ${rawToken}` },
        });

        if (
          !data?.success ||
          !["owner", "admin"].includes(data?.user?.role || "")
        ) {
          setShowLogin(true);
          navigate("/", { replace: true });
        }
      } catch {
        setShowLogin(true);
        navigate("/", { replace: true });
      }
    };

    verifyOwnerAccess();
  }, [axios, isOwnerPath, navigate, setShowLogin]);

  return (
    <>
      {/* Login Modal */}
      {showLogin && (
        <Login
          setShowLogin={(value) => {
            setShowLogin(value);
            openLoginWithReturn(value);
            if (!value) {
              setPreferredLoginRole(null);
            }
          }}
          requiredRole={preferredLoginRole}
          onSuccess={(role, token, user) => {
            if (token) {
              setToken(token);
            }
            if (user) {
              setUser(user);
              setIsOwner(["owner", "admin"].includes(user.role));
            }
            setPreferredLoginRole(null);
            if (role === "owner" || role === "admin") {
              navigate("/owner");
            } else {
              // Go back to the page the user was on, or stay on current page
              const returnTo = returnToRef.current;
              returnToRef.current = null;
              navigate(
                returnTo && returnTo !== "/"
                  ? returnTo
                  : location.pathname + location.search,
              );
            }
          }}
        />
      )}
      {showListCarForm && (
        <ListYourCar asModal onClose={() => setShowListCarForm(false)} />
      )}

      {/* Navbar (User Side Only) */}
      {!isOwnerPath && (
        <Navbar setShowLogin={setShowLogin} showLogin={showLogin} />
      )}

      {/* Routes */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cars" element={<Cars />} />
        <Route path="/car-details/:id" element={<CarDetails />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/booking-confirmation" element={<BookingConfirmation />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/list-your-car" element={<ListYourCar />} />

        {/* Owner Routes */}
        <Route
          path="/owner"
          element={
            authLoading ? null : isAuthenticated && hasOwnerAccess ? (
              <Layout />
            ) : (
              <Navigate to="/" replace />
            )
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="add-car" element={<AddCar />} />
          <Route path="manage-cars" element={<ManageCars />} />
          <Route path="manage-bookings" element={<ManageBookings />} />
          <Route path="live-tracking" element={<LiveTracking />} />
          <Route path="manage-listing-cars" element={<ListingRequests />} />
          <Route path="manage-faqs" element={<AdminFaq />} />
          <Route path="profile" element={<Profile />} />
          <Route path="manage-users" element={<ManageUsers />} />
          <Route path="support-tickets" element={<SupportTickets />} />
          <Route path="overdue-bookings" element={<OverdueBookings />} />
        </Route>
      </Routes>

      {/* Chatbot (User Side Only) */}
      {!isOwnerPath && <Chatbot />}

      {/* Footer (User Side Only) */}
      {!isOwnerPath && <Footer />}
    </>
  );
};

export default App;
