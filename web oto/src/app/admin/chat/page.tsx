"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Send, MessageSquare, Check, CheckCheck } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { 
  getConversationsAction, 
  getChatMessagesAction,
  getSocketTokenAction
} from "@/lib/actions/chatActions";
import { DbChatMessage, ChatConversation } from "@/lib/db";
import { useSocket } from "@/lib/socket/socket-client";
import { SOCKET_EVENTS } from "@/lib/socket/socket-events";
import { ChatMessagePayload, ReadReceiptPayload, UserPresence, TypingIndicatorPayload } from "@/lib/socket/socket-types";


function AdminChatPageInner() {
  const searchParams = useSearchParams();
  const sessionParam = searchParams ? searchParams.get("sessionId") || "" : "";

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [activeMessages, setActiveMessages] = useState<DbChatMessage[]>([]);
  const [replyText, setReplyText] = useState("");
  
  const [isSending, setIsSending] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  
  const [socketToken, setSocketToken] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});
  const [isCustomerTyping, setIsCustomerTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Play a brief synth beep to alert staff on new customer message
  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // browser blocked audio context
    }
  };

  // --- Helper Functions first to prevent hoisting/declaration ordering errors ---

  const loadConversations = async () => {
    try {
      const res = await getConversationsAction();
      if (res.success && res.conversations) {
        setConversations(res.conversations);
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const loadMessages = async (sessionId: string) => {
    if (!sessionId) return;
    setIsLoadingMessages(true);
    try {
      const res = await getChatMessagesAction(sessionId, "staff");
      if (res.success && res.messages) {
        setActiveMessages(res.messages);
        
        // Clear unread count locally immediately
        setConversations(prev => 
          prev.map(c => c.sessionId === sessionId ? { ...c, unreadCount: 0 } : c)
        );
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSelectConversation = (sessionId: string) => {
    setActiveSessionId(sessionId);
    loadMessages(sessionId);
  };

  const handleTyping = () => {
    if (!socket || !isConnected || !activeSessionId) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    } else {
      socket.emit(SOCKET_EVENTS.TYPING_START, activeSessionId);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit(SOCKET_EVENTS.TYPING_STOP, activeSessionId);
      typingTimeoutRef.current = null;
    }, 2000);
  };

  // 1. Fetch WebSocket auth token from cookie on mount
  useEffect(() => {
    const fetchToken = async () => {
      const res = await getSocketTokenAction();
      if (res.success && res.token) {
        setSocketToken(res.token);
      }
    };
    fetchToken();
  }, []);

  // 2. Setup Socket connection
  const { socket, isConnected } = useSocket(
    socketToken ? { token: socketToken } : undefined
  );

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeSessionId || isSending || !isConnected) return;

    const messageText = replyText.trim();
    setReplyText("");
    setIsSending(true);

    // Stop typing immediately when sending message
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      socket?.emit(SOCKET_EVENTS.TYPING_STOP, activeSessionId);
      typingTimeoutRef.current = null;
    }

    try {
      socket?.emit(SOCKET_EVENTS.SEND_MESSAGE, {
        conversationId: activeSessionId,
        message: messageText,
      });
    } catch (err) {
      console.error("Failed to send reply:", err);
      setReplyText(messageText); // restore
    } finally {
      setIsSending(false);
    }
  };

  // --- React hooks & subscriptions below function definitions ---

  // Sync active chat session from URL parameters
  useEffect(() => {
    if (sessionParam) {
      setTimeout(() => {
        setActiveSessionId(sessionParam);
        loadMessages(sessionParam);
      }, 0);
    }
  }, [sessionParam]);

  // Get active conversation name
  const activeConversation = conversations.find(c => c.sessionId === activeSessionId);

  // Initial load of conversations list on mount
  useEffect(() => {
    setTimeout(() => {
      loadConversations();
    }, 0);
  }, []);

  // 3. Socket event subscriptions
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listen for presence events
    const handleUserOnline = (presence: UserPresence) => {
      if (presence.role === "customer") {
        setOnlineUsers((prev) => ({ ...prev, [presence.userId]: true }));
      }
    };

    const handleUserOffline = (presence: UserPresence) => {
      if (presence.role === "customer") {
        setOnlineUsers((prev) => ({ ...prev, [presence.userId]: false }));
      }
    };

    // Listen for incoming messages
    const handleReceiveMessage = (msg: ChatMessagePayload) => {
      // Play sound if customer sent a message
      if (msg.senderType === "customer") {
        playBeep();
      }

      // If it belongs to currently active conversation, append to message log
      if (msg.conversationId === activeSessionId) {
        setActiveMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [
            ...prev,
            {
              id: msg.id,
              session_id: msg.conversationId,
              sender_role: msg.senderType,
              sender_name: msg.senderName,
              message_text: msg.message,
              is_read: msg.isRead,
              created_at: msg.sentAt,
            },
          ];
        });

        // Auto mark as read
        socket.emit(SOCKET_EVENTS.MESSAGE_READ, activeSessionId);
      }

      // Update conversations sidebar list item
      setConversations((prevList) => {
        const index = prevList.findIndex((c) => c.sessionId === msg.conversationId);
        let updatedConv: ChatConversation;

        if (index > -1) {
          const existing = prevList[index];
          const unreadIncrement =
            msg.conversationId !== activeSessionId && msg.senderType === "customer" ? 1 : 0;
          
          updatedConv = {
            ...existing,
            lastMessage: msg.message,
            lastTime: msg.sentAt,
            unreadCount: existing.unreadCount + unreadIncrement,
            customerName: msg.senderType === "customer" ? msg.senderName : existing.customerName,
          };
        } else {
          // New customer starts chatting
          updatedConv = {
            sessionId: msg.conversationId,
            customerName: msg.senderType === "customer" ? msg.senderName : "Khách hàng mới",
            lastMessage: msg.message,
            lastTime: msg.sentAt,
            unreadCount: msg.conversationId !== activeSessionId && msg.senderType === "customer" ? 1 : 0,
          };
        }

        const filteredList = prevList.filter((c) => c.sessionId !== msg.conversationId);
        return [updatedConv, ...filteredList].sort(
          (a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime()
        );
      });
    };

    // Listen for customer typing indicators
    const handleTypingStart = (payload: TypingIndicatorPayload) => {
      if (payload.conversationId === activeSessionId && payload.userId !== "staff") {
        setIsCustomerTyping(true);
      }
    };

    const handleTypingStop = (payload: TypingIndicatorPayload) => {
      if (payload.conversationId === activeSessionId && payload.userId !== "staff") {
        setIsCustomerTyping(false);
      }
    };

    // Listen for customer marking messages as read
    const handleMessageRead = (payload: ReadReceiptPayload) => {
      if (payload.conversationId === activeSessionId && payload.userId !== "staff") {
        setActiveMessages((prev) =>
          prev.map((m) =>
            m.sender_role === "staff" ? { ...m, is_read: 1 } : m
          )
        );
      }
    };

    socket.on(SOCKET_EVENTS.USER_ONLINE, handleUserOnline);
    socket.on(SOCKET_EVENTS.USER_OFFLINE, handleUserOffline);
    socket.on(SOCKET_EVENTS.RECEIVE_MESSAGE, handleReceiveMessage);
    socket.on(SOCKET_EVENTS.TYPING_START, handleTypingStart);
    socket.on(SOCKET_EVENTS.TYPING_STOP, handleTypingStop);
    socket.on(SOCKET_EVENTS.MESSAGE_READ, handleMessageRead);

    return () => {
      socket.off(SOCKET_EVENTS.USER_ONLINE, handleUserOnline);
      socket.off(SOCKET_EVENTS.USER_OFFLINE, handleUserOffline);
      socket.off(SOCKET_EVENTS.RECEIVE_MESSAGE, handleReceiveMessage);
      socket.off(SOCKET_EVENTS.TYPING_START, handleTypingStart);
      socket.off(SOCKET_EVENTS.TYPING_STOP, handleTypingStop);
      socket.off(SOCKET_EVENTS.MESSAGE_READ, handleMessageRead);
    };
  }, [socket, isConnected, activeSessionId]);

  // Join/leave active customer rooms and emit read receipts when switching conversations
  useEffect(() => {
    if (!socket || !isConnected || !activeSessionId) return;

    socket.emit(SOCKET_EVENTS.JOIN_ROOM, activeSessionId);
    socket.emit(SOCKET_EVENTS.MESSAGE_READ, activeSessionId);

    // Reset customer typing status when changing room asynchronously to prevent cascading renders
    const timer = setTimeout(() => {
      setIsCustomerTyping(false);
    }, 0);

    return () => {
      clearTimeout(timer);
      socket.emit(SOCKET_EVENTS.LEAVE_ROOM, activeSessionId);
    };
  }, [socket, isConnected, activeSessionId]);

  // Scroll to bottom when messages list changes or customer is typing
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages, isCustomerTyping]);


  return (
    <AdminShell 
      title="Tư vấn trực tuyến" 
      subtitle="Trò chuyện thời gian thực với khách hàng đang truy cập hệ thống showroom."
    >
      <div className="grid h-[calc(100vh-270px)] min-h-[500px] grid-cols-1 rounded-md border border-white/10 bg-[#11151c] lg:grid-cols-[300px_1fr] overflow-hidden">
        
        {/* Left Side: Conversations List */}
        <div className="flex flex-col border-r border-white/10 bg-[#0c0f14] min-h-0 overflow-hidden">
          <div className="border-b border-white/10 p-4">
            <h3 className="font-display font-bold text-white text-sm">Hội thoại đang hoạt động</h3>
            <p className="text-[10px] text-zinc-400 mt-1 uppercase tracking-wider">Thời gian thực (WebSockets)</p>
          </div>
          
          <div className="flex-1 overflow-y-auto divide-y divide-white/5">
            {isLoadingConversations ? (
              <div className="flex h-40 items-center justify-center text-sm text-zinc-500">
                Đang tải danh sách...
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center h-40 text-zinc-500">
                <MessageSquare size={24} className="mb-2 text-zinc-600" />
                <p className="text-sm font-semibold">Chưa có hội thoại nào</p>
                <p className="text-xs text-zinc-600 mt-1">Hệ thống sẽ tự động cập nhật khi khách hàng gửi tin nhắn mới.</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isActive = conv.sessionId === activeSessionId;
                const isOnline = onlineUsers[conv.sessionId];
                return (
                  <button
                    key={conv.sessionId}
                    onClick={() => handleSelectConversation(conv.sessionId)}
                    className={`w-full p-4 text-left transition duration-200 hover:bg-white/5 flex flex-col gap-1.5 ${
                      isActive ? "bg-[#e31837]/10 border-l-2 border-[#e31837] hover:bg-[#e31837]/10" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm font-bold text-white">
                        <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-300">
                          {conv.customerName.charAt(0).toUpperCase()}
                          {isOnline && (
                            <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 border border-zinc-900 animate-pulse"></span>
                          )}
                        </span>
                        {conv.customerName}
                      </span>
                      <span className="text-[9px] font-semibold text-zinc-500">
                        {new Date(conv.lastTime).toLocaleTimeString([], { 
                          hour: "2-digit", 
                          minute: "2-digit" 
                        })}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-zinc-400 truncate max-w-[200px]">
                        {conv.lastMessage}
                      </span>
                      {conv.unreadCount > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#e31837] px-1 text-[9px] font-bold text-white">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Chat Window */}
        <div className="flex flex-col bg-[#11151c] min-h-0 overflow-hidden">
          {activeSessionId ? (
            /* Active Conversation Chat */
            <>
              {/* Active Conversation Header */}
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-[#0c0f14]/50">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e31837]/10 border border-[#e31837]/20 text-xs font-bold text-[#e31837]">
                    {activeConversation?.customerName.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-white">{activeConversation?.customerName}</h4>
                    <p className="text-[10px] text-zinc-500 font-mono">Session: {activeSessionId}</p>
                  </div>
                </div>
                
                {onlineUsers[activeSessionId] ? (
                  <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Đang trực tuyến
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-md bg-zinc-500/10 border border-zinc-500/20 px-3 py-1 text-xs text-zinc-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-500"></span>
                    Ngoại tuyến
                  </div>
                )}
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {isLoadingMessages ? (
                  <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                    Đang tải cuộc hội thoại...
                  </div>
                ) : (
                  activeMessages.map((msg) => {
                    const isStaff = msg.sender_role === "staff";
                    return (
                      <div 
                        key={msg.id} 
                        className={`flex flex-col ${isStaff ? "items-end" : "items-start"}`}
                      >
                        <span className="text-[10px] font-bold text-zinc-500 mb-1 px-1">
                          {isStaff ? "Bạn (Hỗ trợ viên)" : msg.sender_name}
                        </span>
                        <div
                          className={`rounded-lg px-4 py-2.5 text-sm max-w-[70%] break-words leading-relaxed shadow-sm ${
                            isStaff
                              ? "bg-blue-600 text-white rounded-tr-none"
                              : "bg-[#1f2631] text-zinc-200 rounded-tl-none border border-white/5"
                          }`}
                        >
                          {msg.message_text}
                        </div>
                        <div className="flex items-center gap-1 mt-1 px-1">
                          <span className="text-[9px] text-zinc-600">
                            {new Date(msg.created_at).toLocaleTimeString([], { 
                              hour: "2-digit", 
                              minute: "2-digit" 
                            })}
                          </span>
                          {isStaff && (
                            msg.is_read === 1 ? (
                              <CheckCheck size={10} className="text-emerald-500" />
                            ) : (
                              <Check size={10} className="text-zinc-600" />
                            )
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                {isCustomerTyping && (
                  <div className="flex flex-col items-start mt-2">
                    <span className="text-[10px] font-bold text-zinc-500 mb-1 px-1">
                      {activeConversation?.customerName || "Khách hàng"} đang nhập...
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

              {/* Chat Input */}
              <form onSubmit={handleSendReply} className="border-t border-white/10 bg-[#0c0f14]/50 p-4 flex gap-3">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => {
                    setReplyText(e.target.value);
                    handleTyping();
                  }}
                  placeholder={isConnected ? `Phản hồi ${activeConversation?.customerName}...` : "Đang kết nối lại..."}
                  disabled={isSending || !isConnected}
                  className="h-12 flex-1 rounded-md border border-white/10 bg-[#080c11] px-4 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-blue-500 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || isSending || !isConnected}
                  className="flex h-12 px-5 items-center justify-center gap-2 rounded-md bg-blue-600 text-white transition hover:bg-blue-500 focus:outline-none disabled:opacity-40 disabled:hover:bg-blue-600 font-bold text-sm"
                >
                  <Send size={15} />
                  Gửi phản hồi
                </button>
              </form>
            </>
          ) : (
            /* Welcome Placeholder */
            <div className="flex flex-1 flex-col items-center justify-center text-center p-8">
              <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5 border border-white/10 text-zinc-400">
                <MessageSquare size={28} />
              </span>
              <h3 className="font-display text-lg font-bold text-white">Quản lý tư vấn khách hàng</h3>
              <p className="text-sm text-zinc-500 mt-2 max-w-sm">
                Chọn một cuộc trò chuyện từ danh sách bên trái để xem nội dung và hỗ trợ khách hàng ngay tức thì.
              </p>
            </div>
          )}
        </div>

      </div>
    </AdminShell>
  );
}

export default function AdminChatPage() {
  return (
    <Suspense fallback={
      <AdminShell 
        title="Tư vấn trực tuyến" 
        subtitle="Trò chuyện thời gian thực với khách hàng đang truy cập hệ thống showroom."
      >
        <div className="flex h-[calc(100vh-270px)] min-h-[500px] items-center justify-center rounded-md border border-white/10 bg-[#11151c] text-sm text-zinc-500">
          Đang tải cuộc trò chuyện...
        </div>
      </AdminShell>
    }>
      <AdminChatPageInner />
    </Suspense>
  );
}
