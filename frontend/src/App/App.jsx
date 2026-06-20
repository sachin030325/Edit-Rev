import "./App.css";
import Editor from "@monaco-editor/react";
import { MonacoBinding } from "y-monaco";
import { useRef, useMemo, useState, useEffect } from "react";
import * as Y from "yjs";
import { SocketIOProvider } from "y-socket.io";

/* ---------- small presentational helpers ---------- */

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return parts.length === 1
    ? parts[0].slice(0, 2).toUpperCase()
    : (parts[0][0] + parts[1][0]).toUpperCase();
}

function nameToColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 62%, 52%)`;
}

/* ---------- icons (hand-drawn, no icon library) ---------- */

function Logo({ className = "w-9 h-9" }) {
  return (
    <svg viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="erLogoGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#erLogoGrad)" />
      <path
        d="M15 13 L8.5 20 L15 27"
        stroke="white"
        strokeWidth="2.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M25 13 L31.5 20 L25 27"
        stroke="white"
        strokeWidth="2.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="20" cy="20" r="2.6" fill="white" />
    </svg>
  );
}

function SparkleIcon({ className = "w-4 h-4" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 2 L13.8 9.2 21 11 13.8 12.8 12 20 10.2 12.8 3 11 10.2 9.2 Z" />
    </svg>
  );
}

function ShareIcon({ className = "w-4 h-4" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="18" cy="5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="19" r="2.5" />
      <line x1="8.2" y1="10.8" x2="15.8" y2="6.2" />
      <line x1="8.2" y1="13.2" x2="15.8" y2="17.8" />
    </svg>
  );
}

function SettingsIcon({ className = "w-4 h-4" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13a7.97 7.97 0 0 0 0-2l2-1.5-2-3.4-2.4 1a8 8 0 0 0-1.7-1L15 3h-4l-.3 2.6a8 8 0 0 0-1.7 1l-2.4-1-2 3.4L6.6 11a7.97 7.97 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a8 8 0 0 0 1.7 1L11 21h4l.3-2.6a8 8 0 0 0 1.7-1l2.4 1 2-3.4-2-1.5Z" />
    </svg>
  );
}

function SunIcon({ className = "w-4 h-4" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" />
    </svg>
  );
}

function MoonIcon({ className = "w-4 h-4" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />
    </svg>
  );
}

function ChatIcon({ className = "w-4 h-4" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function SendIcon({ className = "w-4 h-4" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M3 11l18-8-8 18-2.5-7L3 11z" />
    </svg>
  );
}

/* ---------- app ---------- */

function App() {
  const editorRef = useRef(null);
  const bindingRef = useRef(null);
  const chatEndRef = useRef(null);

  const [userName, setUserName] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("username") || "";
  });

  const [users, setUsers] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isLightTheme, setIsLightTheme] = useState(() => {
    const savedTheme = window.localStorage.getItem("edit-rev-theme");
    return savedTheme
      ? savedTheme === "light"
      : window.matchMedia("(prefers-color-scheme: light)").matches;
  });

  const ydoc = useMemo(() => new Y.Doc(), []);
  const yText = useMemo(() => ydoc.getText("monaco"), [ydoc]);
  const yChat = useMemo(() => ydoc.getArray("chat-messages"), [ydoc]);

  const provider = useMemo(
    () =>
      new SocketIOProvider(
        "/",
        "monaco-demo-room",
        ydoc,
        { autoConnect: true }
      ),
    [ydoc]
  );

  const handleMount = (editor) => {
    editorRef.current = editor;

    bindingRef.current = new MonacoBinding(
      yText,
      editor.getModel(),
      new Set([editor]),
      provider.awareness
    );
  };

  const handleJoin = (e) => {
    e.preventDefault();

    const name = e.target.username.value.trim();

    if (!name) return;

    setUserName(name);
    window.history.pushState({}, "", `?username=${name}`);
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text) return;

    yChat.push([{
      id: `${ydoc.clientID}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      user: userName,
      text,
      sentAt: Date.now(),
    }]);
    setChatInput("");
  };

  const toggleTheme = () => {
    setIsLightTheme((currentTheme) => {
      const nextTheme = !currentTheme;
      window.localStorage.setItem("edit-rev-theme", nextTheme ? "light" : "dark");
      return nextTheme;
    });
  };

  useEffect(() => {
    if (!userName) return;

    provider.awareness.setLocalStateField("user", {
      userName,
    });

    const announcePresence = () => {
      provider.socket.emit("presence-join", userName);
    };

    const updateUsers = (onlineUserNames) => {
      setUsers(onlineUserNames.map((onlineUserName) => ({
        userName: onlineUserName,
      })));
    };

    provider.socket.on("connect", announcePresence);
    provider.socket.on("presence-users", updateUsers);

    if (provider.socket.connected) announcePresence();

    return () => {
      provider.socket.off("connect", announcePresence);
      provider.socket.off("presence-users", updateUsers);
      provider.awareness.setLocalStateField("user", null);
    };
  }, [userName, provider]);

  useEffect(() => {
    const updateChat = () => setChatMessages(yChat.toArray());
    yChat.observe(updateChat);
    updateChat();

    return () => yChat.unobserve(updateChat);
  }, [yChat]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  if (!userName) {
    return (
      <main className="h-screen bg-gradient-to-br from-black via-[#482770] to-[#0c5dc1] flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl bg-[#1b1c1f]/90 backdrop-blur-md p-10 shadow-2xl border border-gray-700">
          <div className="mb-8 text-center">
            <div className="flex justify-center mb-4">
              <Logo className="w-12 h-12" />
            </div>

            <h1 className="text-4xl font-bold text-white mb-2">Edit-Rev</h1>

            <p className="text-gray-400">
              Enter your name to join the workspace
            </p>
          </div>

          <form className="flex flex-col gap-5" onSubmit={handleJoin}>
            <input
              type="text"
              name="username"
              placeholder="Your name"
              className="bg-[#2b2d31] text-white p-4 rounded-2xl outline-none border border-transparent focus:border-blue-500 transition"
            />

            <button
              type="submit"
              className="bg-gradient-to-r from-[#5b21b6] to-[#2563eb] text-white p-4 rounded-2xl font-semibold hover:scale-[1.02] transition duration-200 shadow-lg"
            >
              Join Workspace
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <div className={`app-shell ${isLightTheme ? "theme-light" : "theme-dark"} h-screen flex flex-col`}>
      {/* Header */}
      <header className="app-header h-16 shrink-0 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Logo className="w-8 h-8" />
          <span className="text-white text-lg font-bold tracking-tight">
            Edit-Rev
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mr-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Live
          </div>

          <button
            type="button"
            className="flex items-center gap-1.5 bg-gradient-to-r from-[#5b21b6]/20 to-[#2563eb]/20 border border-[#5b21b6]/40 text-gray-100 text-sm font-medium px-3 py-1.5 rounded-xl hover:from-[#5b21b6]/30 hover:to-[#2563eb]/30 transition"
          >
            <SparkleIcon className="w-4 h-4 text-blue-300" />
            AI Agent
          </button>

          <div className="w-px h-6 bg-gray-700 mx-1"></div>

          <button
            type="button"
            title="Share"
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-[#2b2d31] transition"
          >
            <ShareIcon className="w-4 h-4" />
          </button>

          <button
            type="button"
            title="Settings"
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-[#2b2d31] transition"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>

          <button
            type="button"
            title={isLightTheme ? "Switch to dark theme" : "Switch to light theme"}
            aria-label={isLightTheme ? "Switch to dark theme" : "Switch to light theme"}
            aria-pressed={isLightTheme}
            onClick={toggleTheme}
            className="theme-toggle p-2 rounded-xl text-gray-400 hover:text-white hover:bg-[#2b2d31] transition"
          >
            {isLightTheme ? <MoonIcon className="w-4 h-4" /> : <SunIcon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      <div className="flex-1 flex gap-3 p-3 overflow-hidden">
        {/* Sidebar */}
        <div className="sidebar-panel w-80 rounded-3xl flex flex-col overflow-hidden">
          {/* Connected users */}
          <div className="flex flex-col flex-1 min-h-0 p-6 pb-4">
            <p className="text-gray-400 text-xs uppercase tracking-wide font-semibold mb-4">
              Online &middot; {users.length}
            </p>

            <div className="space-y-2 overflow-y-auto pr-1 flex-1 min-h-0">
              {users.length === 0 && (
                <p className="text-gray-500 text-sm">
                  No one else is here yet.
                </p>
              )}

              {users.map((user, index) => (
                <div
                  key={index}
                  className="bg-[#2b2d31] p-2.5 rounded-2xl flex items-center gap-3"
                >
                  <div className="relative shrink-0">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                      style={{ backgroundColor: nameToColor(user.userName) }}
                    >
                      {getInitials(user.userName)}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-[#2b2d31]"></span>
                  </div>

                  <span className="text-gray-200 font-medium text-sm truncate">
                    {user.userName}
                    {user.userName === userName ? " (you)" : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Chat */}
          <div className="chat-panel mx-3 mb-3 rounded-2xl flex flex-col h-72 shrink-0 overflow-hidden">
            <div className="chat-header flex items-center gap-2 px-4 py-3 shrink-0">
              <ChatIcon className="w-4 h-4 text-gray-400" />
              <span className="text-gray-300 text-sm font-semibold">
                Chat
              </span>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3">
              {chatMessages.length === 0 ? (
                <p className="text-gray-500 text-xs text-center mt-6">
                  No messages yet, say hi.
                </p>
              ) : (
                chatMessages.map((msg) => {
                  const isOwnMessage = msg.user === userName;

                  return (
                  <div key={msg.id} className={`flex items-end gap-2 ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                    {!isOwnMessage && (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold text-white shrink-0"
                      style={{ backgroundColor: nameToColor(msg.user) }}
                    >
                      {getInitials(msg.user)}
                    </div>
                    )}

                    <div className={`min-w-0 max-w-[78%] ${isOwnMessage ? "text-right" : "text-left"}`}>
                      <p className="text-[11px] text-gray-400 leading-none mb-1 px-1">
                        {isOwnMessage ? "You" : msg.user}
                      </p>
                      <p className={`chat-bubble ${isOwnMessage ? "chat-bubble-own" : "chat-bubble-other"} text-sm break-words px-3 py-2 rounded-2xl`}>
                        {msg.text}
                      </p>
                    </div>
                  </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            <form
              onSubmit={handleSendChat}
              className="chat-form flex items-center gap-2 p-3 shrink-0"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Message everyone..."
                className="flex-1 bg-[#2b2d31] text-white text-sm placeholder-gray-500 px-3 py-2 rounded-xl outline-none border border-transparent focus:border-blue-500 transition"
              />
              <button
                type="submit"
                title="Send"
                className="bg-gradient-to-r from-[#5b21b6] to-[#2563eb] text-white p-2.5 rounded-xl hover:scale-105 transition shrink-0"
              >
                <SendIcon className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Editor */}
        <div className="editor-panel flex-1 rounded-3xl overflow-hidden flex flex-col">
          <div className="editor-toolbar h-10 shrink-0 flex items-center px-3">
            <div className="editor-tab flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-300">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              index.js
            </div>
          </div>

          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              defaultLanguage="javascript"
              defaultValue={`function hello() {
  console.log("Hello World");
}`}
              theme={isLightTheme ? "light" : "vs-dark"}
              onMount={handleMount}
              options={{
                minimap: { enabled: false },
                fontSize: 15,
                fontFamily: "JetBrains Mono",
                automaticLayout: true,
                scrollBeyondLastLine: false,
                padding: { top: 16, bottom: 16 },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
