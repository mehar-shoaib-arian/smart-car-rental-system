import React, { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import Title from "../../components/owner/Title";
import { useAppContext } from "../../context/contextStore";
import { assets } from "../../assets/assets";
import { isSafeText } from "../../utils/validators";

const SupportTickets = () => {
  const { axios, user: currentUser } = useAppContext();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingTicketId, setUpdatingTicketId] = useState("");
  const [replyDrafts, setReplyDrafts] = useState({});

  const getAuthHeaders = () => {
    const token = sessionStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/owner/support-tickets", {
        headers: getAuthHeaders(),
      });

      if (data.success) {
        setTickets(data.tickets);
      } else {
        toast.error(data.message || "Failed to fetch support tickets.");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to fetch support tickets.",
      );
    } finally {
      setLoading(false);
    }
  }, [axios]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const updateTicketStatus = async (ticketId, status) => {
    setUpdatingTicketId(ticketId);
    try {
      const { data } = await axios.patch(
        `/api/owner/support-tickets/${ticketId}`,
        { status },
        { headers: getAuthHeaders() },
      );

      if (data.success) {
        toast.success(data.message || "Ticket status updated.");
        setTickets((prev) =>
          prev.map((ticket) =>
            ticket._id === ticketId ? { ...ticket, status } : ticket,
          ),
        );
      } else {
        toast.error(data.message || "Failed to update ticket status.");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update ticket status.",
      );
    } finally {
      setUpdatingTicketId("");
    }
  };

  const sendReply = async (ticketId) => {
    const message = String(replyDrafts[ticketId] || "").trim();
    if (!message) {
      toast.error("Reply message is required.");
      return;
    }
    if (!isSafeText(message, 2, 1000)) {
      toast.error("Reply must be between 2 and 1000 characters.");
      return;
    }

    setUpdatingTicketId(ticketId);
    try {
      const { data } = await axios.post(
        `/api/owner/support-tickets/${ticketId}/reply`,
        { message },
        { headers: getAuthHeaders() },
      );

      if (data.success) {
        toast.success(data.message || "Reply sent.");
        setTickets((prev) =>
          prev.map((ticket) =>
            ticket._id === ticketId ? data.ticket : ticket,
          ),
        );
        setReplyDrafts((prev) => ({ ...prev, [ticketId]: "" }));
      } else {
        toast.error(data.message || "Failed to send reply.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send reply.");
    } finally {
      setUpdatingTicketId("");
    }
  };

  if (currentUser?.role && !["owner", "admin"].includes(currentUser.role)) {
    return <Navigate to="/owner" replace />;
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("en-PK", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getStatusBadgeClasses = (status) => {
    if (status === "resolved") return "bg-green-100 text-green-600";
    if (status === "in_progress") return "bg-yellow-100 text-yellow-600";
    return "bg-red-100 text-red-600";
  };

  const getCategoryLabel = (category) =>
    String(category || "other")
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

  const filteredTickets = tickets.filter((ticket) => {
    const term = search.trim().toLowerCase();
    const matchesSearch =
      !term ||
      ticket.subject?.toLowerCase().includes(term) ||
      ticket.message?.toLowerCase().includes(term) ||
      ticket.user?.name?.toLowerCase().includes(term) ||
      ticket.user?.email?.toLowerCase().includes(term);

    const matchesStatus =
      statusFilter === "all" || ticket.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalOpen = tickets.filter((ticket) => ticket.status === "open").length;
  const totalInProgress = tickets.filter(
    (ticket) => ticket.status === "in_progress",
  ).length;
  const totalResolved = tickets.filter(
    (ticket) => ticket.status === "resolved",
  ).length;

  return (
    <div className="px-4 pt-10 md:px-10 w-full pb-16">
      <Title
        title="Support Tickets"
        subtitle="Review chatbot issues submitted by customers during the rental period."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6 max-w-4xl">
        <div className="bg-white border border-borderColor rounded-xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-gray-800">{tickets.length}</p>
          <p className="text-xs text-gray-400 mt-1">Total Tickets</p>
        </div>
        <div className="bg-white border border-borderColor rounded-xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-red-600">{totalOpen}</p>
          <p className="text-xs text-gray-400 mt-1">Open</p>
        </div>
        <div className="bg-white border border-borderColor rounded-xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-yellow-600">
            {totalInProgress}
          </p>
          <p className="text-xs text-gray-400 mt-1">In Progress</p>
        </div>
        <div className="bg-white border border-borderColor rounded-xl p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-green-600">{totalResolved}</p>
          <p className="text-xs text-gray-400 mt-1">Resolved</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5 max-w-6xl">
        <div className="flex items-center bg-white border border-borderColor rounded-lg px-3 h-10 gap-2 flex-1 w-full">
          <img
            src={assets.search_icon}
            alt="search"
            className="w-4 h-4 opacity-50"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer, subject, or issue details..."
            className="flex-1 outline-none text-sm text-gray-600 bg-transparent"
          />
        </div>

        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 flex-wrap">
          {[
            { key: "all", label: `All (${tickets.length})` },
            { key: "open", label: `Open (${totalOpen})` },
            { key: "in_progress", label: `In Progress (${totalInProgress})` },
            { key: "resolved", label: `Resolved (${totalResolved})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 text-xs rounded-md cursor-pointer transition-all whitespace-nowrap ${
                statusFilter === tab.key
                  ? "bg-white text-blue-600 font-semibold shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl rounded-xl border border-borderColor bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
            Loading support tickets...
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
            No support tickets found.
          </div>
        ) : (
          <div className="divide-y divide-borderColor">
            {filteredTickets.map((ticket) => (
              <div key={ticket._id} className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-gray-800">
                        {ticket.subject}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClasses(ticket.status)}`}
                      >
                        {ticket.status.replace("_", " ")}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                        {getCategoryLabel(ticket.category)}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-2 text-sm text-gray-500 md:grid-cols-2">
                      <p>
                        <span className="font-medium text-gray-700">
                          Customer:
                        </span>{" "}
                        {ticket.user?.name || "Unknown"}
                      </p>
                      <p>
                        <span className="font-medium text-gray-700">Email:</span>{" "}
                        {ticket.user?.email || "-"}
                      </p>
                      <p>
                        <span className="font-medium text-gray-700">
                          Ticket ID:
                        </span>{" "}
                        #{String(ticket._id).slice(-8).toUpperCase()}
                      </p>
                      <p>
                        <span className="font-medium text-gray-700">
                          Submitted:
                        </span>{" "}
                        {formatDate(ticket.createdAt)}
                      </p>
                      <p>
                        <span className="font-medium text-gray-700">
                          Related Booking:
                        </span>{" "}
                        {ticket.booking
                          ? `#${String(ticket.booking._id).slice(-8).toUpperCase()}`
                          : "Not linked"}
                      </p>
                    </div>

                    <div className="mt-4 rounded-xl border border-borderColor bg-gray-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Conversation
                      </p>
                      <div className="mt-3 space-y-2">
                        {(ticket.messages?.length ? ticket.messages : []).map(
                          (message) => (
                            <div
                              key={message._id || `${ticket._id}-${message.createdAt}`}
                              className={`rounded-lg px-3 py-2 text-sm ${
                                message.senderRole === "user"
                                  ? "bg-white text-gray-700"
                                  : "bg-blue-50 text-blue-700"
                              }`}
                            >
                              <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70">
                                {message.senderName || message.senderRole}
                              </p>
                              <p className="mt-1 whitespace-pre-wrap">
                                {message.text}
                              </p>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="lg:w-48 shrink-0">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                      Update Status
                    </label>
                    <select
                      value={ticket.status}
                      onChange={(e) =>
                        updateTicketStatus(ticket._id, e.target.value)
                      }
                      disabled={updatingTicketId === ticket._id}
                      className="w-full rounded-lg border border-borderColor px-3 py-2 text-sm text-gray-700 outline-none"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                    <textarea
                      value={replyDrafts[ticket._id] || ""}
                      onChange={(e) =>
                        setReplyDrafts((prev) => ({
                          ...prev,
                          [ticket._id]: e.target.value,
                        }))
                      }
                      rows={4}
                      placeholder="Reply to customer..."
                      className="mt-3 w-full rounded-lg border border-borderColor px-3 py-2 text-sm text-gray-700 outline-none resize-none"
                    />
                    <button
                      onClick={() => sendReply(ticket._id)}
                      disabled={
                        updatingTicketId === ticket._id ||
                        !String(replyDrafts[ticket._id] || "").trim()
                      }
                      className="mt-2 w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:bg-blue-300 disabled:cursor-not-allowed"
                    >
                      Send Reply
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportTickets;
