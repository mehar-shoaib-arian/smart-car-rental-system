import Car from "../models/Car.js";
import ListingRequest from "../models/ListingRequest.js";
import User from "../models/User.js";
import imagekit from "../configs/imageKit.js";
import fs from "fs";
import { sendListingRequestStatusEmail } from "../configs/emailService.js";

export const createListingRequest = async (req, res) => {
  try {
    const submittedBy = req.user?._id;
    const listingData = req.body?.listingData
      ? JSON.parse(req.body.listingData)
      : req.body;

    const {
      phone,
      brand,
      model,
      year,
      category,
      transmission,
      fuel_type,
      seating_capacity,
      pricePerDay,
      location,
      latitude,
      longitude,
      description,
      cnic,
    } = listingData;
    const fullName = req.user?.name || listingData.fullName;
    const email = req.user?.email || listingData.email;
    const imageFile = req.file;

    if (
      !submittedBy ||
      !fullName ||
      !email ||
      !phone ||
      !brand ||
      !model ||
      !year ||
      !category ||
      !transmission ||
      !fuel_type ||
      !seating_capacity ||
      !pricePerDay ||
      !location ||
      !description ||
      !cnic ||
      !imageFile
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields (including CNIC).",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(email).trim().toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    // CNIC validation:
    // Accept either 13 digits (e.g. 3460123456789) or formatted (12345-1234567-1)
    const cnicStr = String(cnic || "").trim();
    const cnicRegexFormatted = /^\d{5}-\d{7}-\d{1}$/;
    const cnicRegexPlain = /^\d{13}$/;
    if (
      !cnicStr ||
      !(cnicRegexFormatted.test(cnicStr) || cnicRegexPlain.test(cnicStr))
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid CNIC (13 digits, optionally formatted as 12345-1234567-1).",
      });
    }
    // normalize CNIC to digits-only for storage
    const normalizedCnic = cnicStr.replace(/-/g, "");
    const numericLatitude =
      latitude === undefined || latitude === null || latitude === ""
        ? null
        : Number(latitude);
    const numericLongitude =
      longitude === undefined || longitude === null || longitude === ""
        ? null
        : Number(longitude);

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

    const fileBuffer = fs.readFileSync(imageFile.path);
    const response = await imagekit.upload({
      file: fileBuffer,
      fileName: imageFile.originalname,
      folder: "/listing-requests",
    });

    const image = imagekit.url({
      path: response.filePath,
      transformation: [
        { width: "1280" },
        { quality: "auto" },
        { format: "webp" },
      ],
    });

    await ListingRequest.create({
      submittedBy,
      fullName,
      email,
      phone,
      brand,
      model,
      year: Number(year),
      category,
      transmission,
      fuel_type,
      seating_capacity: Number(seating_capacity),
      pricePerDay: Number(pricePerDay),
      location,
      latitude: numericLatitude,
      longitude: numericLongitude,
      description,
      cnic: normalizedCnic,
      image,
    });

    return res.json({
      success: true,
      message: "Request submitted. Admin will review and approve/reject.",
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getListingRequests = async (_req, res) => {
  try {
    const requests = await ListingRequest.find().sort({ createdAt: -1 });
    return res.json({ success: true, requests });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const reviewListingRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status.",
      });
    }

    const request = await ListingRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found.",
      });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Request already reviewed.",
      });
    }

    request.status = status;
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    // ── Send email notification to the requester (non-blocking) ──
    try {
      sendListingRequestStatusEmail({
        email: request.email,
        fullName: request.fullName,
        status,
        carBrand: request.brand,
        carModel: request.model,
        year: request.year,
        category: request.category,
        pricePerDay: request.pricePerDay,
      });
    } catch (emailErr) {
      console.log("[Email] Listing request email error:", emailErr.message);
    }

    if (status === "approved") {
      const fallbackOwner = request.submittedBy
        ? null
        : await User.findOne({ email: request.email }).select("_id");

      const ownerId = request.submittedBy || fallbackOwner?._id;
      if (!ownerId) {
        return res.status(400).json({
          success: false,
          message:
            "Could not determine the listing owner. Please review the requester account.",
        });
      }

      await Car.create({
        owner: ownerId,
        brand: request.brand,
        model: request.model,
        image: request.image,
        year: request.year,
        category: request.category,
        seating_capacity: request.seating_capacity,
        fuel_type: request.fuel_type,
        transmission: request.transmission,
        pricePerDay: request.pricePerDay,
        location: request.location,
        latitude: request.latitude,
        longitude: request.longitude,
        description: request.description,
        isAvailable: true,
      });
    }

    return res.json({
      success: true,
      message: `Request ${status}.`,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
