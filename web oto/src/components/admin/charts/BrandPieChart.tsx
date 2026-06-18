"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface BrandDataPoint {
  name: string;
  value: number;
  count: number;
}

interface BrandPieChartProps {
  data: BrandDataPoint[];
}

const COLORS = [
  "#e31837",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
];

const RADIAN = Math.PI / 180;

function renderCustomLabel(props: any) {
  const { cx, cy, midAngle, outerRadius, percent, name } = props;
  const radius = outerRadius + 28;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.04) return null;

  return (
    <text
      x={x}
      y={y}
      fill="#e4e4e7"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={12}
    >
      {name} ({(percent * 100).toFixed(0)}%)
    </text>
  );
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
  payload?: { payload: BrandDataPoint; color: string }[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div
      className="rounded-lg border border-white/10 px-4 py-3 shadow-xl"
      style={{ backgroundColor: "#1a1f28" }}
    >
      <p className="mb-1.5 text-sm font-semibold text-white">{item.name}</p>
      <p className="text-xs text-zinc-400">
        Doanh thu:{" "}
        <span className="text-white">{formatVNDFull(item.value)}</span>
      </p>
      <p className="text-xs text-zinc-400">
        Số lượng:{" "}
        <span className="text-white">
          {new Intl.NumberFormat("vi-VN").format(item.count)} xe
        </span>
      </p>
    </div>
  );
}

export function BrandPieChart({ data }: BrandPieChartProps) {
  return (
    <div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={100}
            innerRadius={0}
            dataKey="value"
            nameKey="name"
            label={renderCustomLabel}
            labelLine={{
              stroke: "rgba(255,255,255,0.2)",
              strokeWidth: 1,
            }}
            strokeWidth={2}
            stroke="#151a22"
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
