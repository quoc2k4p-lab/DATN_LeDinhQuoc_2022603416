"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface LoanPieChartProps {
  loanAmount: number;
  totalInterest: number;
}

export function LoanPieChart({ loanAmount, totalInterest }: LoanPieChartProps) {
  const data = [
    { name: "Tiền gốc", value: loanAmount, color: "#1e40af" }, // Deep Blue
    { name: "Tiền lãi", value: totalInterest, color: "#b91c1c" }, // Deep Red
  ];

  const fmtVal = (val: number) => {
    return new Intl.NumberFormat("vi-VN").format(val) + " đ";
  };

  const total = loanAmount + totalInterest;
  const percent = (val: number) => ((val / total) * 100).toFixed(1) + "%";

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataInfo = payload[0].payload;
      return (
        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-strong)]/95 p-3 text-xs shadow-xl backdrop-blur-md">
          <p className="font-bold text-[var(--foreground)] mb-1">{dataInfo.name}</p>
          <p className="font-semibold text-[var(--subtle)]">
            Số tiền: <span className="text-[var(--foreground)] font-bold">{fmtVal(dataInfo.value)}</span>
          </p>
          <p className="font-semibold text-[var(--subtle)]">
            Tỷ lệ: <span className="text-[var(--foreground)] font-bold">{percent(dataInfo.value)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
      <h4 className="font-display text-sm font-bold text-[var(--subtle)] uppercase tracking-wider mb-4">
        Cơ cấu tổng thanh toán
      </h4>
      <div className="h-[240px] w-full flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={85}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              iconSize={8}
              formatter={(value, entry: any) => {
                const item = data.find((d) => d.name === value);
                const share = item ? ` (${percent(item.value)})` : "";
                return <span className="text-xs font-semibold text-[var(--subtle)]">{value}{share}</span>;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
