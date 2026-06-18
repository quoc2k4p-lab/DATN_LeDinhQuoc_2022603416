"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface RevenueDataPoint {
  label: string;
  revenue: number;
}

interface RevenueChartProps {
  data: RevenueDataPoint[];
  title?: string;
}

function formatVND(value: number): string {
  if (value >= 1_000_000_000) {
    const ty = value / 1_000_000_000;
    return `${ty % 1 === 0 ? ty.toFixed(0) : ty.toFixed(1)} tỷ`;
  }
  if (value >= 1_000_000) {
    const trieu = value / 1_000_000;
    return `${trieu % 1 === 0 ? trieu.toFixed(0) : trieu.toFixed(1)} triệu`;
  }
  return new Intl.NumberFormat("vi-VN").format(value);
}

function formatVNDFull(value: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg border border-white/10 px-4 py-3 shadow-xl"
      style={{ backgroundColor: "#1a1f28" }}
    >
      <p className="mb-1 text-xs text-zinc-400">{label}</p>
      <p className="text-sm font-semibold text-white">
        {formatVNDFull(payload[0].value)}
      </p>
    </div>
  );
}

export function RevenueChart({ data, title }: RevenueChartProps) {
  return (
    <div>
      {title && (
        <h3 className="mb-4 text-sm font-semibold text-white">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={data}
          margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e31837" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#e31837" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.05)"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fill: "#a1a1aa", fontSize: 12 }}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatVND}
            tick={{ fill: "#a1a1aa", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={70}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#e31837"
            strokeWidth={2}
            fill="url(#revenueGradient)"
            dot={false}
            activeDot={{
              r: 5,
              fill: "#e31837",
              stroke: "#fff",
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
