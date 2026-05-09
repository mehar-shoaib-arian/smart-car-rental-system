import React, { useState } from "react";
import { assets } from "../assets/assets";

// City coordinates for fallback display
const CITY_COORDINATES = {
  lahore:     { lat: 31.5204, lng: 74.3587, zoom: 13 },
  karachi:    { lat: 24.8607, lng: 67.0011, zoom: 13 },
  multan:     { lat: 30.1575, lng: 71.5249, zoom: 13 },
  islamabad:  { lat: 33.6844, lng: 73.0479, zoom: 13 },
  rawalpindi: { lat: 33.6007, lng: 73.0679, zoom: 13 },
  peshawar:   { lat: 34.0151, lng: 71.5249, zoom: 13 },
  quetta:     { lat: 30.1798, lng: 66.9750, zoom: 13 },
  faisalabad: { lat: 31.4504, lng: 73.1350, zoom: 13 },
};

const getCityCoords = (location) => {
  if (!location) return null;
  const key = location.trim().toLowerCase();
  return CITY_COORDINATES[key] || null;
};

const LocationMap = ({
  location,
  latitude = null,
  longitude = null,
  height = "260px",
}) => {
  const [mapError, setMapError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;
  const hasApiKey = apiKey && apiKey !== "your_google_maps_api_key";

  const parsedLatitude = Number(latitude);
  const parsedLongitude = Number(longitude);
  const hasRealCoordinates =
    Number.isFinite(parsedLatitude) && Number.isFinite(parsedLongitude);
  const coords = hasRealCoordinates
    ? { lat: parsedLatitude, lng: parsedLongitude, zoom: 15 }
    : getCityCoords(location);
  const displayLocation = location || "Pakistan";

  // ── Build embed URL ─────────────────────────────────────────────────────────
  const buildMapUrl = () => {
    if (hasApiKey) {
      // Use Places API embed with API key
      const query = encodeURIComponent(
        coords
          ? `${coords.lat},${coords.lng}`
          : `${displayLocation}, Pakistan`
      );
      return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${query}&zoom=${coords?.zoom || 13}`;
    }

    // Fallback: search by pickup location name so the map shows the city/area
    // instead of a blank coordinate-only view.
    const query = encodeURIComponent(`${displayLocation}, Pakistan`);
    return `https://www.google.com/maps?q=${query}&z=${coords?.zoom || 13}&output=embed`;
  };

  // ── Static map fallback (when iframe fails or no connection) ────────────────
  const StaticFallback = () => (
    <div
      className="w-full rounded-xl overflow-hidden border border-borderColor bg-gray-50"
      style={{ height }}
    >
      <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400 px-6 text-center">
        {/* Map pin SVG */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-12 h-12 text-blue-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>

        <div>
          <p className="text-sm font-semibold text-gray-600">{displayLocation}</p>
          <p className="text-xs text-gray-400 mt-1">
            {hasRealCoordinates ? "Exact coordinates" : "Pakistan"}
          </p>
        </div>

        {coords && (
          <p className="text-xs text-gray-300 font-mono">
            {coords.lat.toFixed(4)}°N, {coords.lng.toFixed(4)}°E
          </p>
        )}

        <a
          href={`https://www.google.com/maps/search/${encodeURIComponent(
            coords ? `${coords.lat},${coords.lng}` : `${displayLocation}, Pakistan`,
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-all cursor-pointer mt-1"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
          Open in Google Maps
        </a>
      </div>
    </div>
  );

  // ── If map failed to load, show static fallback ─────────────────────────────
  if (mapError) {
    return <StaticFallback />;
  }

  return (
    <div className="w-full">
      {/* Map Container */}
      <div
        className="relative w-full rounded-xl overflow-hidden border border-borderColor shadow-sm"
        style={{ height }}
      >
        {/* Loading skeleton */}
        {!loaded && (
          <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-8 h-8 animate-bounce text-blue-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <p className="text-xs">Loading map...</p>
            </div>
          </div>
        )}

        {/* Google Maps iframe */}
        <iframe
          title={`Map of ${displayLocation}`}
          src={buildMapUrl()}
          width="100%"
          height="100%"
          style={{ border: 0, display: "block" }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          onLoad={() => setLoaded(true)}
          onError={() => setMapError(true)}
        />

        {loaded && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative -translate-y-4 rounded-full bg-white/95 p-2 shadow-lg ring-2 ring-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-7 w-7 text-blue-600"
              >
                <path d="M5.25 11.25A2.25 2.25 0 017.5 9h9a2.25 2.25 0 012.25 2.25V15a.75.75 0 01-.75.75h-.444a2.25 2.25 0 01-4.112 0H10.56a2.25 2.25 0 01-4.112 0H6A.75.75 0 015.25 15v-3.75zm1.82-3.249L8.1 5.94A2.25 2.25 0 0110.122 4.5h3.756A2.25 2.25 0 0115.9 5.94l1.03 2.061H7.07zM8.25 16.5a.75.75 0 100 1.5.75.75 0 000-1.5zm7.5 0a.75.75 0 100 1.5.75.75 0 000-1.5z" />
              </svg>
              <div className="absolute left-1/2 top-full h-3 w-3 -translate-x-1/2 -translate-y-1 rotate-45 bg-white shadow-sm" />
            </div>
          </div>
        )}
      </div>

      {/* Location Label Bar */}
      <div className="flex items-center justify-between mt-2 px-1">
        <div className="flex items-center gap-1.5">
          <img
            src={assets.location_icon_colored}
            alt="location"
            className="w-4 h-4"
          />
          <span className="text-sm font-medium text-gray-700">
            {displayLocation}
          </span>
          <span className="text-xs text-gray-400">· Pakistan</span>
        </div>

        {/* Open in Google Maps link */}
        <a
          href={`https://www.google.com/maps/search/${encodeURIComponent(
            coords ? `${coords.lat},${coords.lng}` : `${displayLocation}, Pakistan`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 transition-all cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-3 h-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
          Open in Google Maps
        </a>
      </div>

    </div>
  );
};

export default LocationMap;
