import Booking from "../models/Booking.js";

const calculateNoOfDays = (pickupDate, returnDate) => {
  const picked = new Date(pickupDate);
  const returned = new Date(returnDate);
  const noOfDays = Math.ceil((returned - picked) / (1000 * 60 * 60 * 24));

  if (!Number.isFinite(noOfDays) || noOfDays <= 0) {
    throw new Error("Invalid booking duration.");
  }

  return noOfDays;
};

export const calculateSmartBookingPrice = async ({
  car,
  userId,
  pickupDate,
  returnDate,
}) => {
  const noOfDays = calculateNoOfDays(pickupDate, returnDate);
  const basePrice = Number(car.pricePerDay || 0) * noOfDays;

  const previousBookings = await Booking.countDocuments({
    user: userId,
    status: { $ne: "cancelled" },
  });

  const discountRate =
    previousBookings >= 5 ? 0.15 : previousBookings >= 2 ? 0.1 : 0;
  const discountLabel =
    previousBookings >= 5
      ? "Loyal customer discount"
      : previousBookings >= 2
        ? "Multi-booking discount"
        : "";
  const discountAmount = Math.round(basePrice * discountRate);
  const totalPrice = Math.max(0, basePrice - discountAmount);

  return {
    noOfDays,
    basePrice,
    discountRate,
    discountAmount,
    discountLabel,
    previousBookings,
    totalPrice,
  };
};
