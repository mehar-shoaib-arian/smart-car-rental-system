import express from "express";
import { getAllCars, getCarById } from "../controllers/carController.js";

const router = express.Router();

router.get("/", getAllCars);        // GET /api/cars
router.get("/:id", getCarById);     // GET /api/cars/:id

export default router;