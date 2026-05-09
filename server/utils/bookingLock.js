import crypto from "crypto";
import Car from "../models/Car.js";

const BOOKING_LOCK_TTL_MS = 15 * 1000;

export const acquireCarBookingLock = async (carId) => {
  const token = crypto.randomUUID();
  const now = new Date();
  const lockUntil = new Date(now.getTime() + BOOKING_LOCK_TTL_MS);

  const lockedCar = await Car.findOneAndUpdate(
    {
      _id: carId,
      $or: [{ bookingLockUntil: null }, { bookingLockUntil: { $lte: now } }],
    },
    {
      $set: {
        bookingLockUntil: lockUntil,
        bookingLockToken: token,
      },
    },
    { new: true },
  );

  if (!lockedCar) {
    const error = new Error(
      "This car is being booked right now. Please try again in a moment.",
    );
    error.statusCode = 409;
    throw error;
  }

  return { token, lockUntil };
};

export const releaseCarBookingLock = async (carId, token) => {
  if (!carId || !token) return;

  await Car.updateOne(
    { _id: carId, bookingLockToken: token },
    {
      $set: {
        bookingLockUntil: null,
        bookingLockToken: null,
      },
    },
  );
};
