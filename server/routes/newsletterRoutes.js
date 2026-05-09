import express from "express";
import NewsletterSubscriber from "../models/NewsletterSubscriber.js";

const newsletterRouter = express.Router();

newsletterRouter.post("/subscribe", async (req, res) => {
  try {
    const email = req.body?.email?.trim()?.toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    const existing = await NewsletterSubscriber.findOne({ email });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "You are already subscribed.",
      });
    }

    await NewsletterSubscriber.create({ email });

    return res.json({
      success: true,
      message: "Subscribed successfully. You will not miss any deal.",
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

export default newsletterRouter;
