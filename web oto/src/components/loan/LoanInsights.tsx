"use client";

import { motion } from "framer-motion";
import { Sparkles, TrendingDown, ArrowRight } from "lucide-react";
import { LoanInsightItem } from "@/lib/loan/loan-insight";

interface LoanInsightsProps {
  insights: LoanInsightItem[];
  onApplyInsight: (item: LoanInsightItem) => void;
}

export function LoanInsights({ insights, onApplyInsight }: LoanInsightsProps) {
  if (insights.length === 0) return null;

  const fmt = (val: number) => {
    return new Intl.NumberFormat("vi-VN").format(Math.round(val)) + " VNĐ";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="text-[#e31837]" size={18} />
        <h4 className="font-display text-base font-bold text-foreground">
          Gợi ý tối ưu tài chính từ TQ Auto AI
        </h4>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {insights.map((item, idx) => (
          <motion.div
            key={item.type}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.1 }}
            className="group relative overflow-hidden rounded-xl border border-line bg-surface p-5 hover:border-[#e31837]/30 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#e31837]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#e31837]">
                  {item.type === "down_payment" ? "Tỷ lệ trả trước" : "Kỳ hạn vay"}
                </span>
                <span className="flex items-center gap-1 text-xs text-emerald-400 font-bold">
                  <TrendingDown size={14} />
                  Tiết kiệm {fmt(item.savings)}
                </span>
              </div>

              <h5 className="font-display text-sm font-bold text-foreground mb-2 group-hover:text-[#e31837] transition-colors">
                {item.title}
              </h5>
              <p className="text-xs text-subtle leading-relaxed mb-4">
                {item.description}
              </p>
            </div>

            <button
              onClick={() => onApplyInsight(item)}
              className="mt-auto inline-flex items-center gap-1.5 text-xs font-bold text-[#e31837] hover:text-[#c1132a] transition-colors bg-muted hover:bg-muted/80 rounded-lg py-2 px-3 justify-center cursor-pointer"
            >
              Áp dụng thay đổi này
              <ArrowRight size={12} className="transform transition-transform group-hover:translate-x-0.5" />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
