"use client";

import { usePathname } from "next/navigation";
import { MessageSquare, Phone, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { ChatWindow } from "./ChatWindow";

export function FloatingContact() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Hide on admin routes
  if (!mounted || pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4">
        {/* Call Button */}
        <a
          href="tel:0909888668"
          className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-950/20 transition-all duration-300 hover:-translate-y-1 hover:bg-emerald-500 hover:shadow-xl hover:shadow-emerald-500/30 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-[var(--background)]"
          aria-label="Gọi hotline tư vấn"
        >
          <Phone size={22} className="animate-[pulse_2s_infinite]" />
          
          {/* Tooltip */}
          <span className="absolute right-16 scale-95 opacity-0 rounded-md border theme-border bg-[var(--surface)]/95 px-3 py-1.5 text-xs font-bold text-[var(--foreground)] shadow-xl backdrop-blur-md transition-all duration-300 group-hover:scale-100 group-hover:opacity-100 whitespace-nowrap pointer-events-none">
            Hotline: 0909 888 668
          </span>

          {/* Pulse effect */}
          <span className="absolute -inset-1 -z-10 animate-ping rounded-full bg-emerald-600/30 opacity-75" />
        </a>

        {/* Chat Toggle Button */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`group relative flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg shadow-blue-950/20 transition-all duration-300 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-[var(--background)] ${
            isChatOpen ? "bg-[var(--muted)] hover:bg-[var(--surface-strong)]" : "bg-blue-600 hover:bg-blue-500 hover:shadow-blue-500/30"
          }`}
          aria-label="Mở chat hỗ trợ"
        >
          {isChatOpen ? <MessageSquare size={22} /> : <MessageCircle size={24} />}
          
          {/* Unread Badge UI */}
          {!isChatOpen && unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#e31837] text-[10px] font-bold text-white ring-2 ring-[var(--background)]">
              {unreadCount}
            </span>
          )}

          {/* Tooltip */}
          <span className="absolute right-16 scale-95 opacity-0 rounded-md border theme-border bg-[var(--surface)]/95 px-3 py-1.5 text-xs font-bold text-[var(--foreground)] shadow-xl backdrop-blur-md transition-all duration-300 group-hover:scale-100 group-hover:opacity-100 whitespace-nowrap pointer-events-none">
            {isChatOpen ? "Đóng khung chat" : "Chat hỗ trợ trực tuyến"}
          </span>
        </button>
      </div>

      {/* Embedded Floating Chat Window */}
      <ChatWindow 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        onUnreadChange={setUnreadCount}
      />
    </>
  );
}
