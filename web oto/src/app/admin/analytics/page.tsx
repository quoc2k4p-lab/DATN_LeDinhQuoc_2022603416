import { BarChart3, CircleDollarSign, Target, TrendingUp } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";

export default function AnalyticsPage() {
  return (
    <AdminShell
      title="Thống kê chi tiết"
      subtitle="Màn hình phân tích doanh số, lead và hiệu suất kho xe theo style admin trong Stitch."
    >
      <div className="grid gap-5 md:grid-cols-3">
        {[
          [CircleDollarSign, "18.4 tỷ", "Doanh thu dự kiến"],
          [Target, "34%", "Tỷ lệ chốt lead"],
          [TrendingUp, "11 ngày", "Thời gian bán TB"],
        ].map(([Icon, value, label]) => (
          <div key={String(label)} className="rounded-md border border-white/10 bg-[#151a22] p-6">
            <Icon className="mb-8 text-[#e31837]" size={28} />
            <p className="font-display text-4xl font-extrabold">{String(value)}</p>
            <p className="mt-2 text-sm font-bold uppercase tracking-[0.12em] text-zinc-500">{String(label)}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 rounded-md border border-white/10 bg-[#151a22] p-6">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold">Hiệu suất theo tháng</h2>
          <BarChart3 className="text-[#e31837]" size={24} />
        </div>
        <div className="flex h-80 items-end gap-4 border-b border-white/10">
          {[42, 68, 55, 84, 74, 92, 63, 88].map((height, index) => (
            <div key={index} className="flex flex-1 flex-col items-center gap-3">
              <div className="w-full rounded-t bg-[#1a1a1a]" style={{ height: `${height}%` }} />
              <span className="text-xs font-bold uppercase text-zinc-500">T{index + 1}</span>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
