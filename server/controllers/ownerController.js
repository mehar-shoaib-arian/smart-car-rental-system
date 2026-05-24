import imagekit from "../configs/imageKit.js";
import Booking from "../models/Booking.js";
import Car from "../models/Car.js";
import SupportTicket from "../models/SupportTicket.js";
import User from "../models/User.js";
import fs from "fs";
import bcrypt from "bcrypt";
import {
  isAlphabeticCity,
  isAlphabeticName,
  isAlphanumericPassword,
  isGmailAddress,
  isSafeText,
  isVehicleText,
} from "../utils/validators.js";

const TRACKING_ROUTE_POINTS = {
  lahore: [
    { lat: 31.5204, lng: 74.3587 },
    { lat: 31.5267, lng: 74.3477 },
    { lat: 31.5315, lng: 74.3358 },
    { lat: 31.5372, lng: 74.3254 },
    { lat: 31.5428, lng: 74.3146 },
  ],
  karachi: [
    { lat: 24.8607, lng: 67.0011 },
    { lat: 24.8661, lng: 67.0142 },
    { lat: 24.8718, lng: 67.0268 },
    { lat: 24.8786, lng: 67.0391 },
    { lat: 24.8847, lng: 67.0508 },
  ],
  islamabad: [
    { lat: 33.6844, lng: 73.0479 },
    { lat: 33.6921, lng: 73.0558 },
    { lat: 33.6993, lng: 73.0631 },
    { lat: 33.7068, lng: 73.0715 },
    { lat: 33.7134, lng: 73.0792 },
  ],
  multan: [
    { lat: 30.1575, lng: 71.5249 },
    { lat: 30.1638, lng: 71.5321 },
    { lat: 30.1702, lng: 71.5397 },
    { lat: 30.1761, lng: 71.5474 },
    { lat: 30.1819, lng: 71.5552 },
  ],
  rawalpindi: [
    { lat: 33.6007, lng: 73.0679 },
    { lat: 33.6065, lng: 73.0743 },
    { lat: 33.6124, lng: 73.0811 },
    { lat: 33.6182, lng: 73.0879 },
    { lat: 33.6243, lng: 73.0947 },
  ],
  default: [
    { lat: 31.5204, lng: 74.3587 },
    { lat: 31.5267, lng: 74.3477 },
    { lat: 31.5315, lng: 74.3358 },
    { lat: 31.5372, lng: 74.3254 },
    { lat: 31.5428, lng: 74.3146 },
  ],
};

const getTrackingRoute = (location) => {
  const key = String(location || "")
    .trim()
    .toLowerCase();
  return TRACKING_ROUTE_POINTS[key] || TRACKING_ROUTE_POINTS.default;
};

const simulateTrackedCarPosition = async (car) => {
  if (!car?.trackingSimulationActive) return car;

  const route = getTrackingRoute(car.location);
  if (!route.length) return car;

  const now = Date.now();
  const lastUpdated = car.trackingSimulationUpdatedAt
    ? new Date(car.trackingSimulationUpdatedAt).getTime()
    : 0;

  if (lastUpdated && now - lastUpdated < 3000) {
    return car;
  }

  const nextStep = (Number(car.trackingSimulationStep) + 1) % route.length;
  const nextPoint = route[nextStep];

  car.trackingSimulationStep = nextStep;
  car.currentLatitude = nextPoint.lat;
  car.currentLongitude = nextPoint.lng;
  car.liveLocationUpdatedAt = new Date(now);
  car.trackingSimulationUpdatedAt = new Date(now);
  await car.save();

  return car;
};

const uploadCarImage = async (imageFile) => {
  try {
    const fileBuffer = fs.readFileSync(imageFile.path);

    // Sanitize the original filename to avoid characters that can cause ImageKit requests to fail.
    // Allow only letters, numbers, dot, underscore and hyphen. Truncate to 120 chars to be safe.
    const originalName = (imageFile.originalname || "upload").toString();
    const safeFileName = originalName
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(0, 120);

    console.log("[ImageKit] sanitized filename:", safeFileName);

    const response = await imagekit.upload({
      file: fileBuffer,
      fileName: safeFileName,
      folder: "/cars",
    });

    console.log("[ImageKit] upload response:", response);

    if (!response?.filePath) {
      throw new Error("ImageKit upload succeeded but filePath is missing");
    }

    // Always generate the final delivery URL from filePath so stored image URLs
    // remain stable and do not depend on inconsistent direct upload response URLs.
    let imageUrl;
    try {
      imageUrl = imagekit.url({
        path: response.filePath,
        transformation: [
          { width: "1280" },
          { quality: "auto" },
          { format: "webp" },
        ],
      });
      console.log(
        "[ImageKit] constructed imagekit.url from filePath:",
        imageUrl,
      );
    } catch (e) {
      console.warn("[ImageKit] imagekit.url failed:", e.message);
    }

    // Fallback: build the URL manually from IMAGEKIT_URL_ENDPOINT + filePath
    if (!imageUrl) {
      const endpoint = process.env.IMAGEKIT_URL_ENDPOINT;
      if (endpoint) {
        const cleanEndpoint = endpoint.replace(/\/$/, "");
        const normalizedFilePath = response.filePath.startsWith("/")
          ? response.filePath
          : `/${response.filePath}`;
        imageUrl = `${cleanEndpoint}${normalizedFilePath}`;
        console.log(
          "[ImageKit] constructed fallback image url from filePath:",
          imageUrl,
        );
      }
    }

    if (!imageUrl) {
      throw new Error(
        "Unable to derive stable image URL from ImageKit filePath",
      );
    }

    const encodedImageUrl = encodeURI(imageUrl);
    console.log(
      "[ImageKit] returning encoded stable image url:",
      encodedImageUrl,
    );
    return encodedImageUrl;
  } catch (err) {
    console.error("[ImageKit] upload error:", err.message);
    throw err;
  }
};

// API to Change Role of User
export const changeRoleToOwner = async (req, res) => {
  try {
    const { _id } = req.user;
    const currentUser = await User.findById(_id);

    if (!currentUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (currentUser.role === "owner") {
      return res.json({
        success: true,
        message: "You already have owner access.",
        user: currentUser,
      });
    }

    currentUser.role = "owner";
    await currentUser.save();

    res.json({
      success: true,
      message: "Your account is now owner again.",
      user: currentUser,
    });
  } catch (error) {
    console.log(error.message);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

export const changeRoleToAdmin = async (req, res) => {
  try {
    const { _id } = req.user;
    const { userId } = req.body;
    const currentUser = await User.findById(_id);

    if (!currentUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (currentUser.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can assign admin access.",
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Target user is required.",
      });
    }

    if (String(userId) === String(_id)) {
      return res.status(400).json({
        success: false,
        message:
          "Use another account. Self-promotion to admin is not allowed here.",
      });
    }

    const targetUser = await User.findById(userId).select("-password");
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "Target user not found",
      });
    }

    if (targetUser.role === "admin") {
      return res.json({
        success: true,
        message: "This user already has admin access.",
        user: targetUser,
      });
    }

    targetUser.role = "admin";
    await targetUser.save();

    res.json({
      success: true,
      message: "User promoted to admin successfully.",
      user: targetUser,
    });
  } catch (error) {
    console.log(error.message);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// API to List Car
export const addCar = async (req, res) => {
  try {
    const { _id } = req.user;
    let car = JSON.parse(req.body.carData);
    const imageFile = req.file;
    const numericLatitude =
      car.latitude === undefined || car.latitude === null || car.latitude === ""
        ? null
        : Number(car.latitude);
    const numericLongitude =
      car.longitude === undefined ||
      car.longitude === null ||
      car.longitude === ""
        ? null
        : Number(car.longitude);

    // Debug: log incoming request info to confirm file and body presence
    try {
      console.log("[AddCar] req.body keys:", Object.keys(req.body || {}));
      console.log(
        "[AddCar] req.file:",
        imageFile
          ? {
              originalname: imageFile.originalname,
              mimetype: imageFile.mimetype,
              size: imageFile.size,
              path: imageFile.path,
            }
          : null,
      );
    } catch (logErr) {
      console.log("[AddCar] logging error:", logErr.message);
    }

    if (!imageFile) {
      return res.json({ success: false, message: "Car image is required" });
    }

    if (!isVehicleText(car.brand) || !isVehicleText(car.model)) {
      return res.json({
        success: false,
        message:
          "Brand and model can contain letters, numbers, spaces, dot and hyphen only.",
      });
    }

    if (!isAlphabeticCity(car.location)) {
      return res.json({
        success: false,
        message: "City must contain alphabetic characters only.",
      });
    }

    if (
      !Number.isFinite(numericLatitude) ||
      numericLatitude < -90 ||
      numericLatitude > 90 ||
      !Number.isFinite(numericLongitude) ||
      numericLongitude < -180 ||
      numericLongitude > 180
    ) {
      return res.json({
        success: false,
        message: "Please enter valid latitude and longitude coordinates.",
      });
    }

    const image = await uploadCarImage(imageFile);
    console.log("[AddCar] uploaded image URL:", image);

    // Create car and return the created document in response for immediate client use
    const createdCar = await Car.create({
      ...car,
      latitude: numericLatitude,
      longitude: numericLongitude,
      owner: _id,
      image,
    });
    console.log("[AddCar] created car id:", createdCar._id);

    res.json({
      success: true,
      message: "Car Added",
      car: createdCar,
    });
  } catch (error) {
    console.log(
      "[AddCar] error:",
      error && error.message ? error.message : error,
    );
    res.json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// API to List Owner Cars
export const getOwnerCars = async (req, res) => {
  try {
    const { _id } = req.user;
    const cars = await Car.find({ owner: _id });
    const confirmedBookings = await Booking.find({
      owner: _id,
      status: "confirmed",
    }).select("car");

    const bookingCountByCar = confirmedBookings.reduce((acc, booking) => {
      const carId = booking.car?.toString();
      if (!carId) return acc;
      acc[carId] = (acc[carId] || 0) + 1;
      return acc;
    }, {});

    const carsWithMaintenance = cars.map((car) => {
      const completedTrips = bookingCountByCar[car._id.toString()] || 0;
      const maintenanceDue = completedTrips >= 5 && completedTrips % 5 === 0;

      return {
        ...car.toObject(),
        completedTrips,
        maintenanceDue,
      };
    });
    res.json({ success: true, cars: carsWithMaintenance });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// API to Toggle Car Availability
export const toggleCarAvailability = async (req, res) => {
  try {
    const { _id } = req.user;
    const { carId } = req.body;
    const car = await Car.findById(carId);

    if (!car) {
      return res.status(404).json({ success: false, message: "Car not found" });
    }

    // Checking if car belongs to the user
    if (car.owner.toString() !== _id.toString()) {
      return res.json({ success: false, message: "Unauthorized" });
    }

    car.isAvailable = !car.isAvailable;

    await car.save();

    res.json({ success: true, message: "Availability Toggled" });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// API to delete a car
export const deleteCar = async (req, res) => {
  try {
    const { _id } = req.user;
    const { carId } = req.body;
    const car = await Car.findById(carId);

    if (!car) {
      return res.status(404).json({ success: false, message: "Car not found" });
    }

    // Checking if car belongs to the user
    if (car.owner.toString() !== _id.toString()) {
      return res.json({ success: false, message: "Unauthorized" });
    }

    car.owner = null;
    car.isAvailable = false;
    await car.save();

    res.json({ success: true, message: "Car Removed" });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// ✅ API to get Dashboard Data (updated with owner image)
export const getDashboardData = async (req, res) => {
  try {
    const { _id, role } = req.user;

    if (!["owner", "admin"].includes(role)) {
      return res.json({ success: false, message: "Unauthorized" });
    }

    const cars = await Car.find({ owner: _id });
    const bookings = await Booking.find({ owner: _id })
      .populate("car")
      .sort({ createdAt: -1 });
    const pendingBookings = await Booking.find({
      owner: _id,
      status: "pending",
    });
    const completedBookings = await Booking.find({
      owner: _id,
      status: "confirmed",
    });

    // Calculate monthly Revenue from bookings where status is confirmed
    const monthlyRevenue = bookings
      .slice()
      .filter((booking) => booking.status === "confirmed")
      .reduce((acc, booking) => acc + booking.price, 0);

    const carPerformance = new Map();
    const cityPerformance = new Map();

    bookings.forEach((booking) => {
      const carId = booking.car?._id?.toString();
      const city = booking.car?.location || "Unknown";

      if (carId) {
        const currentStats = carPerformance.get(carId) || {
          label: `${booking.car?.brand || ""} ${booking.car?.model || ""}`.trim(),
          bookings: 0,
          revenue: 0,
        };

        currentStats.bookings += 1;
        if (booking.status === "confirmed") {
          currentStats.revenue += Number(booking.price || 0);
        }

        carPerformance.set(carId, currentStats);
      }

      cityPerformance.set(city, (cityPerformance.get(city) || 0) + 1);
    });

    const topBookedCar = [...carPerformance.values()].sort(
      (a, b) => b.bookings - a.bookings,
    )[0];
    const topRevenueCar = [...carPerformance.values()].sort(
      (a, b) => b.revenue - a.revenue,
    )[0];
    const topCityEntry = [...cityPerformance.entries()].sort(
      (a, b) => b[1] - a[1],
    )[0];

    // 🔹 Get owner info with image
    const owner = await User.findById(_id).select("name email image");

    const dashboardData = {
      totalCars: cars.length,
      totalBookings: bookings.length,
      pendingBookings: pendingBookings.length,
      completedBookings: completedBookings.length,
      recentBookings: bookings.slice(0, 3),
      monthlyRevenue: monthlyRevenue,
      smartInsights: {
        topBookedCar: topBookedCar || null,
        topRevenueCar: topRevenueCar || null,
        topCity: topCityEntry
          ? { city: topCityEntry[0], bookings: topCityEntry[1] }
          : null,
      },
    };

    res.json({ success: true, dashboardData, owner }); // 👈 now includes owner image
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// API to update user profile (name, email, password)
export const updateProfile = async (req, res) => {
  try {
    const { _id } = req.user;
    const { name, email, currentPassword, newPassword } = req.body;

    const user = await User.findById(_id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const normalizedName = name ? String(name).trim() : "";
    const normalizedEmail = email ? String(email).trim().toLowerCase() : "";

    if (normalizedName && !isAlphabeticName(normalizedName)) {
      return res.json({
        success: false,
        message: "Invalid name.",
      });
    }

    if (normalizedEmail && !isGmailAddress(normalizedEmail)) {
      return res.json({
        success: false,
        message: "Email must be a valid @gmail.com address.",
      });
    }

    // Check if email is taken by another user
    if (normalizedEmail && normalizedEmail !== user.email) {
      const existing = await User.findOne({ email: normalizedEmail });
      if (existing) {
        return res.json({
          success: false,
          message: "Email already in use by another account.",
        });
      }
    }

    // If changing password, verify current password first
    if (newPassword) {
      if (!isAlphanumericPassword(newPassword)) {
        return res.json({
          success: false,
          message:
            "New password must be at least 6 characters and contain letters or numbers only.",
        });
      }

      if (!currentPassword) {
        return res.json({
          success: false,
          message: "Please provide your current password.",
        });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.json({
          success: false,
          message: "Current password is incorrect.",
        });
      }
      user.password = await bcrypt.hash(newPassword, 10);
    }

    if (normalizedName) user.name = normalizedName;
    if (normalizedEmail) user.email = normalizedEmail;

    await user.save();

    // Return updated user without password
    const updatedUser = await User.findById(_id).select("-password");

    res.json({
      success: true,
      message: "Profile updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// API to get chart data (last 6 months bookings + revenue)
export const getChartData = async (req, res) => {
  try {
    const { _id } = req.user;

    const now = new Date();
    const months = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        year: d.getFullYear(),
        month: d.getMonth(),
        label: d.toLocaleString("default", { month: "short", year: "2-digit" }),
      });
    }

    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const bookings = await Booking.find({
      owner: _id,
      createdAt: { $gte: sixMonthsAgo },
    });

    const chartData = months.map(({ year, month, label }) => {
      const monthBookings = bookings.filter((b) => {
        const d = new Date(b.createdAt);
        return d.getFullYear() === year && d.getMonth() === month;
      });

      const revenue = monthBookings
        .filter((b) => b.status === "confirmed")
        .reduce((sum, b) => sum + b.price, 0);

      return {
        month: label,
        bookings: monthBookings.length,
        revenue,
      };
    });

    res.json({ success: true, chartData });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// API to get all registered users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const getSupportTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find()
      .populate("user", "name email")
      .populate("booking", "pickupDate returnDate status")
      .sort({ lastMessageAt: -1, createdAt: -1 });

    res.json({ success: true, tickets });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateLiveCarLocation = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const numericLatitude = Number(req.body?.latitude);
    const numericLongitude = Number(req.body?.longitude);

    if (
      !Number.isFinite(numericLatitude) ||
      numericLatitude < -90 ||
      numericLatitude > 90 ||
      !Number.isFinite(numericLongitude) ||
      numericLongitude < -180 ||
      numericLongitude > 180
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter valid latitude and longitude coordinates.",
      });
    }

    const booking = await Booking.findById(bookingId).populate("car");
    if (!booking || !booking.car) {
      return res.status(404).json({
        success: false,
        message: "Booking or car not found.",
      });
    }

    const isAuthorized =
      req.user.role === "admin" ||
      booking.owner?.toString() === req.user._id.toString();

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to update this booking location.",
      });
    }

    if (booking.status !== "confirmed") {
      return res.status(400).json({
        success: false,
        message: "Live location can only be updated for confirmed bookings.",
      });
    }

    const now = new Date();
    const pickupDate = new Date(booking.pickupDate);
    const returnDate = new Date(booking.returnDate);

    if (now < pickupDate || now > returnDate) {
      return res.status(400).json({
        success: false,
        message:
          "Live location updates are only allowed during the active rental period.",
      });
    }

    booking.car.currentLatitude = numericLatitude;
    booking.car.currentLongitude = numericLongitude;
    booking.car.liveLocationUpdatedAt = now;
    await booking.car.save();

    return res.json({
      success: true,
      message: "Live car location updated.",
      car: booking.car,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getLiveTrackingBookings = async (req, res) => {
  try {
    const bookingQuery =
      req.user.role === "admin"
        ? { status: "confirmed" }
        : { owner: req.user._id, status: "confirmed" };

    const bookings = await Booking.find(bookingQuery)
      .populate({
        path: "car",
        select:
          "brand model image location latitude longitude currentLatitude currentLongitude liveLocationUpdatedAt trackingSimulationActive trackingSimulationStep trackingSimulationUpdatedAt",
      })
      .populate({
        path: "user",
        select: "name email",
      })
      .sort({ pickupDate: -1 });

    const now = new Date();
    const activeBookings = [];

    for (const booking of bookings) {
      if (!booking.car) continue;

      const pickupDate = new Date(booking.pickupDate);
      const returnDate = new Date(booking.returnDate);
      const isActiveRental = now >= pickupDate && now <= returnDate;

      if (!isActiveRental) {
        if (booking.car.trackingSimulationActive) {
          booking.car.trackingSimulationActive = false;
          booking.car.trackingSimulationUpdatedAt = new Date();
          await booking.car.save();
        }
        continue;
      }

      await simulateTrackedCarPosition(booking.car);
      activeBookings.push(booking);
    }

    return res.json({ success: true, bookings: activeBookings });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const startDemoTracking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId).populate("car");

    if (!booking || !booking.car) {
      return res.status(404).json({
        success: false,
        message: "Booking or car not found.",
      });
    }

    const isAuthorized =
      req.user.role === "admin" ||
      booking.owner?.toString() === req.user._id.toString();

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to start tracking for this booking.",
      });
    }

    if (booking.status !== "confirmed") {
      return res.status(400).json({
        success: false,
        message: "Tracking can only start for confirmed bookings.",
      });
    }

    const now = new Date();
    if (now < new Date(booking.pickupDate) || now > new Date(booking.returnDate)) {
      return res.status(400).json({
        success: false,
        message:
          "Tracking can only start during the active rental period.",
      });
    }

    const route = getTrackingRoute(booking.car.location);
    const firstPoint = route[0];

    booking.car.trackingSimulationActive = true;
    booking.car.trackingSimulationStep = 0;
    booking.car.currentLatitude = firstPoint.lat;
    booking.car.currentLongitude = firstPoint.lng;
    booking.car.liveLocationUpdatedAt = now;
    booking.car.trackingSimulationUpdatedAt = now;
    await booking.car.save();

    return res.json({
      success: true,
      message: "Live tracking started.",
      car: booking.car,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const stopDemoTracking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId).populate("car");

    if (!booking || !booking.car) {
      return res.status(404).json({
        success: false,
        message: "Booking or car not found.",
      });
    }

    const isAuthorized =
      req.user.role === "admin" ||
      booking.owner?.toString() === req.user._id.toString();

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to stop tracking for this booking.",
      });
    }

    booking.car.trackingSimulationActive = false;
    booking.car.trackingSimulationUpdatedAt = new Date();
    await booking.car.save();

    return res.json({
      success: true,
      message: "Live tracking stopped.",
      car: booking.car,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSupportTicketStatus = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status } = req.body;

    if (!["open", "in_progress", "resolved"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid ticket status." });
    }

    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      return res
        .status(404)
        .json({ success: false, message: "Support ticket not found." });
    }

    ticket.status = status;
    await ticket.save();

    res.json({ success: true, message: "Ticket status updated.", ticket });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const replyToSupportTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const message = String(req.body?.message || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 1000);

    if (!message || !isSafeText(message, 2, 1000)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Reply message must be between 2 and 1000 characters.",
        });
    }

    const ticket = await SupportTicket.findById(ticketId)
      .populate("user", "name email")
      .populate("booking", "pickupDate returnDate status");

    if (!ticket) {
      return res
        .status(404)
        .json({ success: false, message: "Support ticket not found." });
    }

    ticket.messages.push({
      senderRole: req.user.role === "admin" ? "admin" : "owner",
      senderName: req.user.name || "Support Team",
      text: message,
    });
    ticket.lastMessageAt = new Date();
    if (ticket.status === "open") {
      ticket.status = "in_progress";
    }
    await ticket.save();

    res.json({
      success: true,
      message: "Reply sent to customer.",
      ticket,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// API to update user image
export const updateUserImage = async (req, res) => {
  try {
    const { _id } = req.user;

    const imageFile = req.file;
    if (!imageFile) {
      return res
        .status(400)
        .json({ success: false, message: "Profile image is required" });
    }

    // Upload Image to ImageKit
    const fileBuffer = fs.readFileSync(imageFile.path);
    const response = await imagekit.upload({
      file: fileBuffer,
      fileName: imageFile.originalname,
      folder: "/users",
    });
    // optimization through ImageKit URL transformation
    var optimizedImageUrl = imagekit.url({
      path: response.filePath,
      transformation: [
        { width: "400" }, // Width resizing
        { quality: "auto" }, // Auto compression
        { format: "webp" }, // Convert to modern format
      ],
    });

    const image = optimizedImageUrl;

    await User.findByIdAndUpdate(_id, { image });

    res.json({ success: true, message: "Image Updated" });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};
