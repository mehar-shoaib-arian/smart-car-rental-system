export const isAlphabeticName = (value) =>
  /^[A-Za-z ]{2,50}$/.test(String(value || "").trim());

export const isAlphabeticCity = (value) =>
  /^[A-Za-z ]{2,50}$/.test(String(value || "").trim());

export const isGmailAddress = (value) =>
  /^[A-Za-z0-9._%+-]+@gmail\.com$/i.test(String(value || "").trim());

export const isAlphanumericPassword = (value) =>
  /^[A-Za-z0-9]{6,}$/.test(String(value || ""));

export const isVehicleText = (value) =>
  /^[A-Za-z0-9 .-]{2,50}$/.test(String(value || "").trim());

export const isSafeText = (value, min = 2, max = 500) => {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length >= min && text.length <= max;
};

export const hasAlphabeticCharacter = (value) =>
  /[A-Za-z]/.test(String(value || ""));

export const isKeywordList = (value) =>
  (Array.isArray(value) ? value : String(value || "").split(","))
    .map((keyword) => String(keyword).trim())
    .filter(Boolean)
    .every((keyword) => /^[A-Za-z][A-Za-z0-9 -]{1,39}$/.test(keyword));

export const isValidBookingDateRange = (pickupDate, returnDate) => {
  const pickup = new Date(pickupDate);
  const dropoff = new Date(returnDate);
  return (
    pickupDate &&
    returnDate &&
    !Number.isNaN(pickup.getTime()) &&
    !Number.isNaN(dropoff.getTime()) &&
    dropoff > pickup
  );
};
