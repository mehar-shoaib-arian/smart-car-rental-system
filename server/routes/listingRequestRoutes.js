import express from "express";
import { createListingRequest } from "../controllers/listingRequestController.js";
import { protect, requireUser } from "../middleware/auth.js";
import upload from "../middleware/multer.js";

const listingRequestRouter = express.Router();

listingRequestRouter.post(
  "/",
  protect,
  requireUser,
  upload.single("image"),
  createListingRequest,
);

export default listingRequestRouter;
