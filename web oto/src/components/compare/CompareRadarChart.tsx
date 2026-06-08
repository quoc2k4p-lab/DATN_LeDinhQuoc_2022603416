"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { CarSpecsExtended } from "@/lib/compare/compare-engine";
import { calculateCompareScores } from "@/lib/compare/compare-score";

interface CompareRadarChartProps {
  cars: CarSpecsExtended[];
}

// Assign strictly unique, premium colors by column index to guarantee no duplicates
const INDEX_COLORS = [
  "#3b82f6", // Indigo/Blue for Car 1
  "#f59e0b", // Amber/Yellow for Car 2
  "#10b981", // Emerald/Green for Car 3
];

export function CompareRadarChart({ cars }: CompareRadarChartProps) {
  const [mounted, setMounted] = useState(false);
  const t = useTranslations("Compare");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-[380px] w-full items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--surface)]">
        <span className="text-sm text-[var(--subtle)]">Đang tải biểu đồ...</span>
      </div>
    );
  }

  // Calculate scores and attach strict index-based colors
  const carScores = cars.map((car, idx) => ({
    name: car.name,
    brand: car.brand,
    scores: calculateCompareScores(car),
    color: INDEX_COLORS[idx % INDEX_COLORS.length]
  }));

  // Restructure data for Recharts with localized aspect subjects
  const chartData = [
    {
      subject: t("performance"),
      ...carScores.reduce((acc, c, idx) => ({ ...acc, [`car${idx}`]: c.scores.performance }), {})
    },
    {
      subject: t("economy"),
      ...carScores.reduce((acc, c, idx) => ({ ...acc, [`car${idx}`]: c.scores.economy }), {})
    },
    {
      subject: t("comfort"),
      ...carScores.reduce((acc, c, idx) => ({ ...acc, [`car${idx}`]: c.scores.comfort }), {})
    },
    {
      subject: t("safety"),
      ...carScores.reduce((acc, c, idx) => ({ ...acc, [`car${idx}`]: c.scores.safety }), {})
    },
    {
      subject: t("technology"),
      ...carScores.reduce((acc, c, idx) => ({ ...acc, [`car${idx}`]: c.scores.technology }), {})
    }
  ];

  // Custom tooltip adapted for Light & Dark mode
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3 shadow-xl backdrop-blur-md">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--subtle)] border-b border-[var(--line)] pb-1">
            {payload[0].payload.subject}
          </p>
          <div className="space-y-1.5">
            {payload.map((p: any, i: number) => {
              const carScoreObj = carScores[i];
              if (!carScoreObj) return null;
              return (
                <div key={i} className="flex items-center gap-3 justify-between text-xs">
                  <span className="font-semibold text-[var(--foreground)] opacity-95 truncate max-w-[150px]">
                    {p.name}
                  </span>
                  <span className="font-extrabold" style={{ color: p.color }}>
                    {p.value} / 100đ
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6 lg:p-8 shadow-xl flex flex-col justify-between min-h-[440px]">
      <div>
        <h3 className="font-display text-lg font-bold text-[var(--foreground)]">So sánh tổng quan</h3>
        <p className="text-xs text-[var(--subtle)] mt-0.5">Biểu đồ đánh giá 5 khía cạnh chính của các xe (Điểm số từ 0 - 100)</p>
      </div>

      {/* Radar Chart Container */}
      <div className="flex h-[280px] w-full items-center justify-center my-4">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
            {/* Grid lines using line theme variable */}
            <PolarGrid stroke="var(--line)" opacity={0.6} />
            
            {/* Axis labels using subtle theme variable */}
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: "var(--foreground)", fontSize: 11, fontWeight: 600, opacity: 0.85 }}
            />
            
            {/* Radius axis ticks placed vertically to avoid overlapping */}
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: "var(--subtle)", fontSize: 9, opacity: 0.7 }}
              stroke="var(--line)"
              opacity={0.4}
            />

            {carScores.map((c, idx) => (
              <Radar
                key={idx}
                name={c.name}
                dataKey={`car${idx}`}
                stroke={c.color}
                fill={c.color}
                fillOpacity={0.1}
                strokeWidth={2.5}
              />
            ))}

            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Custom HTML Legend: ensures correct theme colors and elegant design */}
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-[var(--line)] pt-4 mt-2">
        {carScores.map((c, idx) => (
          <div key={idx} className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--subtle)] hover:text-[var(--foreground)] transition-colors duration-200">
            <span 
              className="h-2.5 w-2.5 rounded-full shrink-0 shadow-[0_0_8px_rgba(0,0,0,0.15)]" 
              style={{ backgroundColor: c.color }}
            />
            <span className="truncate max-w-[130px] sm:max-w-[200px]" style={{ color: "var(--foreground)", opacity: 0.85 }}>
              {c.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
