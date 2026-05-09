import express from "express";
import "dotenv/config";
import connectDB from "./configs/db.js";

import userRouter from "./routes/userRoutes.js";
import ownerRouter from "./routes/ownerRoutes.js";
import bookingRouter from "./routes/bookingRoutes.js";
import chatbotRoutes from "./routes/chatbotRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import carRouter from "./routes/carRoutes.js";
import newsletterRouter from "./routes/newsletterRoutes.js";
import listingRequestRouter from "./routes/listingRequestRoutes.js";
import adminFaqRouter from "./routes/adminFaqRoutes.js";
import paymentRouter from "./routes/paymentRoutes.js";
import overdueRouter from "./routes/overdueRoutes.js";

import cors from "cors";

const app = express();

await connectDB();

app.use("/api/payment/webhook", express.raw({ type: "application/json" }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.use("/api/user", userRouter);
app.use("/api/owner", ownerRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/cars", carRouter);
app.use("/api/newsletter", newsletterRouter);
app.use("/api/listing-requests", listingRequestRouter);
app.use("/api/admin/faqs", adminFaqRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/overdue", overdueRouter);

export default app;
