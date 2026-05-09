import React, { useState, useEffect } from "react";
import { assets } from "../../assets/assets";
import Title from "../../components/owner/Title";
import { useAppContext } from "../../context/contextStore";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { getCarImageSrc, handleCarImageError } from "../../utils/imageFallback";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// ── Custom Tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, currency }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-borderColor rounded-xl shadow-lg p-3 text-sm">
        <p className="font-semibold text-gray-700 mb-2">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} style={{ color: entry.color }} className="text-xs">
            {entry.name === "Revenue"
              ? `Revenue: ${currency}${Number(entry.value).toLocaleString()}`
              : `Bookings: ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const { axios, currency, setShowLogin } = useAppContext();
  const navigate = useNavigate();

  const getAuthHeaders = () => {
    const token = sessionStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const [data, setData] = useState({
    totalCars: 0,
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    recentBookings: [],
    monthlyRevenue: 0,
    smartInsights: {
      topBookedCar: null,
      topRevenueCar: null,
      topCity: null,
    },
  });

  const [chartData, setChartData] = useState([]);
  const [chartType, setChartType] = useState("bookings"); // "bookings" | "revenue" | "both"
  const [chartLoading, setChartLoading] = useState(true);

  const dashboardCards = [
    {
      title: "Total Cars",
      value: data.totalCars,
      icon: assets.carIconColored,
      bg: "bg-blue-50",
      color: "text-blue-600",
    },
    {
      title: "Total Bookings",
      value: data.totalBookings,
      icon: assets.listIconColored,
      bg: "bg-purple-50",
      color: "text-purple-600",
    },
    {
      title: "Pending",
      value: data.pendingBookings,
      icon: assets.cautionIconColored,
      bg: "bg-yellow-50",
      color: "text-yellow-600",
    },
    {
      title: "Confirmed",
      value: data.completedBookings,
      icon: assets.listIconColored,
      bg: "bg-green-50",
      color: "text-green-600",
    },
  ];

  // Fetch dashboard stats
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: response } = await axios.get("/api/owner/dashboard", {
          headers: getAuthHeaders(),
        });

        if (response.success) {
          setData(
            response.dashboardData ?? {
              totalCars: 0,
              totalBookings: 0,
              pendingBookings: 0,
              completedBookings: 0,
              recentBookings: [],
              monthlyRevenue: 0,
            },
          );
        } else {
          console.error(response.message);
        }
      } catch (error) {
        console.error("Error fetching dashboard:", error);
        if (error.response?.status === 401) {
          toast.error("Please login first");
          setShowLogin(true);
          navigate("/", { replace: true });
        }
      }
    };

    fetchDashboardData();
  }, [axios, navigate, setShowLogin]);

  // Fetch chart data
  useEffect(() => {
    const fetchChartData = async () => {
      setChartLoading(true);
      try {
        const { data: response } = await axios.get("/api/owner/chart-data", {
          headers: getAuthHeaders(),
        });
        if (response.success) {
          setChartData(response.chartData);
        }
      } catch (error) {
        console.error("Error fetching chart data:", error);
      } finally {
        setChartLoading(false);
      }
    };

    fetchChartData();
  }, [axios]);

  const totalChartRevenue = chartData.reduce((s, d) => s + d.revenue, 0);
  const totalChartBookings = chartData.reduce((s, d) => s + d.bookings, 0);

  return (
    <div className="px-4 pt-10 md:px-10 flex-1 pb-16">
      <Title
        title="Owner Dashboard"
        subtitle="Monitor overall platform performance including total cars, bookings, revenue, and recent activities"
      />

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-8 max-w-4xl">
        {dashboardCards.map((card, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-4 rounded-xl border border-borderColor bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            <div>
              <p className="text-xs text-gray-500">{card.title}</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {card.value}
              </p>
            </div>
            <div
              className={`flex items-center justify-center w-11 h-11 rounded-full ${card.bg}`}
            >
              <img src={card.icon} alt="" className="h-5 w-5" />
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts + Revenue Side by Side ── */}
	      <div className="flex flex-wrap gap-6 mb-8 max-w-5xl">
        {/* ── Bar Chart ── */}
        <div className="flex-1 min-w-[300px] bg-white border border-borderColor rounded-xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-base font-semibold text-gray-800">
                Performance Overview
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">Last 6 months</p>
            </div>

            {/* Chart type toggle */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              {[
                { key: "bookings", label: "Bookings" },
                { key: "revenue", label: "Revenue" },
                { key: "both", label: "Both" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setChartType(opt.key)}
                  className={`px-3 py-1 text-xs rounded-md cursor-pointer transition-all ${
                    chartType === opt.key
                      ? "bg-white text-blue-600 font-semibold shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chart summary row */}
          <div className="flex gap-4 mb-4">
            {(chartType === "bookings" || chartType === "both") && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-xs text-gray-500">
                  Total:{" "}
                  <span className="font-semibold text-gray-700">
                    {totalChartBookings} bookings
                  </span>
                </span>
              </div>
            )}
            {(chartType === "revenue" || chartType === "both") && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-xs text-gray-500">
                  Total:{" "}
                  <span className="font-semibold text-gray-700">
                    {currency}
                    {totalChartRevenue.toLocaleString()}
                  </span>
                </span>
              </div>
            )}
          </div>

          {chartLoading ? (
            <div className="flex items-center justify-center h-52 text-gray-400 text-sm">
              Loading chart...
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex items-center justify-center h-52 text-gray-400 text-sm">
              No data available yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={chartData}
                margin={{ top: 4, right: 10, left: 0, bottom: 0 }}
                barCategoryGap="30%"
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f0f0f0"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip
                  content={<CustomTooltip currency={currency} />}
                  cursor={{ fill: "rgba(59,130,246,0.05)" }}
                />
                <Legend
                  wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
                />
                {(chartType === "bookings" || chartType === "both") && (
                  <Bar
                    dataKey="bookings"
                    name="Bookings"
                    fill="#3b82f6"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                  />
                )}
                {(chartType === "revenue" || chartType === "both") && (
                  <Bar
                    dataKey="revenue"
                    name="Revenue"
                    fill="#22c55e"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ── Right Column: Revenue Card + Recent Bookings ── */}
	        <div className="flex flex-col gap-6 w-full md:max-w-xs">
          {/* Monthly Revenue Card */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl p-5 text-white shadow-sm">
            <h2 className="text-sm font-medium opacity-80">Total Revenue</h2>
            <p className="text-3xl font-bold mt-2">
              {currency}
              {data.monthlyRevenue.toLocaleString()}
            </p>
            <p className="text-xs opacity-70 mt-1">From confirmed bookings</p>
            <div className="mt-4 pt-4 border-t border-white/20 flex justify-between text-xs opacity-80">
              <span>Pending: {data.pendingBookings}</span>
              <span>Confirmed: {data.completedBookings}</span>
            </div>
          </div>

          {/* Quick Stats */}
	          <div className="bg-white border border-borderColor rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              Quick Stats
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  Avg. Revenue/Booking
                </span>
                <span className="text-xs font-semibold text-gray-700">
                  {data.completedBookings > 0
                    ? `${currency}${Math.round(
                        data.monthlyRevenue / data.completedBookings,
                      ).toLocaleString()}`
                    : `${currency}0`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  Booking Success Rate
                </span>
                <span className="text-xs font-semibold text-green-600">
                  {data.totalBookings > 0
                    ? `${Math.round(
                        (data.completedBookings / data.totalBookings) * 100,
                      )}%`
                    : "0%"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Cancellation Rate</span>
                <span className="text-xs font-semibold text-red-500">
                  {data.totalBookings > 0
                    ? `${Math.round(
                        ((data.totalBookings -
                          data.completedBookings -
                          data.pendingBookings) /
                          data.totalBookings) *
                          100,
                      )}%`
                    : "0%"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Active Cars</span>
                <span className="text-xs font-semibold text-blue-600">
                  {data.totalCars}
                </span>
	            </div>
	          </div>

          <div className="bg-white border border-borderColor rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              Smart Insights
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center gap-4">
                <span className="text-xs text-gray-500">Most Booked Car</span>
                <span className="text-right text-xs font-semibold text-gray-700">
                  {data.smartInsights?.topBookedCar
                    ? `${data.smartInsights.topBookedCar.label} (${data.smartInsights.topBookedCar.bookings})`
                    : "No data"}
                </span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <span className="text-xs text-gray-500">Most Profitable Car</span>
                <span className="text-right text-xs font-semibold text-gray-700">
                  {data.smartInsights?.topRevenueCar
                    ? `${data.smartInsights.topRevenueCar.label} (${currency}${Number(
                        data.smartInsights.topRevenueCar.revenue || 0,
                      ).toLocaleString()})`
                    : "No data"}
                </span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <span className="text-xs text-gray-500">Top Rental City</span>
                <span className="text-right text-xs font-semibold text-gray-700">
                  {data.smartInsights?.topCity
                    ? `${data.smartInsights.topCity.city} (${data.smartInsights.topCity.bookings})`
                    : "No data"}
                </span>
              </div>
            </div>
          </div>
	        </div>
	      </div>
      </div>

      {/* ── Recent Bookings Table ── */}
      <div className="bg-white border border-borderColor rounded-xl p-5 max-w-5xl shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-gray-800">
              Recent Bookings
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Latest customer booking requests
            </p>
          </div>
          <button
            onClick={() => navigate("/owner/manage-bookings")}
            className="text-xs text-blue-600 hover:text-blue-700 cursor-pointer border border-blue-100 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-all"
          >
            View All
          </button>
        </div>

        {data.recentBookings.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            No bookings yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-borderColor">
                  <th className="pb-3 font-medium">Car</th>
                  <th className="pb-3 font-medium max-md:hidden">Date</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentBookings.map((booking, index) => (
                  <tr
                    key={index}
                    className="border-b border-borderColor last:border-0 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
	                        <img
	                          src={getCarImageSrc(booking.car?.image)}
	                          alt=""
	                          onError={handleCarImageError}
	                          className="w-10 h-10 rounded-lg object-cover"
	                        />
                        <div>
                          <p className="font-medium text-gray-700 text-xs">
                            {booking.car?.brand} {booking.car?.model}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {booking.car?.location}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 max-md:hidden">
                      <p className="text-xs text-gray-500">
                        {booking.createdAt?.split("T")[0]}
                      </p>
                    </td>
                    <td className="py-3">
                      <p className="text-xs font-semibold text-gray-700">
                        {currency}
                        {Number(booking.price).toLocaleString()}
                      </p>
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          booking.status === "confirmed"
                            ? "bg-green-100 text-green-600"
                            : booking.status === "pending"
                              ? "bg-yellow-100 text-yellow-600"
                              : "bg-red-100 text-red-600"
                        }`}
                      >
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
