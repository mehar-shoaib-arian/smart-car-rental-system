import { assets } from "../assets/assets";

export const getFallbackCarImage = () => assets.car_image4;

const brokenImageNames = ["car_image4_8peirYYK1.png"];

export const getCarImageSrc = (imageUrl) => {
  const fallbackImage = getFallbackCarImage();
  const url = String(imageUrl || "").trim();

  if (!url) return fallbackImage;

  const isKnownBrokenImage = brokenImageNames.some((name) => url.includes(name));

  return isKnownBrokenImage ? fallbackImage : url;
};

export const handleCarImageError = (event) => {
  const fallbackImage = getFallbackCarImage();

  if (!event?.currentTarget || !fallbackImage) return;

  if (event.currentTarget.dataset.fallbackApplied === "true") return;

  event.currentTarget.dataset.fallbackApplied = "true";
  event.currentTarget.src = fallbackImage;
};
