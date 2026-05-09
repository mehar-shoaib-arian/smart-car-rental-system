import express from "express";
import { protect, requireAdmin, requireOwner } from "../middleware/auth.js";
import {
  addCar,
  changeRoleToAdmin,
  changeRoleToOwner,
  deleteCar,
  getDashboardData,
  getOwnerCars,
  toggleCarAvailability,
  updateUserImage,
  updateProfile,
  getChartData,
  getAllUsers,
  getSupportTickets,
  getLiveTrackingBookings,
  replyToSupportTicket,
  startDemoTracking,
  stopDemoTracking,
  updateLiveCarLocation,
  updateSupportTicketStatus,
} from "../controllers/ownerController.js";
import {
  getListingRequests,
  reviewListingRequest,
} from "../controllers/listingRequestController.js";
import upload from "../middleware/multer.js";

const ownerRouter = express.Router();

ownerRouter.post("/change-role", protect, changeRoleToOwner);
ownerRouter.post(
  "/change-role-admin",
  protect,
  requireAdmin,
  changeRoleToAdmin,
);
ownerRouter.post(
  "/add-car",
  protect,
  requireOwner,
  upload.single("image"),
  addCar,
);
ownerRouter.get("/cars", protect, requireOwner, getOwnerCars);
ownerRouter.post("/toggle-car", protect, requireOwner, toggleCarAvailability);
ownerRouter.post("/delete-car", protect, requireOwner, deleteCar);
ownerRouter.get("/dashboard", protect, requireOwner, getDashboardData);
ownerRouter.post(
  "/update-image",
  protect,
  requireOwner,
  upload.single("image"),
  updateUserImage,
);
ownerRouter.get("/listing-requests", protect, requireOwner, getListingRequests);
ownerRouter.put(
  "/listing-requests/:requestId",
  protect,
  requireOwner,
  reviewListingRequest,
);
ownerRouter.put("/update-profile", protect, requireOwner, updateProfile);
ownerRouter.get("/chart-data", protect, requireOwner, getChartData);
ownerRouter.get("/all-users", protect, requireAdmin, getAllUsers);
ownerRouter.get("/support-tickets", protect, requireOwner, getSupportTickets);
ownerRouter.patch(
  "/support-tickets/:ticketId",
  protect,
  requireOwner,
  updateSupportTicketStatus,
);
ownerRouter.patch(
  "/bookings/:bookingId/live-location",
  protect,
  requireOwner,
  updateLiveCarLocation,
);
ownerRouter.get("/live-tracking", protect, requireOwner, getLiveTrackingBookings);
ownerRouter.post(
  "/live-tracking/:bookingId/start",
  protect,
  requireOwner,
  startDemoTracking,
);
ownerRouter.post(
  "/live-tracking/:bookingId/stop",
  protect,
  requireOwner,
  stopDemoTracking,
);
ownerRouter.post(
  "/support-tickets/:ticketId/reply",
  protect,
  requireOwner,
  replyToSupportTicket,
);
export default ownerRouter;
