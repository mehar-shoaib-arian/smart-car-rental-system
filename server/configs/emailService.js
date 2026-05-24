import nodemailer from "nodemailer";

// ─── Transporter ────────────────────────────────────────────────────────────
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const hasUsableEmailConfig = () => {
  const user = String(process.env.EMAIL_USER || "").trim();
  const pass = String(process.env.EMAIL_PASS || "").trim();

  return (
    user &&
    pass &&
    user !== "your_gmail@gmail.com" &&
    pass !== "your_gmail_app_password"
  );
};

// ─── Base HTML wrapper ───────────────────────────────────────────────────────
const baseTemplate = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>SmartRent Notification</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6f9; color: #333; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #0558FE, #3b82f6); padding: 36px 40px; text-align: center; }
    .header img { height: 36px; margin-bottom: 12px; }
    .header h1 { color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: 0.3px; }
    .header p { color: rgba(255,255,255,0.85); font-size: 13px; margin-top: 6px; }
    .body { padding: 36px 40px; }
    .greeting { font-size: 16px; font-weight: 600; color: #1a1a2e; margin-bottom: 12px; }
    .message { font-size: 14px; color: #555; line-height: 1.7; margin-bottom: 24px; }
    .card { background: #f8faff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px 24px; margin-bottom: 24px; }
    .card-title { font-size: 12px; font-weight: 700; color: #0558FE; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 14px; }
    .row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #eef0f4; }
    .row:last-child { border-bottom: none; }
    .row-label { font-size: 13px; color: #888; }
    .row-value { font-size: 13px; font-weight: 600; color: #2d3748; text-align: right; }
    .status-badge { display: inline-block; padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: capitalize; }
    .status-confirmed { background: #dcfce7; color: #16a34a; }
    .status-cancelled { background: #fee2e2; color: #dc2626; }
    .status-pending   { background: #fef9c3; color: #ca8a04; }
    .status-approved  { background: #dcfce7; color: #16a34a; }
    .status-rejected  { background: #fee2e2; color: #dc2626; }
    .price-box { background: linear-gradient(135deg, #0558FE, #3b82f6); border-radius: 10px; padding: 20px 24px; margin-bottom: 24px; text-align: center; }
    .price-box .label { color: rgba(255,255,255,0.8); font-size: 12px; margin-bottom: 4px; }
    .price-box .amount { color: #ffffff; font-size: 32px; font-weight: 800; }
    .btn { display: inline-block; padding: 12px 32px; background: #0558FE; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600; margin-top: 8px; }
    .btn:hover { background: #0447d4; }
    .note { background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 6px; padding: 12px 16px; font-size: 13px; color: #78350f; margin-bottom: 24px; line-height: 1.6; }
    .footer { background: #f8faff; padding: 24px 40px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer p { font-size: 12px; color: #aaa; line-height: 1.8; }
    .footer a { color: #0558FE; text-decoration: none; }
    .divider { height: 1px; background: #e2e8f0; margin: 20px 0; }
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
      <p><a href="mailto:mshoaib6307181@gmail.com">mshoaib6307181@gmail.com</a></p>
      <p style="margin-top:10px; color:#ccc;">© ${new Date().getFullYear()} SmartRent. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

// ─── Send helper ─────────────────────────────────────────────────────────────
const sendEmail = async ({ to, subject, html }) => {
  try {
    if (!hasUsableEmailConfig()) {
      console.log(
        "[EmailService] EMAIL_USER or EMAIL_PASS is not configured correctly - skipping email.",
      );
      return {
        success: false,
        message:
          "Email service is not configured. Set EMAIL_USER and EMAIL_PASS in server/.env.",
      };
    }

    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"SmartRent" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`[EmailService] Email sent to ${to} - "${subject}"`);
    return { success: true };
  } catch (error) {
    // Never crash the main flow because of email
    console.error("[EmailService] Failed to send email:", error.message);
    return { success: false, message: error.message };
  }
};

// ─── 1. Welcome Email ─────────────────────────────────────────────────────────
export const sendWelcomeEmail = async ({ name, email, role }) => {
  const content = `
    <p class="greeting">Welcome to SmartRent, ${name}! 🎉</p>
    <p class="message">
      Your account has been created successfully. You are registered as a
      <strong style="color:#0558FE; text-transform:capitalize;">${role}</strong>.
    </p>
    <div class="card">
      <div class="card-title">Your Account Details</div>
      <div class="row">
        <span class="row-label">Name</span>
        <span class="row-value">${name}</span>
      </div>
      <div class="row">
        <span class="row-label">Email</span>
        <span class="row-value">${email}</span>
      </div>
      <div class="row">
        <span class="row-label">Role</span>
        <span class="row-value" style="text-transform:capitalize;">${role}</span>
      </div>
    </div>
    <p class="message">
      ${
        role === "user"
          ? "You can now browse available cars, make bookings, and track your rental history."
          : "You can now list your cars, manage bookings, and track your earnings from the owner dashboard."
      }
    </p>
    <div class="note">
      💡 Keep your login credentials safe. If you did not create this account, please contact us immediately.
    </div>
  `;

  return sendEmail({
    to: email,
    subject: "Welcome to SmartRent — Account Created Successfully",
    html: baseTemplate(content),
  });
};

export const sendPasswordResetOtpEmail = async ({ name, email, otp }) => {
  const content = `
    <p class="greeting">Hi ${name},</p>
    <p class="message">
      We received a request to reset your SmartRent account password. Use the OTP
      below to continue. This OTP is valid for <strong>10 minutes</strong>.
    </p>
    <div class="price-box">
      <div class="label">Password Reset OTP</div>
      <div class="amount" style="letter-spacing:8px;">${otp}</div>
    </div>
    <div class="note">
      If you did not request this reset, you can ignore this email. Your current
      password will remain unchanged.
    </div>
  `;

  return sendEmail({
    to: email,
    subject: "SmartRent Password Reset OTP",
    html: baseTemplate(content),
  });
};

// ─── 2. Booking Status Email (confirmed / cancelled) ──────────────────────────
export const sendBookingStatusEmail = async ({
  userEmail,
  userName,
  status,
  carBrand,
  carModel,
  pickupDate,
  returnDate,
  price,
  location,
  cancellationReason,
  cancellationDetails,
}) => {
  const isConfirmed = status === "confirmed";
  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-PK", {
      weekday: "short",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const noOfDays = Math.ceil(
    (new Date(returnDate) - new Date(pickupDate)) / (1000 * 60 * 60 * 24),
  );

  const content = `
    <p class="greeting">Hi ${userName},</p>
    <p class="message">
      ${
        isConfirmed
          ? `Great news! Your booking for the <strong>${carBrand} ${carModel}</strong> has been <strong style="color:#16a34a;">confirmed</strong> by the owner. Your car will be ready for pickup on the scheduled date.`
          : `We're sorry to inform you that your booking for the <strong>${carBrand} ${carModel}</strong> has been <strong style="color:#dc2626;">cancelled</strong> by the owner. Please browse other available cars.`
      }
    </p>

    <div class="card">
      <div class="card-title">Booking Summary</div>
      <div class="row">
        <span class="row-label">Vehicle</span>
        <span class="row-value">${carBrand} ${carModel}</span>
      </div>
      <div class="row">
        <span class="row-label">Pick-up Location</span>
        <span class="row-value">${location}</span>
      </div>
      <div class="row">
        <span class="row-label">Pick-up Date</span>
        <span class="row-value">${formatDate(pickupDate)}</span>
      </div>
      <div class="row">
        <span class="row-label">Return Date</span>
        <span class="row-value">${formatDate(returnDate)}</span>
      </div>
      <div class="row">
        <span class="row-label">Duration</span>
        <span class="row-value">${noOfDays} ${noOfDays === 1 ? "Day" : "Days"}</span>
      </div>
      <div class="row">
        <span class="row-label">Status</span>
        <span class="row-value">
          <span class="status-badge status-${status}">${statusLabel}</span>
        </span>
      </div>
      ${
        !isConfirmed && cancellationReason
          ? `<div class="row">
              <span class="row-label">Cancellation Reason</span>
              <span class="row-value">${cancellationReason}</span>
            </div>`
          : ""
      }
    </div>

    <div class="price-box">
      <div class="label">Total Rental Price</div>
      <div class="amount">Rs ${Number(price).toLocaleString()}</div>
    </div>

    ${
      isConfirmed
        ? `<div class="note">
          💡 <strong>Payment Note:</strong> Payment is collected offline at the time of vehicle pickup. Please carry your valid CNIC and driving license.
        </div>`
        : `<div class="note">
          💡 If you believe this cancellation was made in error, please contact the owner or our support team.
        </div>`
    }
  `;

  return sendEmail({
    to: userEmail,
    subject: `Booking ${statusLabel} — ${carBrand} ${carModel} | SmartRent`,
    html: baseTemplate(content),
  });
};

// ─── 3. Listing Request Status Email (approved / rejected) ───────────────────
export const sendListingRequestStatusEmail = async ({
  email,
  fullName,
  status,
  carBrand,
  carModel,
  year,
  category,
  pricePerDay,
}) => {
  const isApproved = status === "approved";
  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);

  const content = `
    <p class="greeting">Hi ${fullName},</p>
    <p class="message">
      ${
        isApproved
          ? `Congratulations! Your car listing request for the <strong>${carBrand} ${carModel}</strong> has been <strong style="color:#16a34a;">approved</strong>. Your vehicle is now live on the SmartRent platform and available for booking.`
          : `We regret to inform you that your car listing request for the <strong>${carBrand} ${carModel}</strong> has been <strong style="color:#dc2626;">rejected</strong> by the admin. Please review your submission and try again.`
      }
    </p>

    <div class="card">
      <div class="card-title">Listing Request Details</div>
      <div class="row">
        <span class="row-label">Vehicle</span>
        <span class="row-value">${carBrand} ${carModel}</span>
      </div>
      <div class="row">
        <span class="row-label">Year</span>
        <span class="row-value">${year}</span>
      </div>
      <div class="row">
        <span class="row-label">Category</span>
        <span class="row-value">${category}</span>
      </div>
      <div class="row">
        <span class="row-label">Price Per Day</span>
        <span class="row-value">Rs ${Number(pricePerDay).toLocaleString()}</span>
      </div>
      <div class="row">
        <span class="row-label">Decision</span>
        <span class="row-value">
          <span class="status-badge status-${status}">${statusLabel}</span>
        </span>
      </div>
    </div>

    ${
      isApproved
        ? `<div class="note">
          🎉 Your car is now visible to customers on SmartRent. You will receive booking notifications as customers start reserving your vehicle.
        </div>`
        : `<div class="note">
          💡 Common reasons for rejection include incomplete information, invalid images, or pricing issues. Please ensure all details are accurate before resubmitting.
        </div>`
    }
  `;

  return sendEmail({
    to: email,
    subject: `Car Listing ${statusLabel} — ${carBrand} ${carModel} | SmartRent`,
    html: baseTemplate(content),
  });
};

// ─── 4. New Booking Notification to Owner ────────────────────────────────────
export const sendNewBookingNotificationToOwner = async ({
  ownerEmail,
  ownerName,
  userName,
  userEmail,
  carBrand,
  carModel,
  pickupDate,
  returnDate,
  price,
  location,
}) => {
  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-PK", {
      weekday: "short",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const noOfDays = Math.ceil(
    (new Date(returnDate) - new Date(pickupDate)) / (1000 * 60 * 60 * 24),
  );

  const content = `
    <p class="greeting">Hi ${ownerName},</p>
    <p class="message">
      You have received a new booking request for your <strong>${carBrand} ${carModel}</strong>.
      Please review and confirm or cancel the booking from your dashboard.
    </p>

    <div class="card">
      <div class="card-title">New Booking Request</div>
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
        <span class="row-label">Location</span>
        <span class="row-value">${location}</span>
      </div>
      <div class="row">
        <span class="row-label">Pick-up Date</span>
        <span class="row-value">${formatDate(pickupDate)}</span>
      </div>
      <div class="row">
        <span class="row-label">Return Date</span>
        <span class="row-value">${formatDate(returnDate)}</span>
      </div>
      <div class="row">
        <span class="row-label">Duration</span>
        <span class="row-value">${noOfDays} ${noOfDays === 1 ? "Day" : "Days"}</span>
      </div>
      <div class="row">
        <span class="row-label">Status</span>
        <span class="row-value">
          <span class="status-badge status-pending">Pending</span>
        </span>
      </div>
    </div>

    <div class="price-box">
      <div class="label">Total Earning (if confirmed)</div>
      <div class="amount">Rs ${Number(price).toLocaleString()}</div>
    </div>

    <div class="note">
      💡 Log in to your <strong>Owner Dashboard</strong> to confirm or cancel this booking request.
    </div>
  `;

  return sendEmail({
    to: ownerEmail,
    subject: `New Booking Request — ${carBrand} ${carModel} | SmartRent`,
    html: baseTemplate(content),
  });
};

export const sendSupportTicketEmail = async ({
  adminEmail,
  customerName,
  customerEmail,
  category,
  subject,
  message,
  ticketId,
}) => {
  const content = `
    <p class="greeting">New Customer Support Request</p>
    <p class="message">
      A customer has submitted a rental-period issue through the chatbot and needs help from the admin team.
    </p>

    <div class="card">
      <div class="card-title">Support Ticket Details</div>
      <div class="row">
        <span class="row-label">Ticket ID</span>
        <span class="row-value">${ticketId}</span>
      </div>
      <div class="row">
        <span class="row-label">Customer</span>
        <span class="row-value">${customerName}</span>
      </div>
      <div class="row">
        <span class="row-label">Customer Email</span>
        <span class="row-value">${customerEmail}</span>
      </div>
      <div class="row">
        <span class="row-label">Category</span>
        <span class="row-value">${category}</span>
      </div>
      <div class="row">
        <span class="row-label">Subject</span>
        <span class="row-value">${subject}</span>
      </div>
    </div>

    <div class="note">
      <strong>Customer Message:</strong><br />
      ${message}
    </div>
  `;

  return sendEmail({
    to: adminEmail,
    subject: `Customer Support Ticket ${ticketId} | SmartRent`,
    html: baseTemplate(content),
  });
};
