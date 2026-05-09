import { useCallback, useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { AppContext } from "./contextStore";

axios.defaults.baseURL =
  import.meta.env.VITE_BASE_URL || "http://localhost:3000";

const hasBackofficeAccess = (role) => role === "owner" || role === "admin";

export const AppProvider = ({ children }) => {
  const navigate = useNavigate();
  const currency = import.meta.env.VITE_CURRENCY;

  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [preferredLoginRole, setPreferredLoginRole] = useState(null);
  const [showListCarForm, setShowListCarForm] = useState(false);
  const [pickupDate, setPickupDate] = useState("");
  const [returnDate, setReturnDate] = useState("");

  const [cars, setCars] = useState([]);

  const fetchUser = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/user/data");
      if (data.success && data.user) {
        setUser(data.user);
        setIsOwner(hasBackofficeAccess(data.user.role));
      } else {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("role");
        setToken(null);
        setUser(null);
        setIsOwner(false);
        // Do not navigate — let the page handle the unauthenticated state
      }
    } catch {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("role");
      setToken(null);
      setUser(null);
      setIsOwner(false);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const fetchCars = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/user/cars");
      data.success ? setCars(data.cars) : toast.error(data.message);
    } catch (error) {
      toast.error(error.message);
    }
  }, []);

  const login = async (credentials) => {
    try {
      const { data } = await axios.post("/api/user/login", credentials);
      if (data.success) {
        sessionStorage.setItem("token", data.token);
        setToken(data.token);
        setUser(data.user);
        setIsOwner(hasBackofficeAccess(data.user.role));
        toast.success("Login successful!");
        setShowLogin(false);
        // Navigation is handled by the onSuccess callback in App.jsx
        // so we do NOT navigate here
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const logout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("role");
    setToken(null);
    setUser(null);
    setIsOwner(false);
    axios.defaults.headers.common["Authorization"] = "";
    toast.success("you have been logged out");
  };

  useEffect(() => {
    const storedToken = sessionStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
    } else {
      setAuthLoading(false);
    }
    fetchCars();
  }, [fetchCars]);

  useEffect(() => {
    if (token) {
      // FIX: Added 'Bearer ' prefix for standard JWT auth
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      fetchUser();
    } else {
      axios.defaults.headers.common["Authorization"] = "";
      // Keep session active on refresh: only end auth loading when no token exists in session.
      if (!sessionStorage.getItem("token")) {
        setAuthLoading(false);
      }
    }
  }, [token, fetchUser]);

  const value = {
    navigate,
    currency,
    axios,
    user,
    setUser,
    token,
    setToken,
    isOwner,
    setIsOwner,
    authLoading,
    showLogin,
    setShowLogin,
    preferredLoginRole,
    setPreferredLoginRole,
    showListCarForm,
    setShowListCarForm,
    logout,
    fetchCars,
    cars,
    setCars,
    pickupDate,
    setPickupDate,
    returnDate,
    setReturnDate,
    login,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
