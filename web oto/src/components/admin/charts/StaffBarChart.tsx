"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface StaffDataPoint {
  name: string;
  sold: number;
  revenue: number;
}

interface StaffBarChartProps {
  data: StaffDataPoint[];
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
  payload?: { payload: StaffDataPoint }[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div
      className="rounded-lg border border-white/10 px-4 py-3 shadow-xl"
      style={{ backgroundColor: "#1a1f28" }}
    >
      <p className="mb-1.5 text-sm font-semibold text-white">{label}</p>
      <div className="space-y-1">
        <p className="text-xs text-zinc-400">
          <span
            className="mr-1.5 inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: "#3b82f6" }}
          />
          Đã bán:{" "}
          <span className="text-white">
            {new Intl.NumberFormat("vi-VN").format(item.sold)} xe
          </span>
        </p>
        <p className="text-xs text-zinc-400">
          <span
            className="mr-1.5 inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: "#e31837" }}
          />
          Doanh thu:{" "}
          <span className="text-white">{formatVNDFull(item.revenue)}</span>
        </p>
      </div>
    </div>
  );
}

export function StaffBarChart({ data }: StaffBarChartProps) {
  return (
    <div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.05)"
            vertical={false}
          />
          <XAxis
            dataKey="name"
            tick={{ fill: "#a1a1aa", fontSize: 12 }}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#a1a1aa", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
          <Bar
            dataKey="sold"
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
