import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatCurrency = (amount, currency = "Rs") => {
  return `${currency} ${Number(amount).toLocaleString()}`;
};

const buildCancellationReason = (booking) => {
  const storedReason = String(
    booking.cancellationReason || booking.cancellationDetails || "",
  ).trim();

  if (storedReason) {
    return storedReason;
  }

  if (booking.cancelledByRole === "user") {
    return "Cancelled by customer before confirmation.";
  }

  return "Cancelled by owner/admin due to vehicle availability or other operational constraints. Please check alternative cars for the same dates.";
};

export const generateBookingPDF = (booking, currency = "Rs") => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // ── Colors ──────────────────────────────────────────────────────────────────
  const blue = [5, 88, 254];

  const white = [255, 255, 255];
  const lightGray = [248, 250, 255];
  const borderGray = [226, 232, 240];
  const textDark = [30, 30, 50];
  const textMid = [80, 80, 100];
  const textLight = [150, 150, 170];
  const green = [22, 163, 74];
  const yellow = [202, 138, 4];
  const red = [220, 38, 38];

  // ── Header Background ────────────────────────────────────────────────────────
  doc.setFillColor(...blue);
  doc.rect(0, 0, pageWidth, 48, "F");

  // ── Logo / Brand ─────────────────────────────────────────────────────────────
  doc.setFontSize(22);
  doc.setTextColor(...white);
  doc.setFont("helvetica", "bold");
  doc.text("SmartRent", 15, 20);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 220, 255);
  doc.text("Smart Car Rental System", 15, 27);

  // ── Receipt Label ─────────────────────────────────────────────────────────────
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...white);
  doc.text("BOOKING RECEIPT", pageWidth - 15, 18, { align: "right" });

  // ── Booking ID & Date ─────────────────────────────────────────────────────────
  const bookingId = booking._id
    ? `#${String(booking._id).slice(-8).toUpperCase()}`
    : "#N/A";
  const bookedOn = formatDate(booking.createdAt || new Date().toISOString());

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 220, 255);
  doc.text(`Booking ID: ${bookingId}`, pageWidth - 15, 27, { align: "right" });
  doc.text(`Issued: ${bookedOn}`, pageWidth - 15, 33, { align: "right" });

  // ── Status Badge ──────────────────────────────────────────────────────────────
  const status = (booking.status || "pending").toLowerCase();
  const statusText = status.charAt(0).toUpperCase() + status.slice(1);
  const statusColor =
    status === "confirmed" ? green : status === "cancelled" ? red : yellow;

  doc.setFillColor(...white);
  doc.roundedRect(pageWidth - 52, 36, 37, 8, 2, 2, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...statusColor);
  doc.text(statusText, pageWidth - 33.5, 41.5, { align: "center" });

  // ── Section: Car Details ──────────────────────────────────────────────────────
  let y = 58;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...blue);
  doc.text("VEHICLE DETAILS", 15, y);

  doc.setDrawColor(...borderGray);
  doc.setLineWidth(0.3);
  doc.line(15, y + 2, pageWidth - 15, y + 2);

  y += 8;
  doc.setFillColor(...lightGray);
  doc.roundedRect(15, y, pageWidth - 30, 36, 3, 3, "F");

  // Car info left column
  const car = booking.car || {};
  const carName = `${car.brand || ""} ${car.model || ""}`.trim() || "N/A";

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...textDark);
  doc.text(carName, 22, y + 10);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textMid);
  doc.text(`${car.category || "—"}  ·  ${car.year || "—"}`, 22, y + 17);

  // Car specs row
  const specs = [
    ["Fuel Type", car.fuel_type || "—"],
    ["Transmission", car.transmission || "—"],
    ["Seats", car.seating_capacity ? `${car.seating_capacity} Seats` : "—"],
    ["Location", car.location || "—"],
  ];

  let sx = 22;
  specs.forEach(([label, value]) => {
    doc.setFontSize(7.5);
    doc.setTextColor(...textLight);
    doc.setFont("helvetica", "normal");
    doc.text(label, sx, y + 25);

    doc.setFontSize(8.5);
    doc.setTextColor(...textDark);
    doc.setFont("helvetica", "bold");
    doc.text(value, sx, y + 31);
    sx += 44;
  });

  // ── Section: Rental Period ────────────────────────────────────────────────────
  y += 44;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...blue);
  doc.text("RENTAL PERIOD", 15, y);
  doc.setDrawColor(...borderGray);
  doc.line(15, y + 2, pageWidth - 15, y + 2);

  y += 7;

  autoTable(doc, {
    startY: y,
    margin: { left: 15, right: 15 },
    head: [["Field", "Details"]],
    body: [
      ["Pick-up Date", formatDate(booking.pickupDate)],
      ["Return Date", formatDate(booking.returnDate)],
      [
        "Duration",
        (() => {
          if (!booking.pickupDate || !booking.returnDate) return "—";
          const days = Math.ceil(
            (new Date(booking.returnDate) - new Date(booking.pickupDate)) /
              (1000 * 60 * 60 * 24),
          );
          return `${days} ${days === 1 ? "Day" : "Days"}`;
        })(),
      ],
      ["Pick-up Location", booking.pickupLocation || car.location || "—"],
    ],
    headStyles: {
      fillColor: blue,
      textColor: white,
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: textDark,
    },
    alternateRowStyles: {
      fillColor: lightGray,
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 60, textColor: textMid },
      1: { cellWidth: "auto" },
    },
    styles: {
      cellPadding: 4,
      lineColor: borderGray,
      lineWidth: 0.2,
    },
  });

  // ── Section: Price Summary ────────────────────────────────────────────────────
  y = doc.lastAutoTable.finalY + 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...blue);
  doc.text("PRICE SUMMARY", 15, y);
  doc.setDrawColor(...borderGray);
  doc.line(15, y + 2, pageWidth - 15, y + 2);

  y += 7;

  const noOfDays = (() => {
    if (!booking.pickupDate || !booking.returnDate) return 1;
    return Math.ceil(
      (new Date(booking.returnDate) - new Date(booking.pickupDate)) /
        (1000 * 60 * 60 * 24),
    );
  })();

  const pricePerDay = car.pricePerDay || 0;
  const totalPrice = booking.price || pricePerDay * noOfDays;
  const basePrice = booking.basePrice || pricePerDay * noOfDays;
  const discountAmount = Number(booking.discountAmount || 0);
  const priceRows = [
    [
      `${carName} Rental`,
      formatCurrency(pricePerDay, currency) + "/day",
      `${noOfDays}`,
      formatCurrency(basePrice, currency),
    ],
  ];

  if (discountAmount > 0) {
    priceRows.push([
      booking.discountLabel || "Smart discount",
      "",
      "",
      `-${formatCurrency(discountAmount, currency)}`,
    ]);
  }

  autoTable(doc, {
    startY: y,
    margin: { left: 15, right: 15 },
    head: [["Description", "Rate", "Days", "Amount"]],
    body: priceRows,
    foot: [
      [
        {
          content: "TOTAL PAYABLE",
          colSpan: 3,
          styles: { fontStyle: "bold", fontSize: 10 },
        },
        {
          content: formatCurrency(totalPrice, currency),
          styles: { fontStyle: "bold", fontSize: 10, textColor: blue },
        },
      ],
    ],
    headStyles: {
      fillColor: blue,
      textColor: white,
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: textDark,
    },
    footStyles: {
      fillColor: lightGray,
      textColor: textDark,
      lineWidth: 0.3,
      lineColor: borderGray,
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255],
    },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { cellWidth: 40, halign: "center" },
      2: { cellWidth: 20, halign: "center" },
      3: { cellWidth: 40, halign: "right", fontStyle: "bold" },
    },
    styles: {
      cellPadding: 4,
      lineColor: borderGray,
      lineWidth: 0.2,
    },
  });

  // ── Payment Note ──────────────────────────────────────────────────────────────
  y = doc.lastAutoTable.finalY + 10;

  const noteText =
    status === "cancelled"
      ? buildCancellationReason(booking)
      : "Payment is collected offline (cash / bank transfer) at the time of vehicle pickup. No online payment required.";
  const noteTitle =
    status === "cancelled" ? "Cancellation Reason:" : "Payment Note:";
  const noteFillColor =
    status === "cancelled" ? [254, 242, 242] : [255, 251, 235];
  const noteBorderColor =
    status === "cancelled" ? [220, 38, 38] : [245, 158, 11];
  const noteHeight = status === "cancelled" ? 22 : 14;

  doc.setFillColor(...noteFillColor);
  doc.setDrawColor(...noteBorderColor);
  doc.setLineWidth(0.4);
  doc.roundedRect(15, y, pageWidth - 30, noteHeight, 2, 2, "FD");

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(120, 53, 15);
  doc.text(noteTitle, 20, y + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 53, 15);
  doc.text(doc.splitTextToSize(noteText, pageWidth - 42), 20, y + 10.5);

  // ── Terms ─────────────────────────────────────────────────────────────────────
  y += noteHeight + 8;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...textMid);
  doc.text("Terms & Conditions", 15, y);

  y += 5;
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textLight);

  const terms = [
    "• Valid CNIC and driving license are required at vehicle pickup.",
    "• The renter is responsible for fuel, traffic fines, and any damage during the rental period.",
    "• Pending bookings can be cancelled by the renter from 'My Bookings'.",
    "• For confirmed bookings, contact the owner directly to make changes.",
    "• SmartRent is not responsible for disputes between renters and owners.",
  ];

  terms.forEach((term) => {
    doc.text(term, 15, y);
    y += 5;
  });

  // ── Footer ────────────────────────────────────────────────────────────────────
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFillColor(...blue);
  doc.rect(0, pageHeight - 22, pageWidth, 22, "F");

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...white);
  doc.text(
    "SmartRent — Smart Car Rental System",
    pageWidth / 2,
    pageHeight - 14,
    { align: "center" },
  );
  doc.setTextColor(180, 210, 255);
  doc.text(
    "4567 Luxury Drive, Mailsi, Pakistan  |  +92 300 8143370  |  mshoaib6307181@gmail.com",
    pageWidth / 2,
    pageHeight - 8,
    { align: "center" },
  );

  // ── Watermark for cancelled bookings ─────────────────────────────────────────
  if (status === "cancelled") {
    doc.setFontSize(60);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(220, 38, 38);
    doc.setGState(new doc.GState({ opacity: 0.08 }));
    doc.text("CANCELLED", pageWidth / 2, 160, {
      align: "center",
      angle: 35,
    });
    doc.setGState(new doc.GState({ opacity: 1 }));
  }

  // ── Save ──────────────────────────────────────────────────────────────────────
  const fileName = `SmartRent_Receipt_${bookingId.replace("#", "")}.pdf`;
  doc.save(fileName);
};
