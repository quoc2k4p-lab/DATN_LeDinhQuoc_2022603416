"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { ScheduleRow } from "@/lib/loan/loan-schedule";

interface LoanAreaChartProps {
  schedule: ScheduleRow[];
  loanAmount: number;
}

export function LoanAreaChart({ schedule, loanAmount }: LoanAreaChartProps) {
  // Generate chart points with cumulative calculations
  const data = [
    {
      name: "Bắt đầu",
      "Dư nợ còn lại": loanAmount,
      "Gốc đã trả": 0,
      "Lãi đã trả": 0,
    },
  ];

  let accPrincipal = 0;
  let accInterest = 0;

  // Downsample data for longer terms to prevent rendering performance lag
  const skipCount = schedule.length > 36 ? Math.ceil(schedule.length / 12) : 1;

  schedule.forEach((row, idx) => {
    accPrincipal += row.principal;
    accInterest += row.interest;

    // Always include the last month or when downsampling matches
    if ((idx + 1) % skipCount === 0 || idx === schedule.length - 1) {
      data.push({
        name: `Th. ${row.month}`,
        "Dư nợ còn lại": row.remainingBalance,
        "Gốc đã trả": accPrincipal,
        "Lãi đã trả": accInterest,
      });
    }
  });

  const fmtVal = (val: number) => {
    if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)} tỷ`;
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(0)} triệu`;
    return new Intl.NumberFormat("vi-VN").format(val) + " đ";
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-strong)]/95 p-4 text-xs shadow-xl backdrop-blur-md space-y-1.5">
          <p className="font-bold text-[var(--foreground)] mb-2">{payload[0].payload.name}</p>
          {payload.map((p: any) => (
            <div key={p.name} className="flex justify-between gap-6 items-center">
              <span className="flex items-center gap-1.5 text-[var(--subtle)]">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                {p.name}
              </span>
              <span className="font-bold text-[var(--foreground)]">{new Intl.NumberFormat("vi-VN").format(p.value)} đ</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
      <h4 className="font-display text-sm font-bold text-[var(--subtle)] uppercase tracking-wider mb-4">
        Biểu đồ dư nợ và tích lũy thanh toán
      </h4>
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorPrincipal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorInterest" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
            <XAxis
              dataKey="name"
              stroke="var(--subtle)"
              opacity={0.4}
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="var(--subtle)"
              opacity={0.4}
              fontSize={10}
              tickFormatter={fmtVal}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              iconSize={8}
              formatter={(value) => <span className="text-xs font-semibold text-[var(--subtle)]">{value}</span>}
            />
            <Area
              type="monotone"
              dataKey="Dư nợ còn lại"
              stroke="#3b82f6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorBalance)"
            />
            <Area
              type="monotone"
              dataKey="Gốc đã trả"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorPrincipal)"
            />
            <Area
              type="monotone"
              dataKey="Lãi đã trả"
              stroke="#ef4444"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorInterest)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
