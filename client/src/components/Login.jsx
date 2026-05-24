import React, { useEffect, useState, useRef } from "react";
import { toast } from "react-hot-toast";
import { useAppContext } from "../context/contextStore";
import { assets } from "../assets/assets";
import {
  isAlphabeticName,
  isAlphanumericPassword,
  isGmailAddress,
  validationMessages,
} from "../utils/validators";

const Login = ({ setShowLogin, onSuccess, requiredRole = null }) => {
  const { axios } = useAppContext();
  const [role, setRole] = useState("user");
  const [state, setState] = useState("login"); // login or register

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  const modalRef = useRef(null);

  useEffect(() => {
    if (requiredRole) {
      setRole(requiredRole);
      setState("login");
    }
  }, [requiredRole]);

  useEffect(() => {
    if (role !== "user" && state === "register") {
      setState("login");
    }
  }, [role, state]);

  useEffect(() => {
    setForgotPasswordMode(false);
    setOtpSent(false);
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setResendSeconds(0);
  }, [role, state]);

  useEffect(() => {
    if (resendSeconds <= 0) return undefined;

    const timerId = window.setInterval(() => {
      setResendSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [resendSeconds]);

  const sendPasswordResetOtp = async () => {
    const res = await axios.post("/api/user/forgot-password", { email });
    if (res.data.success) {
      toast.success(res.data.message);
      setOtpSent(true);
      setResendSeconds(60);
    } else {
      toast.error(res.data.message);
    }
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = "auto");
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setShowLogin(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setShowLogin]);

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      if (forgotPasswordMode) {
        if (!isGmailAddress(email)) {
          toast.error(validationMessages.gmail);
          return;
        }

        if (!otpSent) {
          await sendPasswordResetOtp();
          return;
        }

        if (!otp || !newPassword || !confirmPassword) {
          toast.error("Please fill all reset fields");
          return;
        }

        if (!isAlphanumericPassword(newPassword)) {
          toast.error(validationMessages.password);
          return;
        }

        if (newPassword !== confirmPassword) {
          toast.error("Passwords do not match");
          return;
        }

        const res = await axios.post("/api/user/reset-password", {
          email,
          otp,
          newPassword,
        });

        if (res.data.success) {
          toast.success(res.data.message);
          setForgotPasswordMode(false);
          setOtpSent(false);
          setOtp("");
          setNewPassword("");
          setConfirmPassword("");
          setResendSeconds(0);
          setPassword("");
          setState("login");
        } else {
          toast.error(res.data.message);
        }
        return;
      }

      if (state === "register") {
        if (!isAlphabeticName(name)) {
          toast.error(validationMessages.name);
          return;
        }

        if (!isGmailAddress(email)) {
          toast.error(validationMessages.gmail);
          return;
        }

        if (!isAlphanumericPassword(password)) {
          toast.error(validationMessages.password);
          return;
        }

        const res = await axios.post("/api/user/register", {
          name,
          email,
          password,
        });

        if (res.data.success) {
          sessionStorage.setItem("token", res.data.token);

          onSuccess?.(res.data.user.role, res.data.token, res.data.user);
          setShowLogin(false);
        } else {
          toast.error(res.data.message);
        }
      } else {
        if (!isGmailAddress(email)) {
          toast.error(validationMessages.gmail);
          return;
        }

        if (!password) {
          toast.error("Password is required.");
          return;
        }

        // ================= LOGIN =================
        const res = await axios.post("/api/user/login", {
          email,
          password,
        });

        if (res.data.success) {
          if (res.data.user?.role !== role) {
            if (requiredRole) {
              toast.error(`Please login as ${requiredRole}`);
            } else {
              toast.error(
                `This account is registered as ${res.data.user?.role || "user"}. Please select ${res.data.user?.role || "user"}.`,
              );
            }
            return;
          }

          sessionStorage.setItem("token", res.data.token);

          onSuccess?.(res.data.user.role, res.data.token, res.data.user);
          setShowLogin(false);
        } else {
          toast.error(res.data.message);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
      <form
        ref={modalRef}
        onSubmit={onSubmitHandler}
        className="flex flex-col gap-4 p-8 w-full max-w-md bg-white rounded-lg"
      >
        {/* Role Selector */}
        <div className="flex justify-center gap-4">
          <button
            type="button"
            disabled={requiredRole === "owner"}
            onClick={() => setRole("user")}
            className={`px-4 py-1 rounded cursor-pointer ${
              role === "user" ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            User
          </button>
          <button
            type="button"
            disabled={requiredRole === "user"}
            onClick={() => setRole("owner")}
            className={`px-4 py-1 rounded cursor-pointer ${
              role === "owner" ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            Owner
          </button>
        </div>

        <h2 className="text-xl font-bold text-center">
          {forgotPasswordMode
            ? "Forgot Password"
            : state === "login"
              ? "Login"
              : "Register"}
        </h2>

        {role === "owner" && state === "register" && (
          <p className="text-sm text-center text-gray-500">
            Owner accounts cannot be self-registered here. Use owner login only.
          </p>
        )}

        {state === "register" && !forgotPasswordMode && (
          <input
            type="text"
            placeholder="Name"
            className="border p-2 rounded"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        )}

        <input
          type="email"
          placeholder="Email"
          className="border p-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {!forgotPasswordMode && (
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="border p-2 pr-11 rounded w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <img
                src={showPassword ? assets.eye_close_icon : assets.eye_icon}
                alt=""
                className="w-5 h-5"
              />
            </button>
          </div>
        )}

        {forgotPasswordMode && otpSent && (
          <>
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              className="border p-2 rounded"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                placeholder="New Password"
                className="border p-2 pr-11 rounded w-full"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                aria-label={showNewPassword ? "Hide password" : "Show password"}
              >
                <img
                  src={
                    showNewPassword ? assets.eye_close_icon : assets.eye_icon
                  }
                  alt=""
                  className="w-5 h-5"
                />
              </button>
            </div>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm New Password"
                className="border p-2 pr-11 rounded w-full"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
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
          </>
        )}

        {state === "login" && !forgotPasswordMode && (
          <p className="text-sm text-center">
            <span
              onClick={() => {
                setForgotPasswordMode(true);
                setOtpSent(false);
                setOtp("");
                setNewPassword("");
                setConfirmPassword("");
                setResendSeconds(0);
              }}
              className="text-blue-600 cursor-pointer"
            >
              Forgot Password?
            </span>
          </p>
        )}

        {forgotPasswordMode && (
          <p className="text-sm text-center">
            <span
              onClick={() => {
                setForgotPasswordMode(false);
                setOtpSent(false);
                setOtp("");
                setNewPassword("");
                setConfirmPassword("");
                setResendSeconds(0);
              }}
              className="text-blue-600 cursor-pointer"
            >
              Back to Login
            </span>
          </p>
        )}

        {forgotPasswordMode && otpSent && (
          <div className="text-sm text-center">
            {resendSeconds > 0 ? (
              <span className="text-gray-500">
                Resend OTP in {resendSeconds}s
              </span>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={async () => {
                  try {
                    setSubmitting(true);
                    await sendPasswordResetOtp();
                  } catch (error) {
                    toast.error(
                      error.response?.data?.message || "Failed to resend OTP",
                    );
                  } finally {
                    setSubmitting(false);
                  }
                }}
                className="text-blue-600 cursor-pointer disabled:text-blue-400 disabled:cursor-not-allowed"
              >
                Resend OTP
              </button>
            )}
          </div>
        )}

        {role === "user" && !forgotPasswordMode && (
          <p className="text-sm text-center">
            {state === "login" ? (
              <>
                No account?{" "}
                <span
                  onClick={() => setState("register")}
                  className="text-blue-600 cursor-pointer"
                >
                  Register
                </span>
              </>
            ) : (
              <>
                Already registered?{" "}
                <span
                  onClick={() => setState("login")}
                  className="text-blue-600 cursor-pointer"
                >
                  Login
                </span>
              </>
            )}
          </p>
        )}

        <button
          disabled={submitting}
          className="bg-blue-600 text-white py-2 rounded cursor-pointer disabled:bg-blue-400 disabled:cursor-not-allowed"
        >
          {forgotPasswordMode
            ? otpSent
              ? "Reset Password"
              : "Send OTP"
            : state === "login"
              ? "Login"
              : "Create Account"}
        </button>
      </form>
    </div>
  );
};

export default Login;
