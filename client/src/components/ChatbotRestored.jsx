import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppContext } from "../context/contextStore";
import { isSafeText } from "../utils/validators";

const STORAGE_KEY = "smart_car_chatbot_threads";

const createId = (prefix = "id") =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const createBotWelcomeMessage = () => ({
  id: createId("msg"),
  sender: "bot",
  text: "Hi, I am your smart car assistant. How can I help you?",
  createdAt: new Date().toISOString(),
});

const supportCategories = [
  { value: "vehicle_issue", label: "Vehicle Issue" },
  { value: "pickup_issue", label: "Pickup Issue" },
  { value: "return_issue", label: "Return Issue" },
  { value: "payment_issue", label: "Payment Issue" },
  { value: "driver_safety", label: "Safety Issue" },
  { value: "other", label: "Other" },
];

const formatSupportStatus = (status = "open") =>
  String(status)
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const createThread = (title = "New Chat") => ({
  id: createId("thread"),
  title,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  messages: [createBotWelcomeMessage()],
});

const buildThreadTitle = (text = "") => {
  const cleaned = text.trim().replace(/\s+/g, " ");
  if (!cleaned) return "New Chat";
  return cleaned.length > 28 ? `${cleaned.slice(0, 28)}...` : cleaned;
};

const getStoredThreads = () => {
  if (typeof window === "undefined") return [createThread()];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [createThread()];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return [createThread()];

    const sanitized = parsed
      .filter((thread) => thread && Array.isArray(thread.messages))
      .map((thread) => ({
        id: thread.id || createId("thread"),
        title: thread.title || "New Chat",
        createdAt: thread.createdAt || new Date().toISOString(),
        updatedAt: thread.updatedAt || new Date().toISOString(),
        messages:
          thread.messages.length > 0
            ? thread.messages.map((msg) => ({
                id: msg.id || createId("msg"),
                sender: msg.sender || "bot",
                text: typeof msg.text === "string" ? msg.text : "",
                createdAt: msg.createdAt || new Date().toISOString(),
              }))
            : [createBotWelcomeMessage()],
      }));

    return sanitized.length > 0 ? sanitized : [createThread()];
  } catch {
    return [createThread()];
  }
};

const ChatbotRestored = () => {
  const { axios, token, user, setShowLogin, setPreferredLoginRole } =
    useAppContext();
  const [open, setOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [issueFormOpen, setIssueFormOpen] = useState(false);
  const [issueCategory, setIssueCategory] = useState("vehicle_issue");
  const [issueSubject, setIssueSubject] = useState("");
  const [issueMessage, setIssueMessage] = useState("");
  const [supportMode, setSupportMode] = useState(false);
  const [supportTickets, setSupportTickets] = useState([]);
  const [activeSupportTicketId, setActiveSupportTicketId] = useState(null);
  const [supportReply, setSupportReply] = useState("");
  const [supportLoading, setSupportLoading] = useState(false);
  const [threads, setThreads] = useState(() => getStoredThreads());
  const [activeThreadId, setActiveThreadId] = useState(() => {
    const initialThreads = getStoredThreads();
    return initialThreads[0]?.id || null;
  });

  const chatRef = useRef(null);
  const messagesEndRef = useRef(null);

  const activeThread = useMemo(() => {
    return threads.find((thread) => thread.id === activeThreadId) || threads[0];
  }, [threads, activeThreadId]);

  const messages = useMemo(
    () => activeThread?.messages || [],
    [activeThread?.messages],
  );

  const activeSupportTicket = useMemo(
    () =>
      supportTickets.find((ticket) => ticket._id === activeSupportTicketId) ||
      supportTickets[0] ||
      null,
    [activeSupportTicketId, supportTickets],
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
    }
  }, [threads]);

  useEffect(() => {
    if (!activeThreadId && threads.length > 0) {
      setActiveThreadId(threads[0].id);
    }
  }, [activeThreadId, threads]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, activeThreadId, activeSupportTicketId, supportTickets]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (chatRef.current && !chatRef.current.contains(e.target)) {
        setOpen(false);
        setHistoryOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const fetchSupportTickets = useCallback(async (selectLatest = false) => {
    if (!token || user?.role !== "user") return;

    setSupportLoading(true);
    try {
      const { data } = await axios.get("/api/chatbot/my-tickets", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (data?.success) {
        const tickets = data.tickets || [];
        setSupportTickets(tickets);
        if (tickets.length > 0) {
          setActiveSupportTicketId((prev) =>
            selectLatest || !tickets.some((ticket) => ticket._id === prev)
              ? tickets[0]._id
              : prev,
          );
        } else {
          setActiveSupportTicketId(null);
        }
      }
    } finally {
      setSupportLoading(false);
    }
  }, [axios, token, user?.role]);

  useEffect(() => {
    if (!open || !supportMode || !token || user?.role !== "user") return;

    fetchSupportTickets();
    const intervalId = window.setInterval(() => {
      fetchSupportTickets();
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, [fetchSupportTickets, open, supportMode, token, user?.role]);

  const updateThreadMessages = (threadId, updater) => {
    setThreads((prev) =>
      prev.map((thread) => {
        if (thread.id !== threadId) return thread;

        const nextMessages =
          typeof updater === "function" ? updater(thread.messages) : updater;

        return {
          ...thread,
          messages: nextMessages,
          updatedAt: new Date().toISOString(),
        };
      }),
    );
  };

  const handleNewChat = () => {
    const newThread = createThread();
    setThreads((prev) => [newThread, ...prev]);
    setActiveThreadId(newThread.id);
    setInput("");
    setHistoryOpen(false);
    setOpen(true);
  };

  const handleSelectThread = (threadId) => {
    setActiveThreadId(threadId);
    setHistoryOpen(false);
  };

  const handleDeleteThread = (threadId) => {
    setThreads((prev) => {
      const filtered = prev.filter((thread) => thread.id !== threadId);
      const nextThreads = filtered.length > 0 ? filtered : [createThread()];

      if (threadId === activeThreadId) {
        setActiveThreadId(nextThreads[0].id);
      }

      return nextThreads;
    });
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading || !activeThread) return;

    const userMessage = {
      id: createId("msg"),
      sender: "user",
      text: trimmed,
      createdAt: new Date().toISOString(),
    };

    const shouldUpdateTitle =
      !activeThread.messages.some((msg) => msg.sender === "user") ||
      activeThread.title === "New Chat";

    setThreads((prev) =>
      prev.map((thread) =>
        thread.id === activeThread.id
          ? {
              ...thread,
              title: shouldUpdateTitle
                ? buildThreadTitle(trimmed)
                : thread.title,
              updatedAt: new Date().toISOString(),
              messages: [...thread.messages, userMessage],
            }
          : thread,
      ),
    );

    setInput("");
    setLoading(true);

    try {
      const res = await axios.post("/api/chatbot/ask", {
        message: trimmed,
      });

      const botReply = {
        id: createId("msg"),
        sender: "bot",
        text:
          res.data?.reply || "I could not understand that. Please try again.",
        createdAt: new Date().toISOString(),
      };

      updateThreadMessages(activeThread.id, (prevMessages) => [
        ...prevMessages,
        botReply,
      ]);
    } catch {
      const errorReply = {
        id: createId("msg"),
        sender: "bot",
        text: "Server error. Please try again.",
        createdAt: new Date().toISOString(),
      };

      updateThreadMessages(activeThread.id, (prevMessages) => [
        ...prevMessages,
        errorReply,
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenIssueForm = () => {
    if (!token || user?.role !== "user") {
      setPreferredLoginRole("user");
      setShowLogin(true);
      return;
    }

    setIssueCategory("vehicle_issue");
    setIssueSubject("");
    setIssueMessage("");
    setIssueFormOpen(true);
    setHistoryOpen(false);
    setSupportMode(false);
  };

  const handleOpenSupportMode = useCallback(async () => {
    if (!token || user?.role !== "user") {
      setPreferredLoginRole("user");
      setShowLogin(true);
      return;
    }

    setSupportMode(true);
    setIssueFormOpen(false);
    setHistoryOpen(false);
    await fetchSupportTickets();
  }, [
    fetchSupportTickets,
    setPreferredLoginRole,
    setShowLogin,
    token,
    user?.role,
  ]);

  useEffect(() => {
    const handleExternalSupportOpen = async () => {
      setOpen(true);
      setHistoryOpen(false);

      if (token && user?.role === "user") {
        await handleOpenSupportMode();
        return;
      }

      setSupportMode(false);
      setIssueFormOpen(false);
      setPreferredLoginRole("user");
      setShowLogin(true);
    };

    window.addEventListener("open-chatbot-support", handleExternalSupportOpen);
    return () => {
      window.removeEventListener(
        "open-chatbot-support",
        handleExternalSupportOpen,
      );
    };
  }, [
    handleOpenSupportMode,
    setPreferredLoginRole,
    setShowLogin,
    token,
    user?.role,
  ]);

  const handleSubmitIssue = async () => {
    if (!activeThread || loading) return;

    const subject = issueSubject.trim();
    const message = issueMessage.trim();

    if (!subject || !message) return;

    if (!isSafeText(subject, 3, 120) || !isSafeText(message, 5, 1000)) {
      updateThreadMessages(activeThread.id, (prevMessages) => [
        ...prevMessages,
        {
          id: createId("msg"),
          sender: "bot",
          text: "Subject must be 3-120 characters and details must be 5-1000 characters.",
          createdAt: new Date().toISOString(),
        },
      ]);
      return;
    }

    const summaryMessage = {
      id: createId("msg"),
      sender: "user",
      text: `Report Issue\nCategory: ${supportCategories.find((item) => item.value === issueCategory)?.label || "Other"}\nSubject: ${subject}\nDetails: ${message}`,
      createdAt: new Date().toISOString(),
    };

    updateThreadMessages(activeThread.id, (prevMessages) => [
      ...prevMessages,
      summaryMessage,
    ]);

    setIssueFormOpen(false);
    setIssueSubject("");
    setIssueMessage("");
    setLoading(true);

    try {
      const { data } = await axios.post(
        "/api/chatbot/report-issue",
        {
          category: issueCategory,
          subject,
          message,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const botReply = {
        id: createId("msg"),
        sender: "bot",
        text:
          data?.success && data?.ticketId
            ? `Your issue has been sent to the admin team.\nTicket ID: ${data.ticketId}\n\nThe team will contact you as soon as possible. For urgent help, call or WhatsApp +92 300 8143370.`
            : data?.message || "Your issue could not be submitted.",
        createdAt: new Date().toISOString(),
      };

      updateThreadMessages(activeThread.id, (prevMessages) => [
        ...prevMessages,
        botReply,
      ]);
      setSupportMode(true);
      await fetchSupportTickets(true);
    } catch (error) {
      const errorReply = {
        id: createId("msg"),
        sender: "bot",
        text:
          error.response?.data?.message ||
          "Unable to send your issue right now. Please try again or contact support directly at +92 300 8143370.",
        createdAt: new Date().toISOString(),
      };

      updateThreadMessages(activeThread.id, (prevMessages) => [
        ...prevMessages,
        errorReply,
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendSupportReply = async () => {
    const message = supportReply.trim();
    if (!message || !activeSupportTicket) return;

    if (!isSafeText(message, 2, 1000)) {
      updateThreadMessages(activeThread.id, (prevMessages) => [
        ...prevMessages,
        {
          id: createId("msg"),
          sender: "bot",
          text: "Support reply must be between 2 and 1000 characters.",
          createdAt: new Date().toISOString(),
        },
      ]);
      return;
    }

    setSupportLoading(true);
    try {
      const { data } = await axios.post(
        `/api/chatbot/tickets/${activeSupportTicket._id}/messages`,
        { message },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (data?.success && data.ticket) {
        setSupportTickets((prev) =>
          prev.map((ticket) =>
            ticket._id === activeSupportTicket._id ? data.ticket : ticket,
          ),
        );
        setSupportReply("");
      }
    } catch (error) {
      updateThreadMessages(activeThread.id, (prevMessages) => [
        ...prevMessages,
        {
          id: createId("msg"),
          sender: "bot",
          text:
            error.response?.data?.message ||
            "Unable to send your support message right now.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setSupportLoading(false);
    }
  };

  const handleRentalRules = () => {
    if (!activeThread) return;

    updateThreadMessages(activeThread.id, (prevMessages) => [
      ...prevMessages,
      {
        id: createId("msg"),
        sender: "bot",
        text:
          "Rental Rules:\n1. Carry valid CNIC and driving license at pickup.\n2. Return the car on time to avoid overdue penalties.\n3. Any issue during the rental should be reported through Support.\n4. Booking confirmation depends on car availability and admin/owner approval.",
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  const handleBookCarQuickAction = () => {
    window.location.href = "/cars";
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-10 z-50 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-green-500 text-2xl text-white shadow-lg hover:bg-green-600"
      >
        💬
      </button>

      {open && (
        <div
          ref={chatRef}
          className="fixed bottom-24 right-10 z-50 flex h-[420px] w-80 flex-col overflow-hidden rounded-lg bg-[#ece5dd] shadow-xl"
        >
          <div className="flex items-center justify-between rounded-t-lg bg-green-700 px-4 py-3 font-semibold text-white">
            <div className="min-w-0">
              <p className="truncate">Smart Car Assistant</p>
              <p className="truncate text-[11px] font-normal text-white/80">
                {activeThread?.title || "New Chat"}
              </p>
            </div>

            <div className="ml-3 flex items-center gap-2">
              <button
                onClick={handleNewChat}
                className="cursor-pointer rounded-full bg-white/15 px-2.5 py-1 text-xs transition hover:bg-white/20"
                title="New Chat"
              >
                New
              </button>
              <button
                onClick={() => setHistoryOpen((prev) => !prev)}
                className="cursor-pointer text-lg"
                title="Chat History"
              >
                ☰
              </button>
            </div>
          </div>

          {issueFormOpen && (
            <div className="space-y-2 border-b border-gray-200 bg-white px-3 py-3">
              <p className="text-sm font-semibold text-gray-700">
                Report Rental Issue
              </p>
              <select
                value={issueCategory}
                onChange={(e) => setIssueCategory(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none"
              >
                {supportCategories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={issueSubject}
                onChange={(e) => setIssueSubject(e.target.value)}
                placeholder="Short subject"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none"
              />
              <textarea
                value={issueMessage}
                onChange={(e) => setIssueMessage(e.target.value)}
                placeholder="Describe the problem you are facing during the rental period"
                rows={3}
                className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setIssueFormOpen(false)}
                  className="cursor-pointer rounded-full border border-gray-300 px-3 py-1.5 text-xs text-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitIssue}
                  disabled={loading || !issueSubject.trim() || !issueMessage.trim()}
                  className="cursor-pointer rounded-full bg-red-500 px-3 py-1.5 text-xs text-white disabled:cursor-not-allowed disabled:bg-red-300"
                >
                  Send to Admin
                </button>
              </div>
            </div>
          )}

          {historyOpen && (
            <div className="absolute right-3 top-14 z-50 max-h-72 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-100 p-3">
                <p className="text-sm font-semibold text-gray-700">
                  Chat History
                </p>
                <button
                  onClick={handleNewChat}
                  className="cursor-pointer rounded-full bg-blue-600 px-2.5 py-1 text-xs text-white transition hover:bg-blue-700"
                >
                  New
                </button>
              </div>

              <div className="max-h-56 space-y-2 overflow-y-auto p-2">
                {threads.map((thread) => (
                  <div
                    key={thread.id}
                    className={`group rounded-lg border transition ${
                      activeThreadId === thread.id
                        ? "border-green-300 bg-green-50"
                        : "border-transparent hover:border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <button
                      onClick={() => handleSelectThread(thread.id)}
                      className="w-full cursor-pointer px-3 py-2 text-left"
                      title={thread.title}
                    >
                      <p className="truncate text-sm text-gray-700">
                        {thread.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-gray-400">
                        {new Date(thread.updatedAt).toLocaleDateString("en-PK", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </button>

                    <div className="flex justify-end px-3 pb-2">
                      <button
                        onClick={() => handleDeleteThread(thread.id)}
                        className="cursor-pointer text-xs text-red-500 opacity-70 transition hover:text-red-600 group-hover:opacity-100"
                        title="Delete chat"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {supportMode ? (
              <>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  <button
                    onClick={handleOpenIssueForm}
                    className="cursor-pointer whitespace-nowrap rounded-full border border-red-500 bg-red-500 px-3 py-1 text-xs text-white"
                  >
                    New Support
                  </button>
                  {supportTickets.map((ticket) => (
                    <button
                      key={ticket._id}
                      onClick={() => setActiveSupportTicketId(ticket._id)}
                      className={`rounded-full border px-3 py-1 text-xs whitespace-nowrap ${
                        activeSupportTicketId === ticket._id
                          ? "border-red-500 bg-red-500 text-white"
                          : "border-gray-200 bg-white text-gray-600"
                      }`}
                    >
                      {ticket.subject}
                    </button>
                  ))}
                </div>

                {supportLoading && supportTickets.length === 0 ? (
                  <div className="text-sm text-gray-500">
                    Loading support chat...
                  </div>
                ) : activeSupportTicket ? (
                  <>
                    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-500">
                      Ticket #
                      {String(activeSupportTicket._id).slice(-8).toUpperCase()} •{" "}
                      {formatSupportStatus(activeSupportTicket.status)}
                    </div>
                    {(activeSupportTicket.messages || []).map((message) => {
                      const isUserMessage = message.senderRole === "user";
                      return (
                        <div
                          key={
                            message._id ||
                            `${activeSupportTicket._id}-${message.createdAt}`
                          }
                          className={`flex ${
                            isUserMessage ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[80%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
                              isUserMessage ? "bg-[#dcf8c6]" : "bg-white"
                            }`}
                          >
                            <p className="mb-1 text-[11px] font-semibold opacity-60">
                              {message.senderName || message.senderRole}
                            </p>
                            {message.text}
                          </div>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <div className="rounded-lg bg-white px-3 py-3 text-sm text-gray-500">
                    No support conversation yet. Use `Report Issue` to start
                    chatting with admin.
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex flex-wrap gap-2 pb-2">
                  <button
                    onClick={handleBookCarQuickAction}
                    className="cursor-pointer rounded-full border border-blue-200 bg-white px-3 py-1 text-xs text-blue-600"
                  >
                    Book a Car
                  </button>
                  <button
                    onClick={handleRentalRules}
                    className="cursor-pointer rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600"
                  >
                    Rental Rules
                  </button>
                </div>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.sender === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[75%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
                        msg.sender === "user" ? "bg-[#dcf8c6]" : "bg-white"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="text-sm text-gray-500">Bot is typing...</div>
                )}
              </>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="space-y-2 bg-gray-100 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSupportMode(false)}
                className={`shrink-0 rounded-full px-3 py-2 text-xs cursor-pointer transition ${
                  !supportMode
                    ? "bg-green-600 text-white"
                    : "bg-white text-gray-600"
                }`}
              >
                Bot
              </button>
              <button
                onClick={handleOpenSupportMode}
                className={`shrink-0 rounded-full px-3 py-2 text-xs cursor-pointer transition ${
                  supportMode
                    ? "bg-red-500 text-white"
                    : "bg-white text-gray-600"
                }`}
                title="Chat with admin support"
              >
                Support
              </button>
              <button
                onClick={handleOpenIssueForm}
                className="shrink-0 rounded-full bg-red-500 px-3 py-2 text-xs text-white cursor-pointer transition hover:bg-red-600"
                title="Report a rental issue"
              >
                Report Issue
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={supportMode ? supportReply : input}
                onChange={(e) =>
                  supportMode
                    ? setSupportReply(e.target.value)
                    : setInput(e.target.value)
                }
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  (supportMode ? handleSendSupportReply() : handleSend())
                }
                placeholder={
                  supportMode
                    ? activeSupportTicket
                      ? "Reply to admin team"
                      : "Open or create a support ticket first"
                    : "Type a message"
                }
                disabled={supportMode && !activeSupportTicket}
                className="flex-1 rounded-full border bg-white px-4 py-2.5 text-sm outline-none disabled:cursor-not-allowed disabled:bg-gray-100"
              />
              <button
                onClick={supportMode ? handleSendSupportReply : handleSend}
                disabled={
                  supportMode
                    ? supportLoading ||
                      !supportReply.trim() ||
                      !activeSupportTicket
                    : loading || !input.trim()
                }
                className="rounded-full bg-green-500 px-5 py-2.5 text-sm text-white cursor-pointer transition hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-green-300"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatbotRestored;
