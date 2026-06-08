"use client";

import { PieChart, Pie, Cell, Tooltip, Label, ResponsiveContainer } from "recharts";
import { useMemo } from "react";

interface InventoryDataPoint {
  name: string;
  value: number;
  color: string;
}

interface InventoryDonutProps {
  data: InventoryDataPoint[];
}

function formatVNNumber(value: number): string {
  return new Intl.NumberFormat("vi-VN").format(value);
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: { payload: InventoryDataPoint }[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div
      className="rounded-lg border border-white/10 px-4 py-3 shadow-xl"
      style={{ backgroundColor: "#1a1f28" }}
    >
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: item.color }}
        />
        <span className="text-sm text-white">{item.name}</span>
      </div>
      <p className="mt-1 text-xs text-zinc-400">
        Số lượng:{" "}
        <span className="font-medium text-white">
          {formatVNNumber(item.value)} xe
        </span>
      </p>
    </div>
  );
}

interface CenterLabelProps {
  viewBox?: { cx: number; cy: number };
  total: number;
}

function CenterLabel({ viewBox, total }: CenterLabelProps) {
  const cx = viewBox?.cx ?? 0;
  const cy = viewBox?.cy ?? 0;
  return (
    <g>
      <text
        x={cx}
        y={cy - 8}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#a1a1aa"
        fontSize={12}
      >
        Tổng
      </text>
      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#ffffff"
        fontSize={20}
        fontWeight={700}
      >
        {formatVNNumber(total)}
      </text>
    </g>
  );
}

export function InventoryDonut({ data }: InventoryDonutProps) {
  const total = useMemo(
    () => data.reduce((sum, item) => sum + item.value, 0),
    [data]
  );

  return (
    <div>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={90}
            dataKey="value"
            nameKey="name"
            strokeWidth={2}
            stroke="#151a22"
            label={false}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
            <Label
              content={({ viewBox }) => {
                const vb = viewBox as any;
                const cx = vb?.cx ?? 0;
                const cy = vb?.cy ?? 0;
                return (
                  <g>
                    <text x={cx} y={cy - 8} textAnchor="middle" dominantBaseline="central" fill="#a1a1aa" fontSize={12}>Tổng</text>
                    <text x={cx} y={cy + 14} textAnchor="middle" dominantBaseline="central" fill="#ffffff" fontSize={20} fontWeight={700}>{total}</text>
                  </g>
                );
              }}
            />
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Custom legend */}
      <div className="mt-2 flex flex-wrap justify-center gap-x-5 gap-y-2">
        {data.map((entry, index) => (
          <div key={index} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-zinc-400">
              {entry.name}{" "}
              <span className="text-zinc-500">
                ({formatVNNumber(entry.value)})
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
