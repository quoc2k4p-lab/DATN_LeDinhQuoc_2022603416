"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Send, User, MessageSquare, AlertCircle, Check, CheckCheck } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { 
  getConversationsAction, 
  getChatMessagesAction, 
  sendChatMessageAction 
} from "@/lib/actions/chatActions";
import { DbChatMessage, ChatConversation } from "@/lib/db";

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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Sync active chat session from URL parameters
  useEffect(() => {
    if (sessionParam) {
      setActiveSessionId(sessionParam);
      loadMessages(sessionParam);
    }
  }, [sessionParam]);

  // Get active conversation name
  const activeConversation = conversations.find(c => c.sessionId === activeSessionId);

  // Initial load
  useEffect(() => {
    loadConversations();
    
    // Poll conversations and active messages every 3 seconds
    pollingRef.current = setInterval(() => {
      pollData();
    }, 3000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [activeSessionId]); // Recreate interval with updated activeSessionId to poll its messages

  // Scroll to bottom when messages list changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages]);

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

  const pollData = async () => {
    try {
      // 1. Poll conversations
      const convRes = await getConversationsAction();
      if (convRes.success && convRes.conversations) {
        setConversations(convRes.conversations);
      }

      // 2. Poll active chat messages
      if (activeSessionId) {
        const msgRes = await getChatMessagesAction(activeSessionId, "staff");
        if (msgRes.success && msgRes.messages) {
          // Check if messages list changed
          const hasUpdates = 
            msgRes.messages.length !== activeMessages.length ||
            (msgRes.messages.length > 0 && 
             msgRes.messages[msgRes.messages.length - 1].id !== activeMessages[activeMessages.length - 1]?.id);

          if (hasUpdates) {
            setActiveMessages(msgRes.messages);
          }
        }
      }
    } catch (e) {
      // quiet fail for polling
    }
  };

  const handleSelectConversation = (sessionId: string) => {
    setActiveSessionId(sessionId);
    loadMessages(sessionId);
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeSessionId || isSending) return;

    const messageText = replyText.trim();
    setReplyText("");
    setIsSending(true);

    // Optimistically add message to UI
    const tempMsg: DbChatMessage = {
      id: Math.random().toString(),
      session_id: activeSessionId,
      sender_role: "staff",
      sender_name: "Hỗ trợ viên",
      message_text: messageText,
      is_read: 0,
      created_at: new Date().toISOString(),
    };
    setActiveMessages(prev => [...prev, tempMsg]);

    try {
      const res = await sendChatMessageAction(activeSessionId, "staff", "Hỗ trợ viên", messageText);
      if (res.success && res.chatMessage) {
        // Replace temp message with actual database message
        setActiveMessages(prev => 
          prev.map(m => m.id === tempMsg.id ? res.chatMessage! : m)
        );
        // Refresh conversations list to update last message/time
        loadConversations();
      }
    } catch (err) {
      console.error("Failed to send reply:", err);
      // Remove temp message on failure
      setActiveMessages(prev => prev.filter(m => m.id !== tempMsg.id));
      setReplyText(messageText); // restore text
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AdminShell 
      title="Tư vấn trực tuyến" 
      subtitle="Trò chuyện thời gian thực với khách hàng đang truy cập hệ thống showroom."
    >
      <div className="grid h-[calc(100vh-270px)] min-h-[500px] grid-cols-1 rounded-md border border-white/10 bg-[#11151c] lg:grid-cols-[300px_1fr] overflow-hidden">
        
        {/* Left Side: Conversations List */}
        <div className="flex flex-col border-r border-white/10 bg-[#0c0f14]">
          <div className="border-b border-white/10 p-4">
            <h3 className="font-display font-bold text-white text-sm">Hội thoại đang hoạt động</h3>
            <p className="text-[10px] text-zinc-400 mt-1 uppercase tracking-wider">Cập nhật tự động mỗi 3 giây</p>
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
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-300">
                          {conv.customerName.charAt(0).toUpperCase()}
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
        <div className="flex flex-col bg-[#11151c]">
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
                
                <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Đang trực tuyến
                </div>
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
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendReply} className="border-t border-white/10 bg-[#0c0f14]/50 p-4 flex gap-3">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Phản hồi ${activeConversation?.customerName}...`}
                  disabled={isSending}
                  className="h-12 flex-1 rounded-md border border-white/10 bg-[#080c11] px-4 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-blue-500 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || isSending}
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
