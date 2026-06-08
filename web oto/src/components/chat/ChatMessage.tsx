"use client";

import { motion } from "framer-motion";
import { Sparkles, User, Table } from "lucide-react";
import { CarRecommendationCard, CarRecommendation } from "./CarRecommendationCard";

export interface Message {
  role: "user" | "model" | "system";
  content: string;
  recommendations?: CarRecommendation[];
  comparisonTable?: any[];
}

interface ChatMessageProps {
  message: Message;
  locale: string;
}

export function ChatMessage({ message, locale }: ChatMessageProps) {
  const isModel = message.role === "model";
  
  // Custom parser to format markdown lists/bolding safely
  const formatText = (text: string) => {
    return text.split("\n").map((line, idx) => {
      // Check for bullet points
      if (line.trim().startsWith("* ") || line.trim().startsWith("- ")) {
        return (
          <li key={idx} className="ml-4 list-disc text-xs leading-relaxed text-zinc-300 my-0.5">
            {parseInlineStyles(line.trim().substring(2))}
          </li>
        );
      }
      return (
        <p key={idx} className="text-xs leading-relaxed text-zinc-300 my-1 min-h-[1em]">
          {parseInlineStyles(line)}
        </p>
      );
    });
  };

  const parseInlineStyles = (text: string) => {
    // Basic regex replacement for bold **text**
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={index} className="font-extrabold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 mb-4 ${!isModel ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar Icon */}
      <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 border ${
        isModel
          ? "bg-[#e31837]/10 border-[#e31837]/20 text-[#e31837]"
          : "bg-zinc-800 border-zinc-700 text-zinc-400"
      }`}>
        {isModel ? <Sparkles size={14} /> : <User size={14} />}
      </div>

      {/* Bubble Container */}
      <div className="max-w-[78%] space-y-3">
        {/* Main text bubble */}
        <div className={`rounded-2xl p-3.5 ${
          isModel
            ? "bg-[#151a22] border border-white/5 text-zinc-200"
            : "bg-[#e31837] text-white rounded-tr-none font-medium"
        }`}>
          {isModel ? (
            <div className="space-y-0.5">{formatText(message.content)}</div>
          ) : (
            <p className="text-xs leading-relaxed text-white whitespace-pre-wrap">{message.content}</p>
          )}
        </div>

        {/* Embedded Car Recommendations */}
        {isModel && message.recommendations && message.recommendations.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 mt-1">
            {message.recommendations.map((car) => (
              <CarRecommendationCard key={car.id} car={car} locale={locale} />
            ))}
          </div>
        )}

        {/* Embedded Comparison Table */}
        {isModel && message.comparisonTable && message.comparisonTable.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-[#0d1016] p-3 overflow-hidden mt-1">
            <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-bold uppercase mb-2">
              <Table size={12} className="text-[#e31837]" /> Bảng so sánh nhanh
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[10px] border-collapse min-w-[280px]">
                <thead>
                  <tr className="border-b border-white/10 text-zinc-500 font-bold">
                    <th className="pb-1.5 pr-2">Thông số</th>
                    {message.comparisonTable.map((car, idx) => (
                      <th key={idx} className="pb-1.5 px-2 text-white truncate max-w-[80px]">
                        {car.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-zinc-300">
                  <tr>
                    <td className="py-1.5 text-zinc-500 font-semibold">Giá bán</td>
                    {message.comparisonTable.map((car, idx) => (
                      <td key={idx} className="py-1.5 px-2 font-bold text-[#e31837]">
                        {new Intl.NumberFormat("vi-VN").format(car.price)}đ
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-1.5 text-zinc-500 font-semibold">Động cơ</td>
                    {message.comparisonTable.map((car, idx) => (
                      <td key={idx} className="py-1.5 px-2 truncate max-w-[80px]">
                        {car.engine || "N/A"}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-1.5 text-zinc-500 font-semibold">Nhiên liệu</td>
                    {message.comparisonTable.map((car, idx) => (
                      <td key={idx} className="py-1.5 px-2">
                        {car.fuel || "N/A"}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-1.5 text-zinc-500 font-semibold">An toàn</td>
                    {message.comparisonTable.map((car, idx) => (
                      <td key={idx} className="py-1.5 px-2 font-bold text-emerald-400">
                        {car.safetyScore}/100
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
