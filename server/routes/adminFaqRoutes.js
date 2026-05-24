import express from "express";
import Faq from "../models/Faq.js";
import { protect, requireOwner } from "../middleware/auth.js";
import { isKeywordList, isSafeText } from "../utils/validators.js";

const router = express.Router();

const normalizeFaqPayload = (body = {}) => {
  const question = String(body.question || "").replace(/\s+/g, " ").trim();
  const answer = String(body.answer || "").replace(/\s+/g, " ").trim();
  const keywords = (Array.isArray(body.keywords)
    ? body.keywords
    : String(body.keywords || "").split(",")
  )
    .map((keyword) => String(keyword).trim().toLowerCase())
    .filter(Boolean);

  return { question, answer, keywords };
};

const validateFaqPayload = ({ question, answer, keywords }) => {
  if (!question || !answer || keywords.length === 0) {
    return "Question, answer and keywords are required.";
  }
  if (!isSafeText(question, 8, 180)) {
    return "Question must be between 8 and 180 characters.";
  }
  if (!isSafeText(answer, 10, 800)) {
    return "Answer must be between 10 and 800 characters.";
  }
  if (!isKeywordList(keywords)) {
    return "Keywords must start with a letter and can contain letters, numbers, spaces or hyphen.";
  }
  return "";
};

// Add FAQ
router.post("/", protect, requireOwner, async (req, res) => {
  try {
    const { question, answer, keywords } = normalizeFaqPayload(req.body);
    const validationError = validateFaqPayload({ question, answer, keywords });
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

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

    const nextPayload = normalizeFaqPayload({
      question: req.body.question || faq.question,
      answer: req.body.answer || faq.answer,
      keywords: req.body.keywords || faq.keywords,
    });
    const validationError = validateFaqPayload(nextPayload);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    faq.question = nextPayload.question;
    faq.answer = nextPayload.answer;
    faq.keywords = nextPayload.keywords;

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
