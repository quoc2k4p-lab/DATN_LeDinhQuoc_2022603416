import { TrendingUp } from "lucide-react";

export function StatCard({ label, value, trend }: { label: string; value: string; trend: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-[#151a22] p-6">
      <div className="mb-8 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-zinc-500">{label}</p>
        <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-300">
          <TrendingUp size={14} />
          {trend}
        </span>
      </div>
      <p className="font-display text-2xl sm:text-4xl font-extrabold text-white">{value}</p>
    </div>
  );
}
