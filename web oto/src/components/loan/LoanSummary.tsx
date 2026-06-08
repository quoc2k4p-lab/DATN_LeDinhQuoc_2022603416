"use client";

import { motion } from "framer-motion";
import { DollarSign, Percent, Calendar, CreditCard, ArrowRight } from "lucide-react";

interface LoanSummaryProps {
  carPrice: number;
  downPaymentPercent: number;
  downPaymentAmount: number;
  loanAmount: number;
  monthlyPayment: number;
  totalInterest: number;
  totalPayment: number;
  termMonths: number;
  onOpenLeadForm: () => void;
}

export function LoanSummary({
  carPrice,
  downPaymentPercent,
  downPaymentAmount,
  loanAmount,
  monthlyPayment,
  totalInterest,
  totalPayment,
  termMonths,
  onOpenLeadForm,
}: LoanSummaryProps) {
  const fmt = (val: number) => new Intl.NumberFormat("vi-VN").format(val) + " đ";

  return (
    <>
      {/* Desktop / Tablet Container */}
      <div className="hidden lg:block">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="sticky top-6 overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-surface-strong/90 to-surface/95 p-6 backdrop-blur-xl shadow-2xl"
        >
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#e31837]/10 blur-2xl" />
          
          <h3 className="font-display text-xl font-bold text-foreground mb-6 flex items-center gap-2 border-b border-line pb-4">
            <CreditCard className="text-[#e31837]" size={20} />
            Tóm tắt khoản vay
          </h3>

          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-subtle font-medium">Giá xe niêm yết</span>
              <span className="font-bold text-foreground text-base">{fmt(carPrice)}</span>
            </div>

            <div className="flex justify-between items-center text-sm border-t border-line pt-3">
              <span className="text-subtle font-medium flex items-center gap-1.5">
                <Percent size={14} className="text-[#e31837]" />
                Trả trước ({downPaymentPercent}%)
              </span>
              <span className="font-bold text-foreground">{fmt(downPaymentAmount)}</span>
            </div>

            <div className="flex justify-between items-center text-sm border-t border-line pt-3">
              <span className="text-subtle font-medium flex items-center gap-1.5">
                <DollarSign size={14} className="text-[#e31837]" />
                Cần vay từ ngân hàng
              </span>
              <span className="font-bold text-foreground">{fmt(loanAmount)}</span>
            </div>

            <div className="rounded-xl bg-[#e31837]/5 border border-[#e31837]/10 p-4 mt-6 mb-6">
              <p className="text-xs font-bold uppercase tracking-wider text-[#e31837] mb-1">
                Ước tính trả hàng tháng
              </p>
              <p className="font-display text-3xl font-black text-foreground">
                {fmt(monthlyPayment)}
              </p>
              <p className="text-xs text-subtle/80 mt-1">
                Tính theo phương pháp dư nợ giảm dần đều (EMI)
              </p>
            </div>

            <div className="flex justify-between items-center text-sm border-t border-line pt-3">
              <span className="text-subtle font-medium">Tổng số tiền lãi</span>
              <span className="font-semibold text-rose-400">{fmt(totalInterest)}</span>
            </div>

            <div className="flex justify-between items-center text-sm border-t border-line pt-3 pb-3">
              <span className="text-subtle font-medium">Tổng chi phí mua xe</span>
              <span className="font-bold text-emerald-400 text-lg">{fmt(totalPayment + downPaymentAmount)}</span>
            </div>

            <button
              onClick={onOpenLeadForm}
              className="w-full mt-4 flex items-center justify-center gap-2 bg-[#e31837] hover:bg-[#c1132a] text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-[#e31837]/20 group cursor-pointer"
            >
              Nhận bảng trả góp chi tiết
              <ArrowRight size={16} className="transform transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Mobile Sticky Card */}
      <div className="block lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-line bg-surface-strong/95 backdrop-blur-xl px-5 py-4 shadow-[0_-10px_25px_rgba(0,0,0,0.15)]">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#e31837]">
              Ước tính hàng tháng / {termMonths}th
            </p>
            <p className="font-display text-xl font-black text-foreground truncate">
              {fmt(monthlyPayment)}
            </p>
            <p className="text-[10px] text-subtle truncate">
              Trả trước: {downPaymentPercent}% ({new Intl.NumberFormat("vi-VN").format(Math.round(downPaymentAmount / 1_000_000))}tr)
            </p>
          </div>

          <button
            onClick={onOpenLeadForm}
            className="flex-shrink-0 bg-[#e31837] active:bg-[#c1132a] text-white font-bold text-sm py-3 px-5 rounded-xl transition-all shadow-md group flex items-center gap-1.5"
          >
            Nhận bảng giá
            <ArrowRight size={14} className="transform transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </>
  );
}
