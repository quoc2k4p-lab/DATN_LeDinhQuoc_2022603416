"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Send, X, User, Phone, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getChatMessagesAction } from "@/lib/actions/chatActions";
import { DbChatMessage } from "@/lib/db";
import { useChatSocket } from "@/lib/socket/socket-client";
import { SOCKET_EVENTS } from "@/lib/socket/socket-events";
import { ChatMessagePayload, ReadReceiptPayload } from "@/lib/socket/socket-types";



interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadChange: (count: number) => void;
}

// Map Socket Payload to DB Chat Message structure (defined statically outside component to avoid ESLint warnings)
const mapPayloadToDbMessage = (payload: ChatMessagePayload): DbChatMessage => ({
  id: payload.id,
  session_id: payload.conversationId,
  sender_role: payload.senderType,
  sender_name: payload.senderName,
  message_text: payload.message,
  is_read: payload.isRead,
  created_at: payload.sentAt,
});

export function ChatWindow({ isOpen, onClose, onUnreadChange }: ChatWindowProps) {
  const [mounted, setMounted] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [sessionId, setSessionId] = useState("");
  
  const [messages, setMessages] = useState<DbChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Setup Chat Socket connection
  const {
    isConnected,
    messages: socketMessages,
    sendMessage: emitSendMessage,
    emitTyping,
    emitReadReceipt,
    typingUsers,
    socket,
  } = useChatSocket(
    isRegistered ? sessionId : null,
    isRegistered ? { sessionId, name } : undefined
  );

  // Helper functions defined before useEffect calls to prevent hoisting errors

  const fetchMessages = useCallback(async () => {
    if (!sessionId) return;
    try {
      const res = await getChatMessagesAction(sessionId, "customer");
      if (res.success && res.messages) {
        setMessages(res.messages);
        onUnreadChange(0); // Mark all as read when window is opened
        if (isConnected) {
          emitReadReceipt();
        }
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  }, [sessionId, isConnected, emitReadReceipt, onUnreadChange]);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const guestData = {
      sessionId,
      name: name.trim(),
      phone: phone.trim(),
    };

    window.localStorage.setItem("tq-auto-guest-chat", JSON.stringify(guestData));
    setIsRegistered(true);
  };

  const handleTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    } else {
      emitTyping(true);
    }

    typingTimeoutRef.current = setTimeout(() => {
      emitTyping(false);
      typingTimeoutRef.current = null;
    }, 2000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !sessionId || isSending) return;

    const messageText = inputText.trim();
    setInputText("");
    setIsSending(true);

    // Stop typing indicator immediately when sending
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      emitTyping(false);
      typingTimeoutRef.current = null;
    }

    try {
      emitSendMessage(messageText);
    } catch (err) {
      console.error("Failed to send message:", err);
      setInputText(messageText); // restore text
    } finally {
      setIsSending(false);
    }
  };

  // Initialize identity from LocalStorage on mount
  // Initialize identity from LocalStorage on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
      
      // 1. Check logged in user
      const storedUser = window.localStorage.getItem("tq-auto-user");
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          if (user && user.id) {
            setName(user.name);
            setPhone(user.phone || "");
            setSessionId(user.id);
            setIsRegistered(true);
            return;
          }
        } catch (e) {
          console.error("Error parsing stored user:", e);
        }
      }
  
      // 2. Check existing guest session
      const storedGuest = window.localStorage.getItem("tq-auto-guest-chat");
      if (storedGuest) {
        try {
          const guest = JSON.parse(storedGuest);
          if (guest && guest.sessionId && guest.name) {
            setName(guest.name);
            setPhone(guest.phone || "");
            setSessionId(guest.sessionId);
            setIsRegistered(true);
            return;
          }
        } catch (e) {
          console.error("Error parsing stored guest:", e);
        }
      }
  
      // 3. Prepare new guest session id (not registered yet)
      setSessionId(self.crypto.randomUUID());
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // Fetch initial history when open and registered
  useEffect(() => {
    if (!mounted || !isOpen || !isRegistered || !sessionId) return;
    const timer = setTimeout(() => {
      fetchMessages();
    }, 0);
    return () => clearTimeout(timer);
  }, [mounted, isOpen, isRegistered, sessionId, fetchMessages]);

  // Append new socket messages to UI state asynchronously
  useEffect(() => {
    if (socketMessages.length > 0) {
      const latest = socketMessages[socketMessages.length - 1];
      setTimeout(() => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === latest.id)) return prev;
          return [...prev, mapPayloadToDbMessage(latest)];
        });
      }, 0);
    }
  }, [socketMessages]);

  // Listen for live read receipts
  useEffect(() => {
    if (!socket || !isRegistered || !sessionId) return;

    const handleReadReceipt = (payload: ReadReceiptPayload) => {
      if (payload.conversationId === sessionId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.sender_role === "staff" ? { ...m, is_read: 1 } : m
          )
        );
      }
    };

    socket.on(SOCKET_EVENTS.MESSAGE_READ, handleReadReceipt);
    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE_READ, handleReadReceipt);
    };
  }, [socket, isRegistered, sessionId]);

  // Emit read receipt when chat is opened
  useEffect(() => {
    if (isOpen && isRegistered && sessionId && isConnected) {
      emitReadReceipt();
    }
  }, [isOpen, isRegistered, sessionId, isConnected, emitReadReceipt]);

  // Scroll to bottom when messages list changes or chat opens or typing status changes
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages, isOpen, typingUsers]);

  // Check unread count periodically when chat window is closed
  useEffect(() => {
    if (!mounted || !isRegistered || !sessionId || isOpen) return;

    const interval = setInterval(async () => {
      try {
        const res = await getChatMessagesAction(sessionId, "customer");
        if (res.success && res.messages) {
          const unread = res.messages.filter(
            (m: DbChatMessage) => m.sender_role === "staff" && m.is_read === 0
          ).length;
          onUnreadChange(unread);
        }
      } catch {
        // ignore
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [mounted, isRegistered, sessionId, isOpen, onUnreadChange]);

  if (!mounted || !isOpen) return null;

  const isStaffTyping = Object.keys(typingUsers).some((uId) => uId !== sessionId);

  return (
    <div className="fixed bottom-20 right-4 z-50 flex h-[430px] sm:h-[500px] w-[calc(100vw-32px)] flex-col rounded-xl border border-white/10 bg-[#11161d]/95 shadow-2xl backdrop-blur-xl transition-all duration-300 sm:bottom-24 sm:right-6 sm:w-[380px] overflow-hidden">
      
      {/* Red accent line */}
      <div className="h-1 w-full bg-[#e31837]" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            {isConnected ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-3 w-3 bg-zinc-600 animate-pulse"></span>
            )}
          </span>
          <div>
            <h4 className="font-display text-sm font-extrabold text-white">
              {isConnected ? "Hỗ trợ trực tuyến" : "Mất kết nối..."}
            </h4>
            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
              {isConnected ? "TQ Auto Showroom" : "Đang kết nối lại..."}
            </p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="rounded-full p-1.5 text-zinc-400 hover:bg-white/5 hover:text-white transition"
          aria-label="Đóng khung chat"
        >
          <X size={18} />
        </button>
      </div>

      {/* Chat Body */}
      <div className={`flex-1 p-5 ${!isRegistered ? "overflow-y-auto" : "flex flex-col overflow-hidden"}`}>
        {!isRegistered ? (
          /* Registration Form for Guests */
          <form onSubmit={handleRegister} className="flex h-full flex-col justify-center space-y-4">
            <div className="text-center">
              <p className="text-sm font-medium text-zinc-300">
                Chào mừng bạn đến với **TQ Auto**!
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                Vui lòng cung cấp tên để nhân viên của chúng tôi tiện xưng hô và hỗ trợ bạn.
              </p>
            </div>
            
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-zinc-400">
                Họ và tên <span className="text-[#e31837]">*</span>
              </span>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="h-11 w-full rounded-md border border-white/10 bg-[#080c11] pl-10 pr-4 text-sm text-white outline-none transition focus:border-[#e31837]"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-zinc-400">
                Số điện thoại (tùy chọn)
              </span>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0909888668"
                  className="h-11 w-full rounded-md border border-white/10 bg-[#080c11] pl-10 pr-4 text-sm text-white outline-none transition focus:border-[#e31837]"
                />
              </div>
            </label>

            <Button type="submit" className="w-full h-11 mt-2">
              Bắt đầu trò chuyện
            </Button>
          </form>
        ) : (
          /* Messages Area */
          <div className="flex-1 flex flex-col overflow-hidden">
            {messages.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600/10 text-blue-400">
                  <Send size={22} className="rotate-45" />
                </span>
                <p className="text-sm font-semibold text-zinc-300">Gửi lời chào của bạn!</p>
                <p className="mt-1 text-xs text-zinc-500 max-w-[240px]">
                  Nhân viên chăm sóc khách hàng của TQ Auto sẽ phản hồi bạn trong chốc lát.
                </p>
              </div>
            ) : (
              <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {messages.map((msg) => {
                  const isMe = msg.sender_role === "customer";
                  return (
                    <div 
                      key={msg.id} 
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      <span className="text-[10px] font-bold text-zinc-500 mb-1 px-1">
                        {isMe ? "Bạn" : msg.sender_name}
                      </span>
                      <div
                        className={`rounded-lg px-4 py-2.5 text-sm max-w-[85%] break-words leading-relaxed shadow-sm ${
                          isMe
                            ? "bg-[#e31837] text-white rounded-tr-none"
                            : "bg-[#1f2631] text-zinc-200 rounded-tl-none border border-white/5"
                        }`}
                      >
                        {msg.message_text}
                      </div>
                      
                      {/* Delivery Status and Time */}
                      <div className="flex items-center gap-1 mt-1 px-1">
                        <span className="text-[9px] text-zinc-600">
                          {new Date(msg.created_at).toLocaleTimeString([], { 
                            hour: "2-digit", 
                            minute: "2-digit" 
                          })}
                        </span>
                        {isMe && (
                          msg.is_read === 1 ? (
                            <CheckCheck size={10} className="text-emerald-500" />
                          ) : (
                            <Check size={10} className="text-zinc-600" />
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
                {isStaffTyping && (
                  <div className="flex flex-col items-start mt-2">
                    <span className="text-[10px] font-bold text-zinc-500 mb-1 px-1">
                      Hỗ trợ viên
                    </span>
                    <div className="flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm bg-[#1f2631] text-zinc-400 rounded-tl-none border border-white/5">
                      <span className="flex gap-1.5 items-center py-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "300ms" }}></span>
                      </span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Area */}
      {isRegistered && (
        <form onSubmit={handleSendMessage} className="border-t border-white/5 bg-[#0d1217] p-4 flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              handleTyping();
            }}
            placeholder={isConnected ? "Nhập tin nhắn..." : "Đang kết nối lại..."}
            disabled={isSending || !isConnected}
            className="h-11 flex-1 rounded-md border border-white/10 bg-[#080c11] px-4 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-[#e31837] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending || !isConnected}
            className="flex h-11 w-11 items-center justify-center rounded-md bg-[#e31837] text-white transition hover:bg-[#c1142e] focus:outline-none disabled:opacity-40 disabled:hover:bg-[#e31837]"
            aria-label="Gửi"
          >
            <Send size={16} className="text-white" />
          </button>
        </form>
      )}
    </div>
  );
}
