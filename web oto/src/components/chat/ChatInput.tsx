"use client";

import { useState, FormEvent, KeyboardEvent } from "react";
import { Send, Car, ArrowRightLeft, DollarSign, Calendar } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (msg: string) => void;
  isLoading: boolean;
}

const SUGGESTIONS = [
  { text: "🚗 Đề xuất xe phù hợp", prompt: "Tôi cần tìm xe ô tô phù hợp, hãy hỏi tôi các câu hỏi khảo sát" },
  { text: "⚖️ So sánh xe", prompt: "Tôi muốn so sánh xe, hãy hỏi tôi muốn so sánh những dòng xe nào" },
  { text: "💰 Tính trả góp", prompt: "Tôi muốn tính phí trả góp, hãy hỏi tôi muốn tính trả góp cho dòng xe nào" },
  { text: "📅 Đặt lịch lái thử", prompt: "Tôi muốn đăng ký đặt lịch hẹn lái thử xe" },
];

export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [text, setText] = useState("");

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    if (!text.trim() || isLoading) return;
    onSendMessage(text.trim());
    setText("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-[var(--line)] bg-[var(--surface-strong)] p-3 space-y-3">
      {/* Suggestions Row */}
      <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        {SUGGESTIONS.map((s, idx) => (
          <button
            key={idx}
            onClick={() => onSendMessage(s.prompt)}
            disabled={isLoading}
            className="flex-shrink-0 rounded-lg border border-[var(--line)] bg-[var(--muted)] px-2.5 py-1 text-[10px] font-bold text-[var(--subtle)] hover:border-[#e31837]/35 hover:text-[var(--foreground)] transition disabled:opacity-50"
          >
            {s.text}
          </button>
        ))}
      </div>

      {/* Actual Input Row */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          placeholder="Hỏi trợ lý TQ Auto..."
          className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--background)] px-4 py-2.5 text-base sm:text-xs text-[var(--foreground)] placeholder-[var(--subtle)]/70 focus:border-[#e31837] focus:outline-none transition disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!text.trim() || isLoading}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e31837] text-white hover:bg-[#c1132a] transition disabled:opacity-35 disabled:hover:bg-[#e31837]"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
