import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const formatDateTime = (value) => {
  if (!value) return "Not available";
  return new Date(value).toLocaleString("en-PK", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDate = (value) => {
  if (!value) return "Not available";
  return new Date(value).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatCoordinate = (value) => {
  if (value === null || value === undefined || value === "") return "Not available";
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toFixed(6) : "Not available";
};

export const generateLiveTrackingPDF = (booking) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const blue = [5, 88, 254];
  const textDark = [30, 41, 59];
  const textMid = [100, 116, 139];
  const borderGray = [226, 232, 240];
  const lightBlue = [239, 246, 255];
  const car = booking.car || {};
  const user = booking.user || {};

  const reportId = booking._id
    ? String(booking._id).slice(-8).toUpperCase()
    : "N/A";
  const carName = `${car.brand || ""} ${car.model || ""}`.trim() || "N/A";
  const isTrackingActive = Boolean(car.trackingSimulationActive);
  const latitude = car.currentLatitude ?? car.latitude ?? null;
  const longitude = car.currentLongitude ?? car.longitude ?? null;
  const latitudeText = formatCoordinate(latitude);
  const longitudeText = formatCoordinate(longitude);
  const mapsLink =
    latitudeText !== "Not available" && longitudeText !== "Not available"
      ? `https://www.google.com/maps?q=${latitudeText},${longitudeText}`
      : "Not available";

  doc.setFillColor(...blue);
  doc.rect(0, 0, pageWidth, 42, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("SmartRent", 15, 18);
  doc.setFontSize(11);
  doc.text("LIVE TRACKING REPORT", pageWidth - 15, 18, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(`Report ID: #${reportId}`, pageWidth - 15, 27, { align: "right" });
  doc.text(`Generated: ${formatDateTime(new Date())}`, pageWidth - 15, 33, {
    align: "right",
  });

  let y = 56;
  doc.setTextColor(...textDark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(carName, 15, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...textMid);
  doc.text(
    `Customer: ${user.name || "Unknown"}${user.email ? ` | ${user.email}` : ""}`,
    15,
    y + 7,
  );
  doc.text(
    `Rental: ${formatDate(booking.pickupDate)} to ${formatDate(booking.returnDate)}`,
    15,
    y + 14,
  );

  y += 28;
  autoTable(doc, {
    startY: y,
    margin: { left: 15, right: 15 },
    head: [["Tracking Field", "Details"]],
    body: [
      ["Tracking Status", isTrackingActive ? "Active" : "Stopped"],
      ["Pickup City", car.location || "Not available"],
      ["Current Latitude", latitudeText],
      ["Current Longitude", longitudeText],
      ["Last Location Update", formatDateTime(car.liveLocationUpdatedAt)],
      ["Google Maps Location", mapsLink],
    ],
    headStyles: {
      fillColor: blue,
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 9,
      textColor: textDark,
    },
    alternateRowStyles: {
      fillColor: lightBlue,
    },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: "bold", textColor: textMid },
      1: { cellWidth: "auto" },
    },
    styles: {
      cellPadding: 4,
      lineColor: borderGray,
      lineWidth: 0.2,
    },
  });

  y = doc.lastAutoTable.finalY + 14;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...blue);
  doc.text("Monitoring Note", 15, y);

  y += 7;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(...borderGray);
  doc.roundedRect(15, y, pageWidth - 30, 34, 2, 2, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.8);
  doc.setTextColor(...textDark);
  doc.text(
    doc.splitTextToSize(
      "This report records the latest vehicle tracking information available in the SmartRent system at the time of generation. Admin and owner users can use this report as proof of the car's monitored location during an active rental period.",
      pageWidth - 42,
    ),
    21,
    y + 9,
  );

  doc.setFillColor(...blue);
  doc.rect(0, pageHeight - 20, pageWidth, 20, "F");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text("SmartRent - Smart Car Rental System", pageWidth / 2, pageHeight - 12, {
    align: "center",
  });
  doc.setTextColor(200, 220, 255);
  doc.text(
    "+92 300 8143370 | mshoaib6307181@gmail.com",
    pageWidth / 2,
    pageHeight - 6,
    { align: "center" },
  );

  doc.save(`SmartRent_Live_Tracking_Report_${reportId}.pdf`);
};
