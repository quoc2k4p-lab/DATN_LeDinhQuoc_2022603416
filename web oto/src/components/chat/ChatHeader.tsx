"use client";

import { Sparkles, Trash2, X } from "lucide-react";

interface ChatHeaderProps {
  onClearHistory: () => void;
  onClose: () => void;
}

export function ChatHeader({ onClearHistory, onClose }: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between bg-gradient-to-r from-[#e31837] to-[#b91c1c] p-4 text-white rounded-t-2xl shadow-md">
      <div className="flex items-center gap-2.5">
        <div className="relative flex items-center justify-center h-9 w-9 rounded-full bg-white/10 text-white border border-white/20">
          <Sparkles size={18} className="animate-pulse" />
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-[#b91c1c]" />
        </div>
        <div>
          <h4 className="font-display text-sm font-bold leading-tight">AI Sales Assistant</h4>
          <p className="text-[10px] text-zinc-200 font-semibold flex items-center gap-1">
            Showroom TQ Auto
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onClearHistory}
          title="Xóa lịch sử trò chuyện"
          className="rounded-lg p-1.5 hover:bg-white/10 transition-colors text-white"
        >
          <Trash2 size={15} />
        </button>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 hover:bg-white/10 transition-colors text-white"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
