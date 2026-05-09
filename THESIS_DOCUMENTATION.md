# Smart Car Rental System

## 1. Project Overview

**Project Title:** Smart Car Rental System

**Description:**
A full-stack car rental platform that enables users to browse and book vehicles, while owners can manage their fleet through a dedicated dashboard. The system supports authentication, online payments, listing requests, chat-based support, and administrative controls.

**Main Goals:**
- Provide a modern digital platform for car rental bookings.
- Enable users to search, filter, and book cars securely.
- Give car owners tools to manage cars, bookings, listing approvals, and live tracking.
- Integrate secure payments and support communication.

## 2. Problem Statement

Traditional car rental systems often rely on manual processes, paper-based agreements, and limited visibility into vehicle availability. This project addresses these issues by creating a responsive web system that automates booking, payment, listing management, and support workflow.

## 3. Objectives

- Build a responsive user-facing website for browsing and booking cars.
- Implement secure user authentication with role-based access.
- Develop an owner dashboard for car and booking management.
- Integrate online payment processing via JazzCash.
- Provide a chatbot/support ticket system for customer assistance.
- Build a scalable backend API with MongoDB and Express.

## 4. Scope

- Customer user role: browse cars, book cars, list own car requests, view bookings.
- Owner role: manage own cars, approve/reject listing requests, view bookings, track overdue rentals.
- Admin role: manage owners, users, and role changes.
- Chatbot support for general questions, issue reporting, and ticket messaging.
- Online payment support with transaction tracking.

## 5. Technology Stack

- Frontend: React, Vite, Tailwind CSS, React Router, Axios
- Backend: Node.js, Express, MongoDB, Mongoose
- Authentication: JWT tokens
- File upload: Multer
- Payment: JazzCash integration
- Email: Nodemailer
- Hosting / Deployment: Vite frontend and Express backend

## 6. System Architecture

### 6.1 Frontend architecture

The frontend is implemented in `client/` using React and Vite.
- `App.jsx`: main route definitions and layout logic.
- `src/context/AppContext.jsx`: shared application state, authentication, Axios setup, and common methods.
- `src/components`: reusable UI components such as `Navbar`, `Chatbot`, `Login`, and owner sidebar.
- `src/pages`: route pages for users and owner dashboard.

### 6.2 Backend architecture

The backend is implemented in `server/` using Express and MongoDB.
- `server.js`: entry point, database connection, route mounting, and overdue cron startup.
- `configs/db.js`: MongoDB connection.
- `middleware/auth.js`: JWT verification and role-based access control.
- `routes/`: REST endpoints for users, owners, cars, bookings, payments, chatbot, feedback, newsletter, and overdue logic.
- `controllers/`: application logic for each feature.
- `models/`: database schemas for Users, Cars, Bookings, Listing Requests, Payments, Support Tickets, and other entities.

## 7. User Roles

- **Guest / Visitor**: browse cars and view general content.
- **User**: register, login, book cars, submit listing requests, report issues, and access booking history.
- **Owner**: manage vehicle listings, bookings, live tracking, support tickets, and profile.
- **Admin**: approve owner/admin roles, manage users, and oversee listing requests.

## 8. Key Features

### 8.1 Authentication

- JWT-based login and registration via `/api/user/register` and `/api/user/login`.
- Password reset support with OTP flows.
- Role-based authorization for protected APIs.

### 8.2 Car Browsing and Search

- Public car listing endpoint: `/api/cars`.
- Detailed car view: `/api/cars/:id`.
- Search and filter on the frontend via the `Cars` page.

### 8.3 Booking Management

- Availability check endpoint: `/api/bookings/check-availability`.
- Booking creation endpoint: `/api/bookings/create`.
- User booking history: `/api/bookings/user`.
- Owner booking overview: `/api/bookings/owner`.
- Status updates via `/api/bookings/change-status`.

### 8.4 Online Payments

- JazzCash payment integration in `server/routes/paymentRoutes.js`.
- Payment attempts stored in `PaymentAttempt` model.
- Booking creation from successful payment callbacks.
- Payment status handling for success, pending, failed, and cancelled states.

### 8.5 Listing Requests

- Users can submit car listing requests through `ListYourCar.jsx`.
- Listing requests are stored in `ListingRequest` and reviewed by owners/admins.
- Owner route: `/api/owner/listing-requests`.

### 8.6 Live Tracking

- Owner route supports live tracking of car bookings.
- Car model stores simulated location updates and tracking state.
- Booking and owner pages display live tracking data.

### 8.7 Chatbot / Support Ticket System

- Chatbot endpoint: `/api/chatbot/ask` with keyword-based responses.
- Support ticket creation via `/api/chatbot/report-issue`.
- Ticket replies via `/api/chatbot/tickets/:ticketId/messages`.
- Owner support ticket management via `/api/owner/support-tickets`.

### 8.8 Overdue Booking Alerts

- Overdue cron job started by `startOverdueCron()` in `server.js`.
- Bookings flagged when pickup/return windows are missed.
- Overdue alerts and tracking handled in the booking model and controller.

## 9. Data Model Summary

### 9.1 User
- `name`, `email`, `password`, `role` (`admin`, `owner`, `user`)
- `image`, password reset OTP fields

### 9.2 Car
- `owner`, `brand`, `model`, `image`, `year`, `category`, `seating_capacity`, `fuel_type`, `transmission`, `pricePerDay`, `location`
- `latitude`, `longitude`, availability trackers, booking lock, live tracking fields

### 9.3 Booking
- `car`, `user`, `owner`, `pickupDate`, `returnDate`, `status`
- `price`, `paymentMethod`, `paymentProvider`, JazzCash transaction fields
- `onlinePaymentStatus`, cancellation metadata, overdue status tracking

### 9.4 ListingRequest
- User-submitted car listing metadata and review status
- `submittedBy`, `fullName`, `email`, `phone`, `cnic`, `brand`, `model`, `year`, `category`, `transmission`, `fuel_type`, `seating_capacity`, `pricePerDay`, `location`, `description`, `image`

### 9.5 PaymentAttempt
- Tracks JazzCash checkout flow and callback results
- `txnRefNo`, `billReference`, `status`, `amount`, associated booking

### 9.6 SupportTicket
- User issue tickets with conversation messages
- `category`, `subject`, `message`, `messages`, `status`, `lastMessageAt`

## 10. API Endpoints

### 10.1 User API
- `POST /api/user/register`
- `POST /api/user/login`
- `POST /api/user/forgot-password`
- `POST /api/user/reset-password`
- `GET /api/user/data`
- `GET /api/user/cars`

### 10.2 Owner API
- `POST /api/owner/change-role`
- `POST /api/owner/change-role-admin`
- `POST /api/owner/add-car`
- `GET /api/owner/cars`
- `POST /api/owner/toggle-car`
- `POST /api/owner/delete-car`
- `GET /api/owner/dashboard`
- `PUT /api/owner/update-profile`
- `GET /api/owner/chart-data`
- `GET /api/owner/all-users`
- `GET /api/owner/support-tickets`
- `PATCH /api/owner/support-tickets/:ticketId`
- `PATCH /api/owner/bookings/:bookingId/live-location`
- `POST /api/owner/live-tracking/:bookingId/start`
- `POST /api/owner/live-tracking/:bookingId/stop`
- `POST /api/owner/support-tickets/:ticketId/reply`

### 10.3 Car API
- `GET /api/cars`
- `GET /api/cars/:id`

### 10.4 Booking API
- `POST /api/bookings/check-availability`
- `POST /api/bookings/create`
- `GET /api/bookings/user`
- `GET /api/bookings/owner`
- `POST /api/bookings/change-status`

### 10.5 Chatbot API
- `POST /api/chatbot/ask`
- `POST /api/chatbot/report-issue`
- `POST /api/chatbot/tickets/:ticketId/messages`
- `GET /api/chatbot/my-tickets`

### 10.6 Payment API
- `POST /api/payment/jazzcash/initiate`
- `POST /api/payment/jazzcash/callback`
- `POST /api/payment/webhook`

### 10.7 Additional APIs
- Feedback, newsletter, overdue support endpoints are also included in the backend.

## 11. Deployment and Setup

### 11.1 Environment Variables

Server environment variables include:
- `MONGODB_URI`
- `JWT_SECRET`
- `CLIENT_URL`
- `SERVER_URL`
- `JAZZCASH_MERCHANT_ID`
- `JAZZCASH_PASSWORD`
- `JAZZCASH_INTEGRITY_SALT`
- `JAZZCASH_RETURN_URL`
- `EMAIL_USER`, `EMAIL_PASSWORD`, `SUPPORT_EMAIL`
- `VITE_BASE_URL` for frontend if using custom backend URL

### 11.2 Running Locally

Frontend:
- `cd client`
- `npm install`
- `npm run dev`

Backend:
- `cd server`
- `npm install`
- `npm run server`

### 11.3 Production Notes
- Build frontend with `npm run build` in `client/`.
- Serve frontend from a static host or integrate with backend hosting.
- Ensure authenticated requests use the deployed backend URL.

## 12. Testing and Quality Assurance

- Functional behavior is validated through the React UI and server responses.
- Toast notifications provide feedback for API success or failure.
- Booking lock and payment status checks reduce race conditions.
- Role-based security is enforced by `middleware/auth.js`.

## 13. Future Improvements

- Add unit and integration tests for frontend and backend.
- Expand chatbot using an AI/NLP engine.
- Add real GPS-based tracking instead of simulation.
- Add more payment providers and currency support.
- Improve admin dashboard with analytics and moderation tools.
- Add multilingual support and accessibility enhancements.

## 14. Appendix

### Project structure

- `client/`: React frontend application
- `server/`: Express backend API
- `server/models/`: MongoDB schema definitions
- `server/controllers/`: business logic for routes
- `server/routes/`: route definitions and middleware attachments
- `server/configs/`: database and email configuration
- `client/src/components/`: reusable UI components
- `client/src/pages/`: page-level route components
- `client/src/context/`: app-level global state and API setup

### Key files
- `server/server.js`
- `server/middleware/auth.js`
- `client/src/App.jsx`
- `client/src/context/AppContext.jsx`
- `client/src/pages/ListYourCar.jsx`
- `client/src/components/Chatbot.jsx`

---

This document can be used as a base for the thesis documentation, with additional sections added for literature review, detailed methodology, test results, and implementation challenges.
