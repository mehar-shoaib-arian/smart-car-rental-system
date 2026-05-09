import mongoose from "mongoose";
import "dotenv/config";
import Faq from "./models/Faq.js";

const faqs = [
  // ── Documents & Requirements ─────────────────────────────────────────────
  {
    question: "What documents are required to rent a car?",
    answer:
      "📄 Documents Required for Car Rental at SmartRent:\n\n" +
      "1. 🪪 Valid CNIC (National Identity Card) — original copy\n" +
      "2. 🚗 Valid Driving License — must be current and not expired\n" +
      "3. 📱 Active phone number for contact\n" +
      "4. 💵 Payment amount (collected offline at pickup)\n\n" +
      "📌 Important Notes:\n" +
      "• You must be at least 21 years old to rent a vehicle\n" +
      "• Both CNIC and driving license must match the same person\n" +
      "• Foreign nationals must present a valid passport + international driving permit\n" +
      "• Documents will be verified at the time of vehicle pickup",
    keywords: [
      "documents",
      "document",
      "required",
      "cnic",
      "license",
      "driving license",
      "id card",
      "requirements",
      "paperwork",
      "papers",
      "what to bring",
      "what do i need",
      "necessary",
      "identification",
    ],
  },

  // ── Booking Process ──────────────────────────────────────────────────────
  {
    question: "How do I book a car?",
    answer:
      "📅 How to Book a Car on SmartRent:\n\n" +
      "1️⃣ Register or log in to your account\n" +
      "2️⃣ Browse available cars or search by city/category\n" +
      "3️⃣ Click on a car to view full details and specifications\n" +
      "4️⃣ Select your pickup and return dates\n" +
      "5️⃣ Click 'Book Now' to submit your booking request\n" +
      "6️⃣ Wait for the owner to confirm your booking\n" +
      "7️⃣ You will receive an email notification once confirmed\n" +
      "8️⃣ Visit the pickup location with your documents and payment\n\n" +
      "💡 You can track all your bookings in the 'My Bookings' section!",
    keywords: [
      "how to book",
      "booking process",
      "book a car",
      "how to rent",
      "steps to book",
      "reservation",
      "how do i book",
      "booking guide",
      "rent a car",
      "procedure",
    ],
  },

  // ── Cancellation Policy ──────────────────────────────────────────────────
  {
    question: "What is the cancellation policy?",
    answer:
      "❌ SmartRent Cancellation Policy:\n\n" +
      "• You can cancel a pending booking anytime before it is confirmed by the owner\n" +
      "• Go to 'My Bookings' → find your booking → click 'Cancel Booking'\n" +
      "• Once a booking is confirmed, please contact the owner directly to cancel\n\n" +
      "💡 Important Notes:\n" +
      "• Only pending bookings can be self-cancelled by the user\n" +
      "• Confirmed bookings require owner approval to cancel\n" +
      "• Since payment is collected offline, there are no online refund processing fees\n" +
      "• In case of disputes, contact our support team at +92 300 8143370",
    keywords: [
      "cancel",
      "cancellation",
      "refund",
      "cancel booking",
      "how to cancel",
      "cancellation policy",
      "cancel my booking",
      "policy",
    ],
  },

  // ── Pricing & Payment ────────────────────────────────────────────────────
  {
    question: "How is the rental price calculated?",
    answer:
      "💰 Rental Price Calculation at SmartRent:\n\n" +
      "Total Price = Price per day × Number of days\n\n" +
      "Example:\n" +
      "• Car: Rs 5,000/day\n" +
      "• Duration: 3 days\n" +
      "• Total: Rs 5,000 × 3 = Rs 15,000\n\n" +
      "📌 Payment Notes:\n" +
      "• Payment is collected offline (cash or bank transfer) at vehicle pickup\n" +
      "• No online payment or hidden charges\n" +
      "• No deposit or credit card required to make a booking reservation\n\n" +
      "Type 'cheapest cars' to see our most affordable options!",
    keywords: [
      "price",
      "pricing",
      "cost",
      "charges",
      "how much",
      "rate",
      "rates",
      "fee",
      "fees",
      "per day",
      "daily rate",
      "rental price",
      "tariff",
      "calculate",
      "total price",
    ],
  },

  // ── Payment Method ───────────────────────────────────────────────────────
  {
    question: "What payment methods are accepted?",
    answer:
      "💳 Payment Methods at SmartRent:\n\n" +
      "• 💵 Cash — most common, pay at pickup\n" +
      "• 🏦 Bank Transfer — transfer to owner's account before pickup\n" +
      "• 📱 EasyPaisa / JazzCash — mobile payment at pickup\n\n" +
      "📌 Important:\n" +
      "• All payments are collected offline at the time of vehicle pickup\n" +
      "• No online credit/debit card payments are currently supported\n" +
      "• Always get a receipt or confirmation from the car owner after payment",
    keywords: [
      "payment",
      "pay",
      "payment method",
      "cash",
      "bank transfer",
      "easypaisa",
      "jazzcash",
      "how to pay",
      "payment options",
      "online payment",
    ],
  },

  // ── Minimum Age ──────────────────────────────────────────────────────────
  {
    question: "What is the minimum age to rent a car?",
    answer:
      "🎂 Minimum Age Requirement:\n\n" +
      "• You must be at least 21 years old to rent a car on SmartRent\n" +
      "• A valid driving license is mandatory regardless of age\n" +
      "• Drivers between 21–25 may be subject to additional verification\n\n" +
      "📌 Age is verified using your CNIC at the time of vehicle pickup.",
    keywords: [
      "age",
      "minimum age",
      "how old",
      "age limit",
      "age requirement",
      "young driver",
      "21",
    ],
  },

  // ── Insurance ─────────────────────────────────────────────────────────────
  {
    question: "Is insurance included with the rental?",
    answer:
      "🛡️ Insurance Policy at SmartRent:\n\n" +
      "• Basic third-party insurance is included with all rentals\n" +
      "• The car owner is responsible for ensuring their vehicle has valid insurance\n" +
      "• Comprehensive insurance coverage may vary by vehicle\n\n" +
      "📌 Important:\n" +
      "• In case of an accident, immediately contact the car owner and local authorities\n" +
      "• Any damage caused by the renter is the renter's responsibility\n" +
      "• Always inspect the vehicle before pickup and document any existing damage",
    keywords: [
      "insurance",
      "insured",
      "coverage",
      "accident",
      "damage",
      "covered",
      "third party",
    ],
  },

  // ── Fuel Policy ──────────────────────────────────────────────────────────
  {
    question: "Who is responsible for fuel?",
    answer:
      "⛽ Fuel Policy at SmartRent:\n\n" +
      "• The renter is responsible for fuel costs during the rental period\n" +
      "• Cars are typically provided with a full tank at pickup\n" +
      "• Please return the car with the same fuel level as at pickup\n\n" +
      "💡 Tips:\n" +
      "• Check the fuel level at pickup and take a photo as proof\n" +
      "• Agree on the fuel policy with the car owner before driving away\n" +
      "• Electric car charging costs are also the renter's responsibility",
    keywords: [
      "fuel",
      "petrol",
      "diesel",
      "gas",
      "fuel policy",
      "fill up",
      "fuel cost",
      "refuel",
      "tank",
    ],
  },

  // ── Late Return ──────────────────────────────────────────────────────────
  {
    question: "What happens if I return the car late?",
    answer:
      "⏰ Late Return Policy:\n\n" +
      "• If you need to extend your rental, please contact the car owner as early as possible\n" +
      "• Late returns without prior notice may incur additional daily charges\n" +
      "• Extra days are charged at the same daily rate as your original booking\n\n" +
      "📌 Best Practice:\n" +
      "• Always communicate with the owner if you anticipate a delay\n" +
      "• Extensions are subject to the car's availability after your booked period",
    keywords: [
      "late return",
      "extend",
      "extension",
      "late",
      "overtime",
      "extra days",
      "return late",
      "delay",
    ],
  },

  // ── Vehicle Breakdown ────────────────────────────────────────────────────
  {
    question: "What should I do if the car breaks down?",
    answer:
      "🔧 In Case of Vehicle Breakdown:\n\n" +
      "1. Move to a safe location away from traffic\n" +
      "2. Turn on hazard lights immediately\n" +
      "3. Contact the car owner immediately — their number is in your booking\n" +
      "4. Contact SmartRent support: +92 300 8143370\n" +
      "5. Do not attempt repairs yourself unless you are qualified\n\n" +
      "📌 The car owner is responsible for mechanical issues that are not caused by the renter.\n" +
      "Always document the situation with photos.",
    keywords: [
      "breakdown",
      "broke down",
      "not working",
      "engine",
      "repair",
      "malfunction",
      "problem with car",
      "car problem",
      "issue",
      "emergency",
    ],
  },

  // ── Account Registration ─────────────────────────────────────────────────
  {
    question: "How do I create an account?",
    answer:
      "📝 How to Create a SmartRent Account:\n\n" +
      "1️⃣ Click 'Login' on the top navigation bar\n" +
      "2️⃣ Select your role: User (to rent cars) or Owner (to list cars)\n" +
      "3️⃣ Switch to the 'Register' tab\n" +
      "4️⃣ Enter your full name, email address, and password\n" +
      "5️⃣ Click 'Create Account'\n" +
      "6️⃣ You will receive a welcome email upon successful registration\n\n" +
      "💡 Registration is completely free!\n" +
      "You can register as a User to rent cars, or as an Owner to list your vehicles.",
    keywords: [
      "register",
      "create account",
      "sign up",
      "signup",
      "new account",
      "how to register",
      "account",
      "join",
    ],
  },

  // ── Forgot Password ──────────────────────────────────────────────────────
  {
    question: "I forgot my password. How do I reset it?",
    answer:
      "🔑 Forgot Your Password?\n\n" +
      "Currently, password reset via email link is not yet available on SmartRent.\n\n" +
      "To reset your password:\n" +
      "• Log in to your account if you remember your password\n" +
      "• Go to the Owner Dashboard → My Profile → Change Password section\n" +
      "• Enter your current password and set a new one\n\n" +
      "If you are completely locked out, please contact our support team:\n" +
      "📱 +92 300 8143370\n" +
      "📧 mshoaib6307181@gmail.com\n\n" +
      "We will assist you in recovering your account.",
    keywords: [
      "forgot password",
      "reset password",
      "change password",
      "password",
      "lost password",
      "can not login",
      "locked out",
    ],
  },

  // ── List Your Car ────────────────────────────────────────────────────────
  {
    question: "How do I list my car on SmartRent?",
    answer:
      "🚘 How to List Your Car on SmartRent:\n\n" +
      "1️⃣ Log in as a registered User\n" +
      "2️⃣ Click 'List Your Car' on the home page or footer\n" +
      "3️⃣ Fill in your car details:\n" +
      "   • Full name & contact information\n" +
      "   • Car brand, model, year, category\n" +
      "   • Transmission, fuel type, seating capacity\n" +
      "   • Daily rental price and pickup location\n" +
      "   • Car description and high-quality photo\n" +
      "4️⃣ Submit the form for admin review\n" +
      "5️⃣ You will receive an email once approved or rejected\n\n" +
      "✅ Once approved, your car goes live and customers can start booking it!\n" +
      "💰 Earn passive income from your idle vehicle with zero hassle.",
    keywords: [
      "list car",
      "add car",
      "list my car",
      "rent out",
      "how to list",
      "listing",
      "submit car",
      "add my car",
      "register car",
      "earn money",
    ],
  },

  // ── Booking Status ───────────────────────────────────────────────────────
  {
    question: "What do the booking status labels mean?",
    answer:
      "📋 Booking Status Guide:\n\n" +
      "🟡 Pending — Your booking request has been submitted and is waiting for the owner to review it\n\n" +
      "🟢 Confirmed — The owner has approved your booking. Proceed to pickup on your selected date\n\n" +
      "🔴 Cancelled — The booking was cancelled either by you or by the owner\n\n" +
      "💡 Tips:\n" +
      "• You can cancel a Pending booking yourself from 'My Bookings'\n" +
      "• For Confirmed bookings, contact the owner directly if you need to make changes\n" +
      "• You will receive an email notification whenever your booking status changes",
    keywords: [
      "status",
      "booking status",
      "pending",
      "confirmed",
      "cancelled",
      "what does pending mean",
      "booking labels",
    ],
  },

  // ── Operating Hours ──────────────────────────────────────────────────────
  {
    question: "What are your operating hours?",
    answer:
      "🕐 SmartRent Operating Hours:\n\n" +
      "🌐 Website: Available 24/7 — browse and book anytime!\n\n" +
      "📞 Customer Support:\n" +
      "• Monday – Saturday: 9:00 AM – 9:00 PM\n" +
      "• Sunday: 10:00 AM – 6:00 PM\n\n" +
      "🤖 Chatbot: Available 24/7 for instant answers\n\n" +
      "📌 Vehicle pickups and drop-offs are arranged directly between the renter and car owner based on their availability.",
    keywords: [
      "hours",
      "operating hours",
      "working hours",
      "open",
      "available",
      "timing",
      "when open",
      "office hours",
      "time",
    ],
  },

  // ── Multiple Bookings ────────────────────────────────────────────────────
  {
    question: "Can I make multiple bookings at the same time?",
    answer:
      "✅ Yes, you can make multiple bookings on SmartRent!\n\n" +
      "• There is no limit on the number of simultaneous bookings\n" +
      "• Each booking is independent with its own dates, car, and status\n" +
      "• You can view and manage all your bookings from the 'My Bookings' page\n\n" +
      "📌 Note: Each car can only be booked by one person for any given date range to prevent double-booking.",
    keywords: [
      "multiple bookings",
      "more than one booking",
      "two cars",
      "simultaneous",
      "same time booking",
    ],
  },

  // ── Delivery Service ─────────────────────────────────────────────────────
  {
    question: "Do you offer car delivery to my location?",
    answer:
      "🚗 Car Delivery Service:\n\n" +
      "Car delivery depends on the individual car owner's preference.\n\n" +
      "• Some owners may offer delivery to your location for an additional fee\n" +
      "• This must be arranged directly with the car owner after booking\n" +
      "• The standard process is to pick up the car at the listed location\n\n" +
      "📌 Always confirm delivery arrangements with the owner before your pickup date.\n" +
      "Contact details are available in your booking confirmation.",
    keywords: [
      "delivery",
      "deliver car",
      "drop off",
      "home delivery",
      "car delivery",
      "bring car",
      "pick up",
    ],
  },

  // ── Driver Provided ──────────────────────────────────────────────────────
  {
    question: "Do you provide a driver with the car?",
    answer:
      "👨‍✈️ Driver Service:\n\n" +
      "• By default, all cars on SmartRent are self-drive rentals\n" +
      "• A valid driving license is required to rent any vehicle\n" +
      "• Some owners may offer a driver service upon request for an additional charge\n\n" +
      "📌 If you need a driver, mention it in your booking and contact the owner directly to arrange.\n\n" +
      "Contact support at +92 300 8143370 if you need help finding a car with a driver.",
    keywords: [
      "driver",
      "chauffeur",
      "with driver",
      "driver service",
      "self drive",
      "driving",
    ],
  },

  // ── Long Term Rental ──────────────────────────────────────────────────────
  {
    question: "Can I rent a car for a long period like a month?",
    answer:
      "📅 Long-Term Rental:\n\n" +
      "Yes! SmartRent supports long-term rentals.\n\n" +
      "• Simply select your start date and end date when booking\n" +
      "• The total price is automatically calculated (price per day × number of days)\n" +
      "• For rentals longer than 2 weeks, we recommend contacting the car owner directly to negotiate a discount\n\n" +
      "💡 Many owners offer special monthly rates for long-term rentals!\n" +
      "Contact the owner after booking to discuss a long-term arrangement.",
    keywords: [
      "long term",
      "monthly",
      "month",
      "weekly",
      "week",
      "long period",
      "extended rental",
      "30 days",
    ],
  },

  // ── Damage Responsibility ─────────────────────────────────────────────────
  {
    question: "Who is responsible if the car gets damaged?",
    answer:
      "⚠️ Damage Responsibility Policy:\n\n" +
      "• The renter is responsible for any damage caused during the rental period\n" +
      "• Always inspect the car thoroughly BEFORE pickup\n" +
      "• Take photos/videos of any pre-existing damage and share with the owner\n" +
      "• Report any damage immediately to the car owner\n\n" +
      "📌 Guidelines:\n" +
      "• Normal wear and tear is the owner's responsibility\n" +
      "• Accidental damage during rental is the renter's responsibility\n" +
      "• In case of accidents, contact local authorities and the car owner immediately\n" +
      "• SmartRent mediates disputes between renters and owners",
    keywords: [
      "damage",
      "damaged",
      "accident",
      "responsibility",
      "scratch",
      "dent",
      "repair cost",
      "who pays",
      "liability",
    ],
  },

  // ── Children / Family ─────────────────────────────────────────────────────
  {
    question: "Are child seats available?",
    answer:
      "👶 Child Seats at SmartRent:\n\n" +
      "• Child seats are not automatically included with rentals\n" +
      "• Some car owners may have child seats available upon request\n" +
      "• Contact the car owner after booking to request a child seat\n\n" +
      "💡 For family trips, we recommend booking an SUV or a 7-seater vehicle for maximum comfort.\n" +
      "Type 'family car' or 'SUV' to see suitable options!",
    keywords: [
      "child seat",
      "baby seat",
      "car seat",
      "children",
      "baby",
      "infant seat",
      "family",
    ],
  },

  // ── Traffic Violations ────────────────────────────────────────────────────
  {
    question: "What happens if I get a traffic violation while renting?",
    answer:
      "🚦 Traffic Violations During Rental:\n\n" +
      "• The renter is fully responsible for all traffic violations during the rental period\n" +
      "• This includes speeding fines, parking tickets, and other violations\n" +
      "• Fines received during the rental period must be paid by the renter\n\n" +
      "📌 Please drive safely and follow all traffic rules.\n" +
      "SmartRent and the car owner are not responsible for violations committed by the renter.",
    keywords: [
      "traffic",
      "violation",
      "fine",
      "ticket",
      "speeding",
      "challan",
      "traffic fine",
      "traffic violation",
    ],
  },

  // ── Review / Rating ───────────────────────────────────────────────────────
  {
    question: "How do I leave feedback or a review?",
    answer:
      "⭐ Leaving a Review on SmartRent:\n\n" +
      "1. Scroll down to the 'Customer Feedback' section on the Home page\n" +
      "2. Fill in your name and location\n" +
      "3. Select your star rating (1–5 stars)\n" +
      "4. Write your comment about your experience\n" +
      "5. Click 'Submit Feedback'\n\n" +
      "💡 Your review will be displayed publicly on the SmartRent homepage to help other customers.\n" +
      "We appreciate honest feedback to help us improve our service!",
    keywords: [
      "review",
      "feedback",
      "rating",
      "rate",
      "leave review",
      "comment",
      "testimonial",
      "experience",
    ],
  },

  // ── Newsletter ────────────────────────────────────────────────────────────
  {
    question: "How do I subscribe to the newsletter?",
    answer:
      "📧 Subscribe to SmartRent Newsletter:\n\n" +
      "1. Scroll to the bottom of the Home page\n" +
      "2. Find the 'Never Miss a Deal!' section\n" +
      "3. Enter your email address in the subscription box\n" +
      "4. Click 'Subscribe'\n\n" +
      "✅ You will receive updates about:\n" +
      "• New cars added to the platform\n" +
      "• Special discounts and seasonal offers\n" +
      "• New city launches\n" +
      "• Platform updates and features\n\n" +
      "💡 We respect your privacy and will never share your email with third parties.",
    keywords: [
      "newsletter",
      "subscribe",
      "subscription",
      "email updates",
      "notifications",
      "deals",
      "offers",
      "discount",
    ],
  },

  // ── About SmartRent ───────────────────────────────────────────────────────
  {
    question: "What is SmartRent?",
    answer:
      "🚗 About SmartRent:\n\n" +
      "SmartRent is a modern web-based car rental platform that connects car owners with people who need to rent a vehicle.\n\n" +
      "🎯 Our Mission:\n" +
      "To make car rental simple, transparent, and accessible for everyone — especially in small and medium-sized cities across Pakistan.\n\n" +
      "✨ What we offer:\n" +
      "• Browse and book cars online in minutes\n" +
      "• Real-time availability checking\n" +
      "• Role-based access for renters and car owners\n" +
      "• 24/7 chatbot support\n" +
      "• Email notifications for all booking updates\n\n" +
      "📍 Currently serving: Lahore, Karachi, Multan, Islamabad\n\n" +
      "Built with the MERN stack (MongoDB, Express, React, Node.js).",
    keywords: [
      "about",
      "smartrent",
      "what is",
      "about smartrent",
      "who are you",
      "company",
      "platform",
      "service",
    ],
  },
];

const seedFaqs = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Database connected");

    // Clear existing FAQs
    const deleted = await Faq.deleteMany({});
    console.log(`🗑️  Cleared ${deleted.deletedCount} existing FAQs`);

    // Insert new FAQs
    const inserted = await Faq.insertMany(faqs);
    console.log(`✅ Successfully seeded ${inserted.length} FAQs`);

    // Show summary
    console.log("\n📋 Seeded FAQs:");
    inserted.forEach((faq, i) => {
      console.log(`  ${i + 1}. ${faq.question}`);
    });

    console.log("\n🎉 FAQ seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding FAQs:", error.message);
    process.exit(1);
  }
};

seedFaqs();
