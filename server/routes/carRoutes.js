import express from "express";
import {
  getAllCars,
  getCarAvailability,
  getCarById,
} from "../controllers/carController.js";

const router = express.Router();

router.get("/", getAllCars);        // GET /api/cars
router.get("/:id/availability", getCarAvailability);
router.get("/:id", getCarById);     // GET /api/cars/:id

export default router;
