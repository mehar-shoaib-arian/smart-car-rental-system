import nodemailer from "nodemailer";
import Booking from "../models/Booking.js";

// ─── Nodemailer transporter ───────────────────────────────────────────────────
const createTransporter = () =>
  nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

// ─── Format date helper ───────────────────────────────────────────────────────
const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-PK", {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

// ─── Base email wrapper ───────────────────────────────────────────────────────
const baseHtml = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>SmartRent Alert</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6f9; color: #333; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #dc2626, #ef4444); padding: 36px 40px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 22px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.85); font-size: 13px; margin-top: 6px; }
    .body { padding: 36px 40px; }
    .greeting { font-size: 16px; font-weight: 600; color: #1a1a2e; margin-bottom: 12px; }
    .message { font-size: 14px; color: #555; line-height: 1.7; margin-bottom: 24px; }
    .card { background: #fff5f5; border: 1px solid #fecaca; border-radius: 10px; padding: 20px 24px; margin-bottom: 24px; }
    .card-title { font-size: 12px; font-weight: 700; color: #dc2626; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 14px; }
    .row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #fecaca; }
    .row:last-child { border-bottom: none; }
    .row-label { font-size: 13px; color: #888; }
    .row-value { font-size: 13px; font-weight: 600; color: #2d3748; text-align: right; }
    .alert-box { background: #fee2e2; border-left: 4px solid #dc2626; border-radius: 6px; padding: 12px 16px; font-size: 13px; color: #7f1d1d; margin-bottom: 24px; line-height: 1.6; }
    .footer { background: #f8faff; padding: 24px 40px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer p { font-size: 12px; color: #aaa; line-height: 1.8; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>SmartRent</h1>
      <p>Smart Car Rental System</p>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>This is an automated message from <strong>SmartRent</strong>.</p>
      <p>4567 Luxury Drive, Mailsi, Pakistan &nbsp;|&nbsp; +92 300 8143370</p>
      <p style="margin-top:10px; color:#ccc;">© ${new Date().getFullYear()} SmartRent. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

// ─── Send email helper ────────────────────────────────────────────────────────
const sendEmail = async ({ to, subject, html }) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log(
        "[OverdueController] EMAIL_USER or EMAIL_PASS not set — skipping.",
      );
      return;
    }
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"SmartRent" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`[OverdueController] Email sent to ${to} — "${subject}"`);
  } catch (error) {
    console.error("[OverdueController] Failed to send email:", error.message);
  }
};

// ─── Email to OWNER ───────────────────────────────────────────────────────────
const sendOwnerOverdueEmail = async ({
  ownerEmail,
  ownerName,
  userName,
  userEmail,
  carBrand,
  carModel,
  returnDate,
  daysOverdue,
}) => {
  const content = `
    <p class="greeting">Hi ${ownerName},</p>
    <p class="message">
      This is an automated alert. Your <strong>${carBrand} ${carModel}</strong> has
      <strong style="color:#dc2626;">not been returned</strong> by the customer.
      The return date has passed <strong>${daysOverdue} day${daysOverdue !== 1 ? "s" : ""} ago</strong>.
      Please follow up with the customer immediately.
    </p>
    <div class="card">
      <div class="card-title">Overdue Booking Details</div>
      <div class="row">
        <span class="row-label">Customer Name</span>
        <span class="row-value">${userName}</span>
      </div>
      <div class="row">
        <span class="row-label">Customer Email</span>
        <span class="row-value">${userEmail}</span>
      </div>
      <div class="row">
        <span class="row-label">Vehicle</span>
        <span class="row-value">${carBrand} ${carModel}</span>
      </div>
      <div class="row">
        <span class="row-label">Return Date (Passed)</span>
        <span class="row-value" style="color:#dc2626;">${formatDate(returnDate)}</span>
      </div>
      <div class="row">
        <span class="row-label">Days Overdue</span>
        <span class="row-value" style="color:#dc2626;">${daysOverdue} day${daysOverdue !== 1 ? "s" : ""}</span>
      </div>
    </div>
    <div class="alert-box">
      🚨 <strong>Action Required:</strong> Contact the customer and arrange immediate return of your vehicle.
      If necessary, consider reporting to authorities. Log in to your SmartRent dashboard for full booking details.
    </div>
  `;

  await sendEmail({
    to: ownerEmail,
    subject: `🚨 Overdue Booking Alert — ${carBrand} ${carModel} | SmartRent`,
    html: baseHtml(content),
  });
};

// ─── Email to USER (renter) ───────────────────────────────────────────────────
const sendUserOverdueEmail = async ({
  userEmail,
  userName,
  ownerName,
  carBrand,
  carModel,
  returnDate,
  daysOverdue,
}) => {
  const content = `
    <p class="greeting">Hi ${userName},</p>
    <p class="message">
      This is an urgent reminder that your rental of <strong>${carBrand} ${carModel}</strong>
      was due for return on <strong style="color:#dc2626;">${formatDate(returnDate)}</strong> —
      which was <strong>${daysOverdue} day${daysOverdue !== 1 ? "s" : ""} ago</strong>.
      Please return the vehicle to the owner immediately to avoid any penalties.
    </p>
    <div class="card">
      <div class="card-title">Your Overdue Rental</div>
      <div class="row">
        <span class="row-label">Vehicle</span>
        <span class="row-value">${carBrand} ${carModel}</span>
      </div>
      <div class="row">
        <span class="row-label">Owner</span>
        <span class="row-value">${ownerName}</span>
      </div>
      <div class="row">
        <span class="row-label">Return Date (Passed)</span>
        <span class="row-value" style="color:#dc2626;">${formatDate(returnDate)}</span>
      </div>
      <div class="row">
        <span class="row-label">Days Overdue</span>
        <span class="row-value" style="color:#dc2626;">${daysOverdue} day${daysOverdue !== 1 ? "s" : ""}</span>
      </div>
    </div>
    <div class="alert-box">
      ⚠️ <strong>Urgent:</strong> Please return the vehicle immediately. Continued delay may result
      in additional charges or legal action. Contact the owner or SmartRent support if you need assistance.
    </div>
  `;

  await sendEmail({
    to: userEmail,
    subject: `⚠️ Urgent: Please Return ${carBrand} ${carModel} — Overdue by ${daysOverdue} Day${daysOverdue !== 1 ? "s" : ""} | SmartRent`,
    html: baseHtml(content),
  });
};

// ─── Core logic: find overdue bookings and send emails ────────────────────────
export const runOverdueCheck = async () => {
  try {
    const now = new Date();
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    const alertEligibleBefore = new Date(now.getTime() - TWENTY_FOUR_HOURS);

    const overdueBookings = await Booking.find({
      status: "confirmed",
      // only send alerts after the booking has been overdue for at least 24 hours
      returnDate: { $lte: alertEligibleBefore },
      overdueAlertSent: { $ne: true },
    })
      .populate("car", "brand model location")
      .populate("user", "name email")
      .populate("owner", "name email");

    if (overdueBookings.length === 0) {
      console.log(
        "[OverdueCheck] No overdue bookings eligible for alerts yet.",
      );
      return { processed: 0 };
    }

    let processed = 0;

    for (const booking of overdueBookings) {
      const car = booking.car;
      const user = booking.user;
      const owner = booking.owner;

      const daysOverdue = Math.ceil(
        (now - new Date(booking.returnDate)) / (1000 * 60 * 60 * 24),
      );

      // ── Email to Owner ──
      if (owner?.email) {
        await sendOwnerOverdueEmail({
          ownerEmail: owner.email,
          ownerName: owner.name || "Owner",
          userName: user?.name || "Customer",
          userEmail: user?.email || "",
          carBrand: car?.brand || "Unknown",
          carModel: car?.model || "Car",
          returnDate: booking.returnDate,
          daysOverdue,
        });
      }

      // ── Email to User (renter) ──
      if (user?.email) {
        await sendUserOverdueEmail({
          userEmail: user.email,
          userName: user.name || "Customer",
          ownerName: owner?.name || "Owner",
          carBrand: car?.brand || "Unknown",
          carModel: car?.model || "Car",
          returnDate: booking.returnDate,
          daysOverdue,
        });
      }

      // Mark as alerted so we don't send again and record send/check timestamps
      booking.overdueAlertSent = true;
      booking.overdueAlertSentAt = now;
      booking.lastOverdueCheckedAt = now;
      await booking.save();
      processed++;

      console.log(
        `[OverdueCheck] Alerts sent for booking ${booking._id} — ${car?.brand} ${car?.model} — ${daysOverdue} day(s) overdue`,
      );
    }

    console.log(`[OverdueCheck] Done. ${processed} booking(s) alerted.`);
    return { processed };
  } catch (error) {
    console.error("[OverdueCheck] Error:", error.message);
    return { processed: 0, error: error.message };
  }
};

// ─── Auto cron job: runs hourly so 24-hour overdue alerts send automatically ─────────
export const startOverdueCron = () => {
  const ONE_HOUR = 60 * 60 * 1000;

  // Run immediately on server start to catch any missed alerts
  console.log("[OverdueCron] Running initial overdue check on server start...");
  runOverdueCheck();

  // Then repeat every hour so alerts go out soon after the 24-hour threshold is reached
  setInterval(async () => {
    console.log("[OverdueCron] Running hourly overdue check...");
    await runOverdueCheck();
  }, ONE_HOUR);

  console.log("[OverdueCron] Hourly overdue check scheduled.");
};

// =============================
// Manual trigger — POST /api/overdue/check
// =============================
export const checkOverdueBookings = async (req, res) => {
  try {
    const result = await runOverdueCheck();
    return res.json({
      success: true,
      message:
        result.processed > 0
          ? `Overdue check complete. ${result.processed} alert(s) sent to both owners and renters.`
          : "No new overdue bookings found.",
      processed: result.processed,
    });
  } catch (error) {
    console.error("checkOverdueBookings error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =============================
// Get Overdue Bookings — GET /api/overdue/
// =============================
export const getOverdueBookings = async (req, res) => {
  try {
    const now = new Date();

    const overdueBookings = await Booking.find({
      owner: req.user._id,
      status: "confirmed",
      returnDate: { $lt: now },
    })
      .populate("car", "brand model image location pricePerDay year category")
      .populate("user", "name email")
      .sort({ returnDate: 1 });

    return res.json({ success: true, bookings: overdueBookings });
  } catch (error) {
    console.error("getOverdueBookings error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};
