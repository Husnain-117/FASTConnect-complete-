"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { io, type Socket } from "socket.io-client"
import axiosInstance from "../api/axiosConfig"
import { useAuth } from "../context/AuthContext"
import Navbar from "./Navbar"
import { useSocket } from "../contexts/SocketContext"
import { getOnlineUsers } from '../api/userApi'
import type { User } from '../types/User'
import Picker from '@emoji-mart/react'
import data from '@emoji-mart/data'

// Add this after the imports and before the component
const styles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes slideInUp {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes slideInLeft {
    from { opacity: 0; transform: translateX(-30px); }
    to { opacity: 1; transform: translateX(0); }
  }
  
  @keyframes slideInRight {
    from { opacity: 0; transform: translateX(30px); }
    to { opacity: 1; transform: translateX(0); }
  }
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  
  @keyframes bounce {
    0%, 20%, 53%, 80%, 100% { transform: translate3d(0,0,0); }
    40%, 43% { transform: translate3d(0,-30px,0); }
    70% { transform: translate3d(0,-15px,0); }
    90% { transform: translate3d(0,-4px,0); }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.6s ease-out;
  }
  
  .animate-slideInUp {
    animation: slideInUp 0.6s ease-out;
  }
  
  .animate-slideInLeft {
    animation: slideInLeft 0.4s ease-out;
  }
  
  .animate-slideInRight {
    animation: slideInRight 0.4s ease-out;
  }
  
  .animation-delay-100 {
    animation-delay: 0.1s;
    animation-fill-mode: both;
  }
  
  .animation-delay-200 {
    animation-delay: 0.2s;
    animation-fill-mode: both;
  }
  
  .animation-delay-300 {
    animation-delay: 0.3s;
    animation-fill-mode: both;
  }
  
  .animate-pulse-slow {
    animation: pulse 2s infinite;
  }
  
  .animate-bounce-slow {
    animation: bounce 2s infinite;
  }
`

interface Message {
  _id: string
  text: string
  sender: {
    _id: string
    name: string
    email: string
    avatar?: string
  }
  timestamp: string
}

const FILTERS = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "This Week", value: "week" },
  { label: "Last 7 Days", value: "last7" },
  { label: "This Month", value: "month" },
  { label: "Custom", value: "custom" },
  { label: "All", value: "all" },
];

function isToday(date: Date) {
  const now = new Date();
  return date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
}

function isYesterday(date: Date) {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  return date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();
}

function isThisWeek(date: Date) {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
  startOfWeek.setHours(0, 0, 0, 0);
  return date >= startOfWeek && date <= now;
}

function isLast7Days(date: Date) {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 6); // includes today
  sevenDaysAgo.setHours(0, 0, 0, 0);
  return date >= sevenDaysAgo && date <= now;
}

function isThisMonth(date: Date) {
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

const TextChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const { socket } = useSocket()
  const { user, token } = useAuth()
  const inputRef = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState<string>("all");
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [onlineUsersError, setOnlineUsersError] = useState<string | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Add this right after the component declaration
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
    
    // Return a cleanup function that removes the style element
    return () => {
      if (styleSheet && document.head.contains(styleSheet)) {
        document.head.removeChild(styleSheet);
      }
    };
  }, []);

  // Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axiosInstance.get("/messages/all")
        setMessages(response.data.messages || [])
      } catch (err) {
        setError("Failed to load messages")
        console.error("Error fetching messages:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchMessages()
  }, [])

  // Set up socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: Message) => {
      setMessages(prevMessages => {
        const exists = prevMessages.some(msg =>
          msg._id === message._id ||
          (msg._id.startsWith('temp-') && msg.text === message.text && msg.sender._id === message.sender._id)
        );
        if (exists) {
          return prevMessages.map(msg =>
            (msg._id.startsWith('temp-') && msg.text === message.text && msg.sender._id === message.sender._id)
              ? message
              : msg
          );
        } else {
          return [...prevMessages, message];
        }
      });
    };

    const handleUserTyping = () => {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 3000);
    };

    socket.on("new_message", handleNewMessage);
    socket.on("user_typing", handleUserTyping);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("user_typing", handleUserTyping);
    };
  }, [socket]);

  // Auto-scroll to bottom when messages change, but only if user is near the bottom
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    // Only scroll if NOT already at the bottom (allow a small threshold)
    const isAtBottom = Math.abs(container.scrollHeight - container.scrollTop - container.clientHeight) < 10;
    if (isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" }); // Use 'auto' for instant, no shake
    }
  }, [messages]);

  // Track if user is not at the bottom, show scroll-to-bottom button
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const isAtBottom = Math.abs(container.scrollHeight - container.scrollTop - container.clientHeight) < 10;
      setShowScrollToBottom(!isAtBottom);
    };
    container.addEventListener('scroll', handleScroll);
    // Initial check
    handleScroll();
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Also update showScrollToBottom when messages change (e.g., after sending/receiving)
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const isAtBottom = Math.abs(container.scrollHeight - container.scrollTop - container.clientHeight) < 10;
    setShowScrollToBottom(!isAtBottom);
  }, [messages]);

  const handleScrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    // After scrolling, the scroll event will fire and hide the button if at bottom
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    // Create optimistic message
    const optimisticMessage: Message = {
      _id: `temp-${Date.now()}`,
      text: newMessage,
      sender: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, optimisticMessage]);
    const messageText = newMessage;
    setNewMessage("");
    // Refocus the input after sending
    inputRef.current?.focus();

    try {
      // Send message to server
      const response = await axiosInstance.post("/messages/send", { text: messageText });
      if (!response.data.success) {
        throw new Error('Failed to send message');
      }
      // The socket "new_message" event will update the messages
    } catch (err) {
      setError("Failed to send message");
      setMessages(prev => prev.filter(msg => msg._id !== optimisticMessage._id));
    }
  };

  const getInitials = (name: string) => {
    return name
      ? name
          .split(" ")
          .map((w) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : "U"
  }

  const filteredMessages = messages.filter(msg => {
    const msgDate = new Date(msg.timestamp);
    if (filter === "today") return isToday(msgDate);
    if (filter === "yesterday") return isYesterday(msgDate);
    if (filter === "week") return isThisWeek(msgDate);
    if (filter === "last7") return isLast7Days(msgDate);
    if (filter === "month") return isThisMonth(msgDate);
    if (filter === "custom" && customStart && customEnd) {
      const start = new Date(customStart);
      const end = new Date(customEnd);
      end.setHours(23, 59, 59, 999);
      return msgDate >= start && msgDate <= end;
    }
    return true;
  });

  // Copy-paste logic from SearchPage.tsx
  const fetchOnlineUsers = async () => {
    if (!token) {
      setOnlineUsersError('No auth token');
      return [];
    }
    try {
      console.log('Token used for fetch:', token);
      const res = await fetch('http://localhost:5000/api/profile/online', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch online users');
      const response = await res.json();
      if (!response.success || !Array.isArray(response.users)) {
        console.error('Unexpected response format:', response);
        return [];
      }
      return response.users.map((user: any) => user._id);
    } catch (err) {
      console.error('Error fetching online users:', err);
      setOnlineUsersError('Failed to load online users');
      return [];
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchOnlineUsers().then(setOnlineUsers);
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center animate-fadeIn">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full mb-4 animate-pulse-slow">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Chat...</h2>
          <p className="text-gray-600">Connecting to Fast Connect Chat</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">
      <Navbar />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-fadeIn">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl mb-8">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Fast Connect <span className="text-emerald-600">Global Chat</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Connect and communicate with fellow Fast University students in real-time. Share ideas, collaborate on
            projects, and build lasting academic relationships.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl animate-fadeIn">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-red-700 text-sm font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-lg font-semibold border transition-colors duration-200 ${filter === f.value ? 'bg-emerald-500 text-white border-emerald-600 shadow-md' : 'bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50'} ${f.value === 'custom' ? 'relative z-10' : ''}`}
              style={f.value === 'custom' ? { minWidth: 90, fontWeight: 700, letterSpacing: 0.5 } : {}}
            >
              {f.label}
            </button>
          ))}
          {filter === 'custom' && (
            <div className="flex items-center gap-2 bg-white border border-emerald-200 rounded-lg px-3 py-1 ml-1 shadow-sm">
              <input
                type="date"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                className="px-2 py-1 border border-emerald-400 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                max={customEnd || undefined}
                style={{ colorScheme: 'light' }}
              />
              <span className="mx-1 text-gray-500">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                className="px-2 py-1 border border-emerald-400 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                min={customStart || undefined}
                style={{ colorScheme: 'light' }}
              />
            </div>
          )}
        </div>

        {/* Chat Container */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden animate-slideInUp animation-delay-100">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {onlineUsers.length > 0 ? (
                  <div className="text-emerald-100 text-sm">{onlineUsers.length} users online</div>
                ) : (
                  <div className="text-emerald-100 text-sm">No users online</div>
                )}
              </div>
              <div className="text-white text-lg font-bold">University Global Chat</div>
            </div>
          </div>

          {/* Messages Container */}
          <div ref={messagesContainerRef} className="h-96 overflow-y-auto p-6 space-y-4 bg-gray-50 relative">
            {filteredMessages.length === 0 ? (
              <div className="text-center py-12 animate-fadeIn">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No messages for this filter</h3>
                <p className="text-gray-600">Try another filter or send a new message!</p>
              </div>
            ) : (
              filteredMessages.map((message, index) => {
                const isOwnMessage = message.sender._id === user?._id
                return (
                  <div
                    key={message._id}
                    className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`flex items-end space-x-2 max-w-xs md:max-w-md lg:max-w-lg ${isOwnMessage ? "flex-row-reverse space-x-reverse" : ""}`}
                    >
                      {/* Avatar */}
                      <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">{getInitials(message.sender.name)}</span>
                      </div>

                      {/* Message Bubble */}
                      <div
                        className={`rounded-2xl px-4 py-3 shadow-lg ${
                          isOwnMessage
                            ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-br-md"
                            : "bg-white border border-gray-200 text-gray-800 rounded-bl-md"
                        }`}
                      >
                        {/* Sender Name */}
                        {!isOwnMessage && (
                          <div className="text-xs font-semibold text-emerald-600 mb-1">{message.sender.name}</div>
                        )}

                        {/* Message Text */}
                        <div className="break-words">{message.text}</div>

                        {/* Timestamp */}
                        <div className={`text-xs mt-2 ${isOwnMessage ? "text-emerald-100" : "text-gray-500"}`}>
                          {new Date(message.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start animate-fadeIn">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 text-xs font-bold">...</span>
                  </div>
                  <div className="bg-gray-200 rounded-2xl px-4 py-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce animation-delay-100"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce animation-delay-200"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
            {/* Improved Scroll to bottom arrow */}
            {showScrollToBottom && (
              <button
                onClick={handleScrollToBottom}
                className="absolute bottom-6 right-6 z-30 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-2xl p-4 transition-all duration-200 flex items-center justify-center border-4 border-white"
                style={{ boxShadow: '0 4px 24px 0 rgba(16, 185, 129, 0.25)' }}
                title="Scroll to latest message"
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>

          {/* Message Input */}
          <div className="border-t border-gray-200 bg-white p-6">
            <form onSubmit={handleSendMessage} className="flex items-center space-x-4">
              <div className="flex-1 flex items-center relative">
                {/* Emoji button on the left */}
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker((v) => !v)}
                  className="mr-2 text-2xl p-2 rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 border border-gray-200"
                  aria-label="Add emoji"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M9 9h.01M15 9h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {showEmojiPicker && (
                  <div className="absolute bottom-12 left-0 z-50">
                    <Picker
                      data={data}
                      onEmojiSelect={(emoji: any) => {
                        setNewMessage(newMessage + emoji.native);
                        setShowEmojiPicker(false);
                      }}
                      theme="light"
                    />
                  </div>
                )}
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 pr-12"
                />
              </div>

              <button
                type="submit"
                className="group relative px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-center space-x-2">
                  <svg
                    className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                  <span>Send</span>
                </div>
                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-emerald-400 to-teal-500 blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
              </button>
            </form>
          </div>
        </div>

        {/* Chat Guidelines */}
        <div className="mt-12 bg-white rounded-2xl shadow-lg border border-gray-200 p-8 animate-slideInUp animation-delay-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Chat Guidelines</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-xl mb-4">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Be Respectful</h3>
              <p className="text-gray-600 text-sm">
                Treat all students with respect and maintain professional communication standards.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-teal-100 rounded-xl mb-4">
                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Academic Focus</h3>
              <p className="text-gray-600 text-sm">
                Keep conversations academic and educational to help everyone learn and grow together.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Stay Safe</h3>
              <p className="text-gray-600 text-sm">
                Never share personal information and report any inappropriate behavior immediately.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 text-sm">
            <p>&copy; 2024 Fast Connect. Exclusively for Fast University Students. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default TextChat
