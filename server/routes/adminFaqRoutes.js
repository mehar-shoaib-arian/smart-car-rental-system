import express from "express";
import Faq from "../models/Faq.js";
import { protect, requireOwner } from "../middleware/auth.js";

const router = express.Router();

// Add FAQ
router.post("/", protect, requireOwner, async (req, res) => {
  try {
    const { question, answer, keywords } = req.body;
    const faq = await Faq.create({ question, answer, keywords });
    res.status(201).json({ success: true, faq });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all FAQs
router.get("/", protect, requireOwner, async (req, res) => {
  try {
    const faqs = await Faq.find().sort({ createdAt: -1 });
    res.json({ success: true, faqs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update FAQ
router.put("/:id", protect, requireOwner, async (req, res) => {
  try {
    const faq = await Faq.findById(req.params.id);
    if (!faq)
      return res.status(404).json({ success: false, message: "FAQ not found" });

    faq.question = req.body.question || faq.question;
    faq.answer = req.body.answer || faq.answer;
    faq.keywords = req.body.keywords || faq.keywords;

    await faq.save();
    res.json({ success: true, faq });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete FAQ
router.delete("/:id", protect, requireOwner, async (req, res) => {
  try {
    await Faq.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "FAQ deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
