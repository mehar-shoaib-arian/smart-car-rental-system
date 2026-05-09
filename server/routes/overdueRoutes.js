import express from "express";
import {
  checkOverdueBookings,
  getOverdueBookings,
} from "../controllers/overdueController.js";
import { protect, requireOwner } from "../middleware/auth.js";

const overdueRouter = express.Router();

// Manual trigger to check overdue bookings (owner can trigger)
overdueRouter.post("/check", protect, requireOwner, checkOverdueBookings);

// Get list of overdue bookings for the logged-in owner
overdueRouter.get("/", protect, requireOwner, getOverdueBookings);

export default overdueRouter;
