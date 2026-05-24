import express from "express";
import Faq from "../models/Faq.js";
import Car from "../models/Car.js";
import Booking from "../models/Booking.js";
import SupportTicket from "../models/SupportTicket.js";
import { protect, requireUser } from "../middleware/auth.js";
import { sendSupportTicketEmail } from "../configs/emailService.js";
import { isSafeText } from "../utils/validators.js";

const router = express.Router();

// ─── Normalize text ───────────────────────────────────────────────────────────
const normalize = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// ─── Check if message contains any of the given keywords ─────────────────────
const contains = (text, keywords) => keywords.some((kw) => text.includes(kw));

// ─── Format car list ──────────────────────────────────────────────────────────
const formatCarList = (cars, limit = 8) =>
  cars
    .slice(0, limit)
    .map(
      (c, i) =>
        `${i + 1}. ${c.brand} ${c.model} (${c.category}) — Rs ${c.pricePerDay.toLocaleString()}/day | ${c.location}`,
    )
    .join("\n");

const MAX_SUPPORT_MESSAGE_LENGTH = 1000;

const normalizeSupportText = (value, maxLength = MAX_SUPPORT_MESSAGE_LENGTH) =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);

router.get("/my-tickets", protect, requireUser, async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ user: req.user._id })
      .populate("booking", "pickupDate returnDate status")
      .sort({ lastMessageAt: -1, createdAt: -1 });

    return res.json({ success: true, tickets });
  } catch (error) {
    console.error("[Chatbot] Get my tickets error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to load support tickets.",
    });
  }
});

router.post("/tickets/:ticketId/messages", protect, requireUser, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const message = normalizeSupportText(req.body?.message);

    if (!message) {
      return res
        .status(400)
        .json({ success: false, message: "Message is required." });
    }

    if (!isSafeText(message, 2, MAX_SUPPORT_MESSAGE_LENGTH)) {
      return res.status(400).json({
        success: false,
        message: "Message must be between 2 and 1000 characters.",
      });
    }

    const ticket = await SupportTicket.findOne({
      _id: ticketId,
      user: req.user._id,
    }).populate("booking", "pickupDate returnDate status");

    if (!ticket) {
      return res
        .status(404)
        .json({ success: false, message: "Support ticket not found." });
    }

    ticket.messages.push({
      senderRole: "user",
      senderName: req.user.name || "Customer",
      text: message,
    });
    ticket.lastMessageAt = new Date();
    if (ticket.status === "resolved") {
      ticket.status = "in_progress";
    }
    await ticket.save();

    return res.json({
      success: true,
      message: "Reply sent to admin team.",
      ticket,
    });
  } catch (error) {
    console.error("[Chatbot] Ticket reply error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to send message.",
    });
  }
});

router.post("/report-issue", protect, requireUser, async (req, res) => {
  try {
    const { category = "other", subject, message, bookingId } = req.body;

    const cleanSubject = normalizeSupportText(subject, 120);
    const cleanMessage = normalizeSupportText(message);

    if (!cleanSubject || !cleanMessage) {
      return res.status(400).json({
        success: false,
        message: "Subject and message are required.",
      });
    }

    if (!isSafeText(cleanSubject, 3, 120)) {
      return res.status(400).json({
        success: false,
        message: "Subject must be between 3 and 120 characters.",
      });
    }

    if (!isSafeText(cleanMessage, 5, MAX_SUPPORT_MESSAGE_LENGTH)) {
      return res.status(400).json({
        success: false,
        message: "Message must be between 5 and 1000 characters.",
      });
    }

    let booking = null;
    if (bookingId) {
      booking = await Booking.findOne({
        _id: bookingId,
        user: req.user._id,
      }).select("_id");

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Related booking not found.",
        });
      }
    }

    const ticket = await SupportTicket.create({
      user: req.user._id,
      booking: booking?._id || null,
      category,
      subject: cleanSubject,
      message: cleanMessage,
      messages: [
        {
          senderRole: "user",
          senderName: req.user.name || "Customer",
          text: cleanMessage,
        },
      ],
      lastMessageAt: new Date(),
    });

    const adminEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_USER || "";
    if (adminEmail) {
      sendSupportTicketEmail({
        adminEmail,
        customerName: req.user.name,
        customerEmail: req.user.email,
        category,
        subject: cleanSubject,
        message: cleanMessage,
        ticketId: String(ticket._id).slice(-8).toUpperCase(),
      });
    }

    return res.json({
      success: true,
      message:
        "Your issue has been sent to the admin team. They will contact you as soon as possible.",
      ticketId: String(ticket._id).slice(-8).toUpperCase(),
    });
  } catch (error) {
    console.error("[Chatbot] Support issue error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to send your issue. Please try again.",
    });
  }
});

// ─── Main chatbot route ───────────────────────────────────────────────────────
router.post("/ask", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.json({
        reply: "Hi! 👋 Please type a question and I'll do my best to help you.",
      });
    }

    const raw = message.trim();
    const msg = normalize(raw);

    // ── 1. GREETING ───────────────────────────────────────────────────────────
    if (
      contains(msg, [
        "hi",
        "hello",
        "hey",
        "salam",
        "assalam",
        "good morning",
        "good afternoon",
        "good evening",
        "howdy",
        "greetings",
      ]) &&
      msg.length < 30
    ) {
      return res.json({
        reply:
          "Hello! 👋 Welcome to SmartRent — your smart car rental assistant.\n\n" +
          "I can help you with:\n" +
          "🚗 Browse available cars\n" +
          "📍 Cars by city (Lahore, Karachi, Multan, Islamabad)\n" +
          "💰 Cheapest cars available\n" +
          "🏷️ Cars by category (Sedan, SUV, Hatchback)\n" +
          "⚙️ Cars by transmission (Automatic, Manual)\n" +
          "📄 Documents required for rental\n" +
          "📅 How to make a booking\n" +
          "❌ Cancellation policy\n\n" +
          "Just type your question!",
      });
    }

    // ── 2. HELP / MENU ────────────────────────────────────────────────────────
    if (
      contains(msg, [
        "help",
        "menu",
        "what can you do",
        "options",
        "commands",
        "assist",
      ])
    ) {
      return res.json({
        reply:
          "🤖 Here's what I can help you with:\n\n" +
          "• Type a city name to see cars there (e.g. 'cars in Lahore')\n" +
          "• 'cheapest cars' — see lowest priced options\n" +
          "• 'SUV' / 'Sedan' / 'Hatchback' — filter by category\n" +
          "• 'automatic' / 'manual' — filter by transmission\n" +
          "• 'documents' — what you need to bring\n" +
          "• 'how to book' — step-by-step booking guide\n" +
          "• 'price' / 'rates' — pricing information\n" +
          "• 'cancellation' — our cancellation policy\n" +
          "• 'rental issue' — report a problem to admin\n" +
          "• 'locations' — cities we serve\n" +
          "• 'contact' — get our contact details\n\n" +
          "What would you like to know? 😊",
      });
    }

    // ── 3. LOCATIONS LIST ────────────────────────────────────────────────────
    if (
      contains(msg, [
        "locations",
        "cities",
        "which city",
        "what cities",
        "where available",
        "available cities",
        "service area",
        "which areas",
        "coverage",
        "city list",
      ])
    ) {
      const locations = await Car.distinct("location", { isAvailable: true });
      if (locations.length === 0) {
        return res.json({
          reply:
            "We currently don't have cars available in any city. Please check back later.",
        });
      }
      const locationCounts = await Promise.all(
        locations.map(async (loc) => {
          const count = await Car.countDocuments({
            isAvailable: true,
            location: loc,
          });
          return `📍 ${loc} — ${count} car${count !== 1 ? "s" : ""} available`;
        }),
      );
      return res.json({
        reply:
          `🌍 We currently serve ${locations.length} cities:\n\n` +
          locationCounts.join("\n") +
          "\n\nType a city name to see available cars there!",
      });
    }

    // ── 4. CHEAPEST CARS ──────────────────────────────────────────────────────
    if (
      contains(msg, [
        "cheap",
        "cheapest",
        "lowest price",
        "budget",
        "affordable",
        "most affordable",
        "low cost",
        "economy",
        "inexpensive",
        "best price",
        "low price",
        "minimum price",
      ])
    ) {
      const cars = await Car.find({ isAvailable: true }).sort({
        pricePerDay: 1,
      });
      if (cars.length === 0) {
        return res.json({ reply: "No cars are available right now." });
      }
      const top = cars.slice(0, 6);
      return res.json({
        reply:
          `💰 Here are our most affordable cars:\n\n${formatCarList(top)}\n\n` +
          "Prices are per day. Visit our Cars page to book any of these!",
      });
    }

    // ── 5. MOST EXPENSIVE / PREMIUM ──────────────────────────────────────────
    if (
      contains(msg, [
        "expensive",
        "luxury",
        "premium",
        "most expensive",
        "highest price",
        "best car",
        "top car",
      ])
    ) {
      const cars = await Car.find({ isAvailable: true }).sort({
        pricePerDay: -1,
      });
      if (cars.length === 0) {
        return res.json({ reply: "No cars are available right now." });
      }
      return res.json({
        reply:
          `🌟 Here are our premium cars:\n\n${formatCarList(cars.slice(0, 6))}\n\n` +
          "These are our top-tier vehicles for a luxury experience!",
      });
    }

    // ── 6. CATEGORY — SUV ────────────────────────────────────────────────────
    if (
      contains(msg, ["suv", "sports utility", "4x4", "offroad", "off road"])
    ) {
      const cars = await Car.find({ isAvailable: true, category: "SUV" }).sort({
        pricePerDay: 1,
      });
      if (cars.length === 0) {
        return res.json({
          reply:
            "Sorry, no SUVs are available right now. Try checking back later!",
        });
      }
      return res.json({
        reply:
          `🚙 Available SUVs (${cars.length}):\n\n${formatCarList(cars)}\n\n` +
          "Perfect for road trips and family travel!",
      });
    }

    // ── 7. CATEGORY — SEDAN ──────────────────────────────────────────────────
    if (contains(msg, ["sedan", "saloon"])) {
      const cars = await Car.find({
        isAvailable: true,
        category: "Sedan",
      }).sort({ pricePerDay: 1 });
      if (cars.length === 0) {
        return res.json({ reply: "Sorry, no Sedans are available right now." });
      }
      return res.json({
        reply:
          `🚘 Available Sedans (${cars.length}):\n\n${formatCarList(cars)}\n\n` +
          "Sedans are ideal for city commutes and business travel!",
      });
    }

    // ── 8. CATEGORY — HATCHBACK ──────────────────────────────────────────────
    if (contains(msg, ["hatchback", "hatch", "compact car", "small car"])) {
      const cars = await Car.find({
        isAvailable: true,
        category: "Hatchback",
      }).sort({ pricePerDay: 1 });
      if (cars.length === 0) {
        return res.json({
          reply: "Sorry, no Hatchbacks are available right now.",
        });
      }
      return res.json({
        reply:
          `🚗 Available Hatchbacks (${cars.length}):\n\n${formatCarList(cars)}\n\n` +
          "Hatchbacks are great for city driving and tight parking!",
      });
    }

    // ── 9. TRANSMISSION — AUTOMATIC ──────────────────────────────────────────
    if (
      contains(msg, ["automatic", "auto", "auto transmission", "auto gear"])
    ) {
      const cars = await Car.find({
        isAvailable: true,
        transmission: "Automatic",
      }).sort({ pricePerDay: 1 });
      if (cars.length === 0) {
        return res.json({
          reply: "Sorry, no automatic cars are available right now.",
        });
      }
      return res.json({
        reply:
          `⚙️ Available Automatic cars (${cars.length}):\n\n${formatCarList(cars)}\n\n` +
          "Automatic cars are easier to drive, especially in city traffic!",
      });
    }

    // ── 10. TRANSMISSION — MANUAL ────────────────────────────────────────────
    if (
      contains(msg, [
        "manual",
        "manual transmission",
        "manual gear",
        "stick shift",
        "gear shift",
      ])
    ) {
      const cars = await Car.find({
        isAvailable: true,
        transmission: "Manual",
      }).sort({ pricePerDay: 1 });
      if (cars.length === 0) {
        return res.json({
          reply: "Sorry, no manual cars are available right now.",
        });
      }
      return res.json({
        reply:
          `⚙️ Available Manual cars (${cars.length}):\n\n${formatCarList(cars)}\n\n` +
          "Manual cars are generally more fuel-efficient!",
      });
    }

    // ── 11. FUEL TYPE — ELECTRIC ─────────────────────────────────────────────
    if (contains(msg, ["electric", "ev", "electric car", "electric vehicle"])) {
      const cars = await Car.find({
        isAvailable: true,
        fuel_type: "Electric",
      }).sort({ pricePerDay: 1 });
      if (cars.length === 0) {
        return res.json({
          reply:
            "Sorry, no electric cars are available right now. Check back later!",
        });
      }
      return res.json({
        reply:
          `⚡ Available Electric cars (${cars.length}):\n\n${formatCarList(cars)}\n\n` +
          "Go green with our electric vehicle options!",
      });
    }

    // ── 12. FUEL TYPE — HYBRID ───────────────────────────────────────────────
    if (contains(msg, ["hybrid", "hybrid car", "semi electric"])) {
      const cars = await Car.find({
        isAvailable: true,
        fuel_type: "Hybrid",
      }).sort({ pricePerDay: 1 });
      if (cars.length === 0) {
        return res.json({
          reply: "Sorry, no hybrid cars are available right now.",
        });
      }
      return res.json({
        reply:
          `🌿 Available Hybrid cars (${cars.length}):\n\n${formatCarList(cars)}\n\n` +
          "Hybrid cars offer the best of both fuel efficiency and performance!",
      });
    }

    // ── 13. DOCUMENTS REQUIRED ───────────────────────────────────────────────
    if (
      contains(msg, [
        "document",
        "documents",
        "required",
        "cnic",
        "license",
        "driving license",
        "id card",
        "id",
        "what do i need",
        "what to bring",
        "requirements",
        "paperwork",
        "papers",
        "what is needed",
        "necessary documents",
        "identification",
      ])
    ) {
      return res.json({
        reply:
          "📄 Documents Required for Car Rental at SmartRent:\n\n" +
          "1. 🪪 Valid CNIC (National Identity Card) — original copy\n" +
          "2. 🚗 Valid Driving License — must be current and not expired\n" +
          "3. 📱 Active phone number for contact\n" +
          "4. 💵 Payment amount (collected offline at pickup)\n\n" +
          "📌 Important Notes:\n" +
          "• You must be at least 21 years old to rent a vehicle\n" +
          "• Both CNIC and driving license must match the same person\n" +
          "• Foreign nationals must present a valid passport + international driving permit\n" +
          "• Documents will be verified at the time of pickup\n\n" +
          "Need help with anything else? 😊",
      });
    }

    // ── 14. HOW TO BOOK ──────────────────────────────────────────────────────
    if (
      contains(msg, [
        "how to book",
        "booking process",
        "how do i book",
        "steps to book",
        "how to rent",
        "rent a car",
        "booking guide",
        "reservation",
        "how to reserve",
        "book a car",
        "process",
        "procedure",
      ])
    ) {
      return res.json({
        reply:
          "📅 How to Book a Car on SmartRent — Step by Step:\n\n" +
          "1️⃣ Register / Login — Create a free account or log in\n" +
          "2️⃣ Browse Cars — Use the search bar or filter by city, category, price\n" +
          "3️⃣ Select a Car — Click on any car to view full details & specs\n" +
          "4️⃣ Choose Dates — Enter your pickup and return dates\n" +
          "5️⃣ Book Now — Click the 'Book Now' button to confirm\n" +
          "6️⃣ Wait for Approval — The owner will confirm or reject your request\n" +
          "7️⃣ Email Notification — You'll receive an email once the booking is confirmed\n" +
          "8️⃣ Pickup — Go to the pickup location with your documents and payment\n\n" +
          "💡 Tip: You can track all your bookings in the 'My Bookings' section!\n\n" +
          "Need more help? Just ask! 😊",
      });
    }

    // ── 15. PRICING / RATES ──────────────────────────────────────────────────
    if (
      contains(msg, [
        "price",
        "prices",
        "rate",
        "rates",
        "cost",
        "charges",
        "how much",
        "fee",
        "fees",
        "tariff",
        "per day",
        "daily rate",
        "rental price",
        "pricing",
      ])
    ) {
      const cheapest = await Car.find({ isAvailable: true })
        .sort({ pricePerDay: 1 })
        .limit(1);
      const mostExpensive = await Car.find({ isAvailable: true })
        .sort({ pricePerDay: -1 })
        .limit(1);
      const min = cheapest[0]?.pricePerDay || 0;
      const max = mostExpensive[0]?.pricePerDay || 0;

      return res.json({
        reply:
          `💰 SmartRent Pricing Information:\n\n` +
          `• Prices start from Rs ${min.toLocaleString()}/day\n` +
          `• Premium cars go up to Rs ${max.toLocaleString()}/day\n\n` +
          `🧮 How is the total calculated?\n` +
          `Total = Price per day × Number of days\n` +
          `Example: Rs 5,000/day × 3 days = Rs 15,000 total\n\n` +
          `💳 Payment Method: Cash or bank transfer at vehicle pickup\n` +
          `🚫 No hidden charges or online payment fees\n\n` +
          `Type 'cheapest cars' to see our most affordable options!`,
      });
    }

    // ── 16. CANCELLATION POLICY ──────────────────────────────────────────────
    if (
      contains(msg, [
        "cancel",
        "cancellation",
        "refund",
        "policy",
        "cancel booking",
        "how to cancel",
        "cancellation policy",
        "cancel my booking",
      ])
    ) {
      return res.json({
        reply:
          "❌ SmartRent Cancellation Policy:\n\n" +
          "• You can cancel a pending booking anytime before it is confirmed\n" +
          "• Go to 'My Bookings' → find your booking → click 'Cancel Booking'\n" +
          "• Once a booking is confirmed by the owner, please contact the owner directly\n\n" +
          "💡 Cancellation Notes:\n" +
          "• Only pending bookings can be self-cancelled\n" +
          "• Confirmed bookings require owner approval to cancel\n" +
          "• Since payment is offline, there are no online refund processing fees\n\n" +
          "Need to cancel? Visit 'My Bookings' in your account. 😊",
      });
    }

    // ── 17. CONTACT / SUPPORT ────────────────────────────────────────────────
    if (
      contains(msg, [
        "contact",
        "support",
        "phone",
        "email",
        "reach",
        "call",
        "helpline",
        "customer service",
        "help desk",
        "address",
        "office",
        "whatsapp",
      ])
    ) {
      return res.json({
        reply:
          "📞 Contact SmartRent Support:\n\n" +
          "📱 Phone / WhatsApp: +92 300 8143370\n" +
          "📧 Email: mshoaib6307181@gmail.com\n" +
          "📍 Address: 4567 Luxury Drive, Mailsi, Pakistan\n\n" +
          "🕐 Support Hours: 9:00 AM – 9:00 PM (Mon–Sat)\n\n" +
          "We typically respond within 1–2 hours. Feel free to reach out! 😊",
      });
    }

    // ── 18. LISTING A CAR ────────────────────────────────────────────────────
    if (
      contains(msg, [
        "list my car",
        "add my car",
        "list a car",
        "rent out my car",
        "how to list",
        "become owner",
        "register car",
        "submit car",
        "earn money",
        "passive income",
        "list vehicle",
      ])
    ) {
      return res.json({
        reply:
          "🚘 Want to List Your Car on SmartRent?\n\n" +
          "It's simple! Here's how:\n\n" +
          "1️⃣ Log in to your account (must be a registered User)\n" +
          "2️⃣ Click 'List Your Car' from the home page or footer\n" +
          "3️⃣ Fill in your car details (brand, model, price, location, etc.)\n" +
          "4️⃣ Upload a clear photo of your car\n" +
          "5️⃣ Submit your request for admin review\n" +
          "6️⃣ You'll receive an email once your listing is approved!\n\n" +
          "💡 Benefits:\n" +
          "• Earn passive income from your idle vehicle\n" +
          "• We handle customer verification and bookings\n" +
          "• No hidden listing fees\n\n" +
          "Ready to get started? Click 'List Your Car' on the homepage! 🚀",
      });
    }

    // ── 19. SEATING CAPACITY ─────────────────────────────────────────────────
    if (
      contains(msg, [
        "seats",
        "seating",
        "capacity",
        "how many people",
        "passengers",
        "family car",
        "7 seater",
        "5 seater",
        "people",
      ])
    ) {
      const largeCars = await Car.find({
        isAvailable: true,
        seating_capacity: { $gte: 5 },
      }).sort({ seating_capacity: -1, pricePerDay: 1 });

      if (largeCars.length === 0) {
        return res.json({
          reply: "No large capacity cars are currently available.",
        });
      }
      return res.json({
        reply:
          `👨‍👩‍👧‍👦 Cars with 5+ seats (${largeCars.length} available):\n\n` +
          formatCarList(largeCars) +
          "\n\nPerfect for family trips and group travel!",
      });
    }

    // ── 20. LOCATION-FIRST INTENT ─────────────────────────────────────────────
    const availableLocations = await Car.distinct("location", {
      isAvailable: true,
    });
    const sortedLocations = [...availableLocations].sort(
      (a, b) => b.length - a.length,
    );

    let detectedLocation = null;

    for (const location of sortedLocations) {
      const normalizedLocation = normalize(location);
      if (normalizedLocation && msg.includes(normalizedLocation)) {
        detectedLocation = location;
        break;
      }
    }

    if (!detectedLocation) {
      const hintMatch = msg.match(/\b(?:in|at|from|near)\s+([a-z0-9\s]+)\b/);
      if (hintMatch?.[1]) {
        const hintedLocation = hintMatch[1].trim();
        detectedLocation =
          sortedLocations.find((loc) => {
            const normalizedLoc = normalize(loc);
            return (
              normalizedLoc === hintedLocation ||
              normalizedLoc.startsWith(hintedLocation) ||
              hintedLocation.startsWith(normalizedLoc)
            );
          }) || null;
      }
    }

    if (detectedLocation) {
      const cars = await Car.find({
        isAvailable: true,
        location: { $regex: new RegExp(`^${detectedLocation}$`, "i") },
      }).sort({ pricePerDay: 1 });

      if (cars.length > 0) {
        return res.json({
          reply:
            `📍 Available cars in ${detectedLocation} (${cars.length}):\n\n` +
            formatCarList(cars) +
            "\n\nClick on any car to view full details and book it!",
        });
      }
      return res.json({
        reply: `Sorry, no cars are currently available in ${detectedLocation}. Try another city or check back later!`,
      });
    }

    // ── 21. GENERAL CAR AVAILABILITY ──────────────────────────────────────────
    if (
      contains(msg, [
        "car",
        "cars",
        "available",
        "show cars",
        "all cars",
        "see cars",
        "view cars",
        "what cars",
      ])
    ) {
      const cars = await Car.find({ isAvailable: true }).sort({
        pricePerDay: 1,
      });
      if (cars.length === 0) {
        return res.json({
          reply: "No cars are available right now. Please check back soon!",
        });
      }
      return res.json({
        reply:
          `🚗 All available cars (${cars.length}):\n\n` +
          formatCarList(cars, 10) +
          `${cars.length > 10 ? `\n\n...and ${cars.length - 10} more! Visit the Cars page to see all.` : ""}` +
          "\n\nType a city name, category, or price range to filter results!",
      });
    }

    // ── 22. FAQ KEYWORD MATCHING (multi-keyword scoring) ──────────────────────
    const faqs = await Faq.find();
    let bestMatch = null;
    let bestScore = 0;

    for (const faq of faqs) {
      let score = 0;
      for (const keyword of faq.keywords) {
        const normalizedKeyword = normalize(keyword);
        if (normalizedKeyword && msg.includes(normalizedKeyword)) {
          // Longer keyword match = higher score (more specific)
          score += normalizedKeyword.length;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestMatch = faq;
      }
    }

    if (bestMatch && bestScore > 0) {
      return res.json({ reply: bestMatch.answer });
    }

    // ── 23. FALLBACK ──────────────────────────────────────────────────────────
    return res.json({
      reply:
        "🤔 I'm not sure I understood that. Here are some things you can ask me:\n\n" +
        "• 'Cars in Lahore' — see available cars by city\n" +
        "• 'Cheapest cars' — budget-friendly options\n" +
        "• 'SUV' / 'Sedan' / 'Hatchback' — by category\n" +
        "• 'Documents required' — what to bring\n" +
        "• 'How to book' — booking guide\n" +
        "• 'Cancellation policy' — how to cancel\n" +
        "• 'Contact' — reach our support team\n\n" +
        "Or type 'help' to see the full menu! 😊",
    });
  } catch (error) {
    console.error("[Chatbot] Error:", error.message);
    return res.status(500).json({
      reply: "⚠️ Server error. Please try again in a moment.",
    });
  }
});

export default router;
