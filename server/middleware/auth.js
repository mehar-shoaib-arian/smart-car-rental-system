import jwt from "jsonwebtoken";
import User from "../models/User.js";

const isBackofficeRole = (role) => role === "owner" || role === "admin";

export const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    return res
      .status(401)
      .json({ success: false, message: "Token invalid or expired" });
  }
};

export const requireOwner = (req, res, next) => {
  if (!req.user || !isBackofficeRole(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Only owner or admin can access this route",
    });
  }
  next();
};

export const requireUser = (req, res, next) => {
  if (!req.user || req.user.role !== "user") {
    return res.status(403).json({
      success: false,
      message: "Only users can access this route",
    });
  }
  next();
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Only admin can access this route",
    });
  }
  next();
};
