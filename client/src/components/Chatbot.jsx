import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";

const STORAGE_KEY = "smart_car_chatbot_threads";

const createId = (prefix = "id") =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const createBotWelcomeMessage = () => ({
  id: createId("msg"),
  sender: "bot",
  text: "Hi 👋 I am your smart car assistant. How can I help you?",
  createdAt: new Date().toISOString(),
});

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

const Chatbot = () => {
  const [open, setOpen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

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

  const messages = activeThread?.messages || [];

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
  }, [messages, open, activeThreadId]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (chatRef.current && !chatRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

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
    setOpen(true);
  };

  const handleSelectThread = (threadId) => {
    setActiveThreadId(threadId);
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
      const res = await axios.post("http://localhost:3000/api/chatbot/ask", {
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
        text: "⚠️ Server error. Please try again.",
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

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 text-white text-2xl flex items-center justify-center shadow-lg z-50 cursor-pointer"
      >
        💬
      </button>

      {open && (
        <div
          ref={chatRef}
          className="fixed bottom-24 right-6 w-[430px] h-[460px] bg-[#ece5dd] rounded-2xl shadow-xl flex z-50 overflow-hidden"
        >
          <div
            className={`${showSidebar ? "w-60" : "w-0"} bg-[#111827] text-white transition-all duration-300 overflow-hidden flex flex-col`}
          >
            <div className="p-3 border-b border-white/10">
              <button
                onClick={handleNewChat}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-lg transition cursor-pointer"
              >
                <span className="text-base leading-none">＋</span>
                New Chat
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {threads.map((thread) => (
                <div
                  key={thread.id}
                  className={`group flex items-center gap-2 rounded-lg px-2 py-2 transition ${
                    activeThreadId === thread.id
                      ? "bg-white/15"
                      : "hover:bg-white/10"
                  }`}
                >
                  <button
                    onClick={() => handleSelectThread(thread.id)}
                    className="flex-1 text-left min-w-0 cursor-pointer"
                    title={thread.title}
                  >
                    <p className="text-sm truncate">{thread.title}</p>
                    <p className="text-[11px] text-white/50 mt-0.5">
                      {new Date(thread.updatedAt).toLocaleDateString("en-PK", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </button>

                  <button
                    onClick={() => handleDeleteThread(thread.id)}
                    className="opacity-0 group-hover:opacity-100 text-white/60 hover:text-red-400 text-sm px-2 py-1 transition cursor-pointer"
                    title="Delete chat"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 flex flex-col bg-[#ece5dd] min-w-0">
            <div className="bg-green-700 text-white px-4 py-3 font-semibold flex items-center justify-between rounded-tr-2xl">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => setShowSidebar((prev) => !prev)}
                  className="text-lg cursor-pointer"
                  title="Toggle chats"
                >
                  ☰
                </button>
                <div className="min-w-0">
                  <p className="truncate">Smart Car Assistant</p>
                  <p className="text-xs text-white/80 font-normal truncate">
                    {activeThread?.title || "New Chat"}
                  </p>
                </div>
              </div>

              <button
                onClick={handleNewChat}
                className="text-xs bg-white/15 hover:bg-white/20 px-3 py-1.5 rounded-full transition cursor-pointer"
              >
                New Chat
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm max-w-[82%] whitespace-pre-wrap ${
                      msg.sender === "user" ? "bg-[#dcf8c6]" : "bg-white"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="text-sm text-gray-500 px-1">
                  Bot is typing...
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="flex items-center gap-2 p-3 bg-gray-100 border-t border-gray-200">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type a message"
                className="flex-1 px-4 py-2.5 rounded-full border outline-none text-sm bg-white"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-5 py-2.5 rounded-full text-sm cursor-pointer disabled:cursor-not-allowed transition"
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

export default Chatbot;
