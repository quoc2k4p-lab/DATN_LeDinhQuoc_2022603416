"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare, Sparkles, Loader2, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocale } from "next-intl";
import { ChatHeader } from "./ChatHeader";
import { ChatInput } from "./ChatInput";
import { ChatMessage, Message } from "./ChatMessage";
import { clearChatHistoryAction } from "@/lib/actions/chatActions";

const WELCOME_MESSAGE: Message = {
  role: "model",
  content: `Xin chào! 👋 Tôi là trợ lý AI Sales Assistant của showroom TQ Auto. 

Tôi có thể hỗ trợ bạn:
🚗 Đề xuất & tìm dòng xe phù hợp nhất với tầm tiền
⚖️ So sánh chi tiết thông số kỹ thuật các xe
💰 Ước tính phương án tài chính trả góp ngân hàng
📅 Đặt lịch lái thử và xem xe trực tiếp tại showroom

Bạn đang quan tâm dòng xe nào hoặc có nhu cầu như thế nào hôm nay?`,
};

export function ChatWidget() {
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [isSupportChatOpen, setIsSupportChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Synchronize chat widget states via custom events
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    const handleClose = () => setIsOpen(false);
    const handleSupportOpen = () => setIsSupportChatOpen(true);
    const handleSupportClose = () => setIsSupportChatOpen(false);

    window.addEventListener("open-ai-chat", handleOpen);
    window.addEventListener("close-ai-chat", handleClose);
    window.addEventListener("support-chat-opened", handleSupportOpen);
    window.addEventListener("support-chat-closed", handleSupportClose);

    return () => {
      window.removeEventListener("open-ai-chat", handleOpen);
      window.removeEventListener("close-ai-chat", handleClose);
      window.removeEventListener("support-chat-opened", handleSupportOpen);
      window.removeEventListener("support-chat-closed", handleSupportClose);
    };
  }, []);

  const handleOpenChat = () => {
    setIsOpen(true);
    window.dispatchEvent(new Event("ai-chat-opened"));
    window.dispatchEvent(new Event("close-support-chat"));
  };

  const handleCloseChat = () => {
    setIsOpen(false);
    window.dispatchEvent(new Event("ai-chat-closed"));
  };

  const [viewportStyle, setViewportStyle] = useState<React.CSSProperties>({});

  // Listen to visualViewport resizing to handle mobile virtual keyboards nicely
  useEffect(() => {
    if (!isOpen || typeof window === "undefined" || !window.visualViewport) {
      setViewportStyle({});
      return;
    }

    const handleResize = () => {
      const vv = window.visualViewport;
      if (!vv) return;

      if (window.innerWidth < 640) {
        // On mobile, size container to exactly the visible viewport height & position it relative to the keyboard
        setViewportStyle({
          height: `${vv.height}px`,
          bottom: `${window.innerHeight - vv.height - vv.offsetTop}px`,
        });
      } else {
        setViewportStyle({});
      }
    };

    const vv = window.visualViewport;
    vv.addEventListener("resize", handleResize);
    vv.addEventListener("scroll", handleResize);
    handleResize();

    return () => {
      vv.removeEventListener("resize", handleResize);
      vv.removeEventListener("scroll", handleResize);
    };
  }, [isOpen]);

  // Initialize Session ID
  useEffect(() => {
    let id = window.localStorage.getItem("tq-auto-ai-session");
    if (!id) {
      id = "ai-session-" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      window.localStorage.setItem("tq-auto-ai-session", id);
    }
    setSessionId(id);
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    // 1. Add user message
    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    // 2. Fetch API
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: text,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Extract tool outputs if any
        const recs = data.executedTools?.find((t: any) => t.name === "recommendCars")?.result?.recommendations;
        const comps = data.executedTools?.find((t: any) => t.name === "compareCars")?.result?.comparisonTable;

        const aiMsg: Message = {
          role: "model",
          content: data.text,
          recommendations: recs,
          comparisonTable: comps,
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "model",
            content: data.error || "Có lỗi xảy ra khi xử lý phản hồi từ AI.",
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          content: "Không thể kết nối đến máy chủ trợ lý AI. Vui lòng kiểm tra kết nối mạng.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện với trợ lý AI?")) {
      setIsLoading(true);
      const res = await clearChatHistoryAction(sessionId);
      setIsLoading(false);
      if (res.success) {
        setMessages([WELCOME_MESSAGE]);
      }
    }
  };

  return (
    <>
      {/* Chat Box Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 30 }}
            transition={{ duration: 0.25 }}
            style={viewportStyle}
            className="fixed bottom-0 right-0 z-50 w-full h-[100dvh] sm:bottom-20 sm:right-6 sm:w-[380px] sm:h-[530px] flex flex-col rounded-t-2xl sm:rounded-2xl border border-[var(--line)] bg-[var(--surface)]/95 shadow-2xl backdrop-blur-md overflow-hidden"
          >
            {/* Header */}
            <ChatHeader onClearHistory={handleClearHistory} onClose={handleCloseChat} />

            {/* Message History Screen */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent"
            >
              {messages.map((msg, idx) => (
                <ChatMessage key={idx} message={msg} locale={locale} />
              ))}

              {isLoading && (
                <div className="flex items-center gap-2 text-zinc-500 pl-2">
                  <Loader2 size={16} className="animate-spin text-[#e31837]" />
                  <span className="text-[11px] font-semibold animate-pulse">
                    AI đang phân tích và tìm thông tin...
                  </span>
                </div>
              )}
            </div>

            {/* Input Form */}
            <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
