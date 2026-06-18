"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Phone, ChevronUp, Sparkles, MessageSquare, MessageCircle } from "lucide-react";
import { ChatWindow } from "@/components/floating/ChatWindow";

export function FloatingContactButtons() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setMounted(true);

    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    const handleAiOpen = () => {
      setIsAiChatOpen(true);
      setIsChatOpen(false);
    };
    const handleAiClose = () => setIsAiChatOpen(false);
    const handleSupportClose = () => setIsChatOpen(false);

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("ai-chat-opened", handleAiOpen);
    window.addEventListener("ai-chat-closed", handleAiClose);
    window.addEventListener("close-support-chat", handleSupportClose);

    // Initial check
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("ai-chat-opened", handleAiOpen);
      window.removeEventListener("ai-chat-closed", handleAiClose);
      window.removeEventListener("close-support-chat", handleSupportClose);
    };
  }, []);

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleToggleAiChat = () => {
    if (isAiChatOpen) {
      window.dispatchEvent(new Event("close-ai-chat"));
      setIsAiChatOpen(false);
    } else {
      setIsChatOpen(false);
      window.dispatchEvent(new Event("close-support-chat"));
      window.dispatchEvent(new Event("open-ai-chat"));
      setIsAiChatOpen(true);
    }
  };

  const handleToggleSupportChat = () => {
    const nextState = !isChatOpen;
    setIsChatOpen(nextState);
    if (nextState) {
      setIsAiChatOpen(false);
      window.dispatchEvent(new Event("close-ai-chat"));
      window.dispatchEvent(new Event("support-chat-opened"));
    } else {
      window.dispatchEvent(new Event("support-chat-closed"));
    }
  };

  const isAdminPage = 
    pathname?.startsWith("/admin") || 
    pathname?.startsWith("/staff") || 
    pathname?.startsWith("/dashboard") ||
    pathname?.includes("/admin/") ||
    pathname?.includes("/staff/") ||
    pathname?.includes("/dashboard/");

  if (!mounted || isAdminPage) return null;

  // Hide the floating button panel when either chat is open to avoid blocking the chat box UI
  const isAnyChatOpen = isAiChatOpen || isChatOpen;

  return (
    <>
      {!isAnyChatOpen && (
        <div
          className="fixed z-[9999] flex flex-col gap-2.5 md:gap-3 right-[12px] bottom-[80px] md:right-[20px] md:bottom-[100px]"
          style={{ zIndex: 9999 }}
        >
          {/* Scroll To Top Button */}
          {showScrollTop && (
            <button
              onClick={handleScrollToTop}
              className="group relative flex h-11 w-11 md:h-14 md:w-14 items-center justify-center rounded-full bg-zinc-800 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-zinc-700 focus:outline-none"
              aria-label="Cuộn lên đầu trang"
            >
              <ChevronUp className="h-5 w-5 md:h-6 md:w-6" />
              
              {/* Tooltip */}
              <span className="absolute right-16 scale-95 opacity-0 rounded-md border border-white/10 bg-zinc-900/95 px-3 py-1.5 text-xs font-bold text-white shadow-xl backdrop-blur-md transition-all duration-300 group-hover:scale-100 group-hover:opacity-100 whitespace-nowrap pointer-events-none">
                Cuộn lên đầu
              </span>
            </button>
          )}

          {/* Hotline Call Button */}
          <a
            href="tel:0348115938"
            className="group relative flex h-11 w-11 md:h-14 md:w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-emerald-500 focus:outline-none"
            aria-label="Gọi hotline tư vấn"
          >
            <Phone className="h-5 w-5 md:h-[22px] md:w-[22px] animate-[pulse_2s_infinite]" />
            
            {/* Tooltip */}
            <span className="absolute right-16 scale-95 opacity-0 rounded-md border border-white/10 bg-zinc-900/95 px-3 py-1.5 text-xs font-bold text-white shadow-xl backdrop-blur-md transition-all duration-300 group-hover:scale-100 group-hover:opacity-100 whitespace-nowrap pointer-events-none">
              Hotline: 0348 115 938
            </span>

            {/* Pulse effect */}
            <span className="absolute -inset-1 -z-10 animate-ping rounded-full bg-emerald-600/30 opacity-75" />
          </a>

          {/* AI Chat Button */}
          <button
            onClick={handleToggleAiChat}
            className="group relative flex h-11 w-11 md:h-14 md:w-14 items-center justify-center rounded-full bg-[#e31837] text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-[#c1132a] focus:outline-none"
            aria-label="Trò chuyện với AI"
          >
            <Sparkles className="h-5 w-5 md:h-[22px] md:w-[22px]" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3 md:h-3.5 md:w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[7px] md:text-[8px] font-bold border border-[#0d1016]">
              AI
            </span>

            {/* Tooltip */}
            <span className="absolute right-16 scale-95 opacity-0 rounded-md border border-white/10 bg-zinc-900/95 px-3 py-1.5 text-xs font-bold text-white shadow-xl backdrop-blur-md transition-all duration-300 group-hover:scale-100 group-hover:opacity-100 whitespace-nowrap pointer-events-none">
              Tư vấn AI
            </span>
          </button>

          {/* Live Support Chat Button */}
          <button
            onClick={handleToggleSupportChat}
            className="group relative flex h-11 w-11 md:h-14 md:w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-blue-500 focus:outline-none"
            aria-label="Chat trực tiếp với nhân viên"
          >
            <MessageCircle className="h-5.5 w-5.5 md:h-6 md:w-6" />
            
            {/* Unread Badge UI */}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 md:h-5 md:w-5 items-center justify-center rounded-full bg-[#e31837] text-[8px] md:text-[10px] font-bold text-white ring-1 md:ring-2 ring-[var(--background)]">
                {unreadCount}
              </span>
            )}

            {/* Tooltip */}
            <span className="absolute right-16 scale-95 opacity-0 rounded-md border border-white/10 bg-zinc-900/95 px-3 py-1.5 text-xs font-bold text-white shadow-xl backdrop-blur-md transition-all duration-300 group-hover:scale-100 group-hover:opacity-100 whitespace-nowrap pointer-events-none">
              Chat với nhân viên
            </span>
          </button>
        </div>
      )}

      {/* Embedded Floating Chat Window */}
      <ChatWindow 
        isOpen={isChatOpen} 
        onClose={() => {
          setIsChatOpen(false);
          window.dispatchEvent(new Event("support-chat-closed"));
        }} 
        onUnreadChange={setUnreadCount}
      />
    </>
  );
}
