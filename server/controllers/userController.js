import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Car from "../models/Car.js";
import {
  sendPasswordResetOtpEmail,
  sendWelcomeEmail,
} from "../configs/emailService.js";

const buildRecommendationScore = (car, preferences) => {
  let score = 0;

  if (
    preferences.location &&
    String(car.location || "").toLowerCase() === preferences.location
  ) {
    score += 40;
  }

  if (
    preferences.category &&
    String(car.category || "").toLowerCase() === preferences.category
  ) {
    score += 25;
  }

  if (preferences.seats && Number(car.seating_capacity) >= preferences.seats) {
    score += 15;
    score += Math.max(0, 6 - Math.abs(Number(car.seating_capacity) - preferences.seats));
  }

  if (preferences.budget) {
    if (Number(car.pricePerDay) <= preferences.budget) {
      score += 20;
      score += Math.max(
        0,
        10 - Math.round((preferences.budget - Number(car.pricePerDay)) / 1000),
      );
    } else {
      score -= Math.min(
        15,
        Math.round((Number(car.pricePerDay) - preferences.budget) / 1000),
      );
    }
  }

  score += Math.max(0, Number(car.year || 0) - 2018);

  return score;
};

// =============================
// Generate JWT Token
// =============================
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );
};

// =============================
// Register (User or Owner)
// =============================
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.json({
        success: false,
        message: "Fill all required fields",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "user",
    });

    const token = generateToken(newUser);

    // ── Send welcome email (non-blocking) ──
    try {
      sendWelcomeEmail({
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      });
    } catch (emailErr) {
      console.log("[Email] Welcome email error:", emailErr.message);
    }

    res.json({
      success: true,
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Register error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =============================
// Login (User or Owner)
// =============================
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.json({
        success: false,
        message: "Please provide email and password",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.json({
        success: false,
        message: "Wrong password",
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const requestPasswordResetOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.json({
        success: false,
        message: "Please provide your email address",
      });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.passwordResetOtp = await bcrypt.hash(otp, 10);
    user.passwordResetOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    try {
      await sendPasswordResetOtpEmail({
        name: user.name,
        email: user.email,
        otp,
      });
    } catch (emailErr) {
      console.log("[Email] Password reset OTP error:", emailErr.message);
    }

    res.json({
      success: true,
      message: "Password reset OTP sent to your email.",
    });
  } catch (error) {
    console.error("Request password reset error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const resetPasswordWithOtp = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.json({
        success: false,
        message: "Email, OTP and new password are required",
      });
    }

    if (String(newPassword).length < 6) {
      return res.json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.passwordResetOtp || !user.passwordResetOtpExpires) {
      return res.json({
        success: false,
        message: "Please request a new OTP first",
      });
    }

    if (user.passwordResetOtpExpires < new Date()) {
      user.passwordResetOtp = "";
      user.passwordResetOtpExpires = null;
      await user.save();
      return res.json({
        success: false,
        message: "OTP has expired. Please request a new one",
      });
    }

    const isOtpValid = await bcrypt.compare(String(otp), user.passwordResetOtp);

    if (!isOtpValid) {
      return res.json({
        success: false,
        message: "Invalid OTP",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordResetOtp = "";
    user.passwordResetOtpExpires = null;
    await user.save();

    res.json({
      success: true,
      message:
        "Password reset successfully. Please login with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =============================
// Get Logged In User Data
// =============================
export const getUserData = async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =============================
// Get Available Cars
// =============================
export const getCars = async (req, res) => {
  try {
    const { q = "", location = "", budget = "", seats = "", category = "" } =
      req.query;

    const filter = { isAvailable: true, owner: { $ne: null } };

    if (location.trim()) {
      filter.location = { $regex: location.trim(), $options: "i" };
    }

    if (q.trim()) {
      filter.$or = [
        { brand: { $regex: q.trim(), $options: "i" } },
        { model: { $regex: q.trim(), $options: "i" } },
        { category: { $regex: q.trim(), $options: "i" } },
      ];
    }

    // Keep listing order stable: older cars first, newly added cars at the end.
    const cars = await Car.find(filter).sort({ createdAt: 1 });

    const normalizedPreferences = {
      location: String(location || "")
        .trim()
        .toLowerCase(),
      category: String(category || "")
        .trim()
        .toLowerCase(),
      budget: budget === "" ? null : Number(budget),
      seats: seats === "" ? null : Number(seats),
    };

    const hasSmartPreferences = Boolean(
      normalizedPreferences.location ||
        normalizedPreferences.category ||
        Number.isFinite(normalizedPreferences.budget) ||
        Number.isFinite(normalizedPreferences.seats),
    );

    const recommendedCars = hasSmartPreferences
      ? cars
          .map((car) => ({
            ...car.toObject(),
            recommendationScore: buildRecommendationScore(
              car,
              normalizedPreferences,
            ),
          }))
          .sort((a, b) => b.recommendationScore - a.recommendationScore)
          .slice(0, 3)
      : [];

    res.json({
      success: true,
      cars,
      recommendedCars,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
