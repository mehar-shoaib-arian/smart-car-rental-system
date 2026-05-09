// your import section (no changes)
import logo from "./logo.svg";
import gmail_logo from "./gmail_logo.svg";
import facebook_logo from "./facebook_logo.svg";
import instagram_logo from "./instagram_logo.svg";
import twitter_logo from "./twitter_logo.svg";
import menu_icon from "./menu_icon.svg";
import search_icon from "./search_icon.svg";
import close_icon from "./close_icon.svg";
import users_icon from "./users_icon.svg";
import car_icon from "./car_icon.svg";
import location_icon from "./location_icon.svg";
import fuel_icon from "./fuel_icon.svg";
import addIcon from "./addIcon.svg";
import carIcon from "./carIcon.svg";
import carIconColored from "./carIconColored.svg";
import dashboardIcon from "./dashboardIcon.svg";
import dashboardIconColored from "./dashboardIconColored.svg";
import addIconColored from "./addIconColored.svg";
import listIcon from "./listIcon.svg";
import listIconColored from "./listIconColored.svg";
import cautionIconColored from "./cautionIconColored.svg";
import arrow_icon from "./arrow_icon.svg";
import star_icon from "./star_icon.svg";
import check_icon from "./check_icon.svg";
import tick_icon from "./tick_icon.svg";
import delete_icon from "./delete_icon.svg";
import eye_icon from "./eye_icon.svg";
import eye_close_icon from "./eye_close_icon.svg";
import filter_icon from "./filter_icon.svg";
import edit_icon from "./edit_icon.svg";
import calendar_icon_colored from "./calendar_icon_colored.svg";
import location_icon_colored from "./location_icon_colored.svg";
import testimonial_image_1 from "./testimonial_image_1.png";
import testimonial_image_2 from "./testimonial_image_2.png";
import main_car from "./main_car.png";
import banner_car_image from "./banner_car_image.png";
import user_profile from "./user_profile.png";
import upload_icon from "./upload_icon.svg";
import car_image1 from "./car_image1.png";
import car_image2 from "./car_image2.png";
import car_image3 from "./car_image3.png";
import car_image4 from "./car_image4.png";

export const cityList = ["Lahore", "Karachi", "Islamabad", "Multan"];

export const assets = {
  logo,
  gmail_logo,
  facebook_logo,
  instagram_logo,
  twitter_logo,
  menu_icon,
  search_icon,
  close_icon,
  users_icon,
  edit_icon,
  car_icon,
  location_icon,
  fuel_icon,
  addIcon,
  carIcon,
  carIconColored,
  dashboardIcon,
  dashboardIconColored,
  addIconColored,
  listIcon,
  listIconColored,
  cautionIconColored,
  calendar_icon_colored,
  location_icon_colored,
  arrow_icon,
  star_icon,
  check_icon,
  tick_icon,
  delete_icon,
  eye_icon,
  eye_close_icon,
  filter_icon,
  testimonial_image_1,
  testimonial_image_2,
  main_car,
  banner_car_image,
  car_image1,
  upload_icon,
  user_profile,
  car_image2,
  car_image3,
  car_image4,
};

export const menuLinks = [
  { name: "Home", path: "/" },
  { name: "Cars", path: "/cars" },
  { name: "My Bookings", path: "/my-bookings" },
];

export const ownerMenuLinks = [
  {
    name: "Dashboard",
    path: "/owner",
    icon: dashboardIcon,
    coloredIcon: dashboardIconColored,
  },
  {
    name: "Add car",
    path: "/owner/add-car",
    icon: addIcon,
    coloredIcon: addIconColored,
  },
  {
    name: "Manage Cars",
    path: "/owner/manage-cars",
    icon: carIcon,
    coloredIcon: carIconColored,
  },
  {
    name: "Manage Bookings",
    path: "/owner/manage-bookings",
    icon: listIcon,
    coloredIcon: listIconColored,
  },
  {
    name: "Live Tracking",
    path: "/owner/live-tracking",
    icon: location_icon,
    coloredIcon: location_icon_colored,
  },
  {
    name: "Manage Listing Cars",
    path: "/owner/manage-listing-cars",
    icon: listIcon,
    coloredIcon: listIconColored,
  },
  {
    name: "Manage FAQs",
    path: "/owner/manage-faqs",
    icon: listIcon,
    coloredIcon: listIconColored,
  },
  {
    name: "Manage Users",
    path: "/owner/manage-users",
    icon: listIcon,
    coloredIcon: listIconColored,
  },
  {
    name: "Support Tickets",
    path: "/owner/support-tickets",
    icon: listIcon,
    coloredIcon: listIconColored,
  },
  {
    name: "My Profile",
    path: "/owner/profile",
    icon: dashboardIcon,
    coloredIcon: dashboardIconColored,
  },
];

export const dummyUserData = {
  _id: "owner1",
  name: "shoaib",
  email: "admin@pakrentals.pk",
  role: "owner",
  image: user_profile,
};

export const dummyCarData = [
  {
    _id: "1",
    owner: "owner1",
    brand: "Suzuki",
    model: "Cultus",
    image: car_image1,
    year: 2020,
    category: "Hatchback",
    seating_capacity: 4,
    fuel_type: "Petrol",
    transmission: "Manual",
    pricePerDay: 4000,
    location: "Lahore",
    description:
      "Suzuki Cultus is a popular compact hatchback in Pakistan, known for fuel efficiency and low maintenance.",
    isAvaliable: true,
    createdAt: "2025-04-16T07:26:56.215Z",
  },
  {
    _id: "2",
    owner: "owner1",
    brand: "Honda",
    model: "City",
    image: car_image2,
    year: 2022,
    category: "Sedan",
    seating_capacity: 5,
    fuel_type: "Petrol",
    transmission: "Automatic",
    pricePerDay: 6000,
    location: "Karachi",
    description:
      "Honda City is a premium sedan offering comfort and performance, widely rented in urban areas.",
    isAvaliable: true,
    createdAt: "2025-04-16T08:33:57.993Z",
  },
  {
    _id: "3",
    owner: "owner1",
    brand: "Suzuki ",
    model: "Wagon R",
    image: car_image3,
    year: 2023,
    category: "Sedan",
    seating_capacity: 5,
    fuel_type: "Petrol",
    transmission: "Automatic",
    pricePerDay: 7500,
    location: "Islamabad",
    description:
      "Suzuki Wagon R is a popular compact hatchback in Pakistan, known for its fuel efficiency, affordability, and spacious interior.",
    isAvaliable: true,
    createdAt: "2025-04-16T08:34:39.592Z",
  },
  {
    _id: "4",
    owner: "owner1",
    brand: "Honda",
    model: "Civic",
    image: car_image4,
    year: 2021,
    category: "SUV",
    seating_capacity: 5,
    fuel_type: "Petrol",
    transmission: "Automatic",
    pricePerDay: 9500,
    location: "Multan",
    description:
      "Honda Civic is a stylish and powerful sedan, offering a premium drive, advanced features, and sporty design — perfect for both daily use and long drives.",
    isAvaliable: true,
    createdAt: "2025-04-17T06:15:47.318Z",
  },
];

export const dummyMyBookingsData = [
  {
    _id: "b1",
    car: dummyCarData[0],
    user: "owner1",
    owner: "owner1",
    pickupDate: "2025-06-13T00:00:00.000Z",
    returnDate: "2025-06-14T00:00:00.000Z",
    status: "confirmed",
    price: 4000,
    createdAt: "2025-06-10T12:57:48.244Z",
  },
  {
    _id: "b2",
    car: dummyCarData[1],
    user: "owner1",
    owner: "owner1",
    pickupDate: "2025-06-12T00:00:00.000Z",
    returnDate: "2025-06-12T00:00:00.000Z",
    status: "pending",
    price: 6000,
    createdAt: "2025-06-10T12:57:25.613Z",
  },
  {
    _id: "b3",
    car: dummyCarData[2],
    user: "owner1",
    owner: "owner1",
    pickupDate: "2025-06-11T00:00:00.000Z",
    returnDate: "2025-06-12T00:00:00.000Z",
    status: "pending",
    price: 7500,
    createdAt: "2025-06-10T09:55:06.379Z",
  },
  {
    _id: "b4",
    car: dummyCarData[3],
    user: "owner1",
    owner: "owner1",
    pickupDate: "2025-06-11T00:00:00.000Z",
    returnDate: "2025-06-12T00:00:00.000Z",
    status: "confirmed",
    price: 9500,
    createdAt: "2025-06-10T09:44:25.410Z",
  },
];

export const dummyDashboardData = {
  totalCars: dummyCarData.length,
  totalBookings: dummyMyBookingsData.length,
  pendingBookings: dummyMyBookingsData.filter((b) => b.status === "pending")
    .length,
  completedBookings: dummyMyBookingsData.filter((b) => b.status === "confirmed")
    .length,
  recentBookings: [dummyMyBookingsData[0], dummyMyBookingsData[1]],
  monthlyRevenue: dummyMyBookingsData.reduce(
    (sum, booking) => sum + booking.price,
    0,
  ),
};
