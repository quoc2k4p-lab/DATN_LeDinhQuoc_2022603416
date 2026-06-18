"use client";

import { useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CompareHeader } from "./CompareHeader";
import { CompareRadarChart } from "./CompareRadarChart";
import { CompareInsights } from "./CompareInsights";
import { CompareTable } from "./CompareTable";
import { CompareCTA } from "./CompareCTA";
import { getCompareList } from "./CompareBar";
import { CarSpecsExtended } from "@/lib/compare/compare-engine";
import { UiCar } from "@/lib/dbAdapter";

interface CompareContainerProps {
  comparedCars: CarSpecsExtended[];
  allCars: UiCar[];
}

export function CompareContainer({ comparedCars, allCars }: CompareContainerProps) {
  const router = useRouter();
  const headerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      const hasIdParams = url.searchParams.has("id");
      if (!hasIdParams) {
        const list = getCompareList();
        if (list && list.length > 0) {
          const newUrl = new URL(window.location.href);
          list.forEach((item) => newUrl.searchParams.append("id", item.id));
          router.push(newUrl.pathname + newUrl.search);
        }
      }
    }
  }, [router]);

  useEffect(() => {
    const headerEl = headerRef.current;
    const tableEl = tableRef.current;
    if (!headerEl || !tableEl) return;

    let isSyncingHeader = false;
    let isSyncingTable = false;

    const handleHeaderScroll = () => {
      if (isSyncingTable) return;
      isSyncingHeader = true;
      tableEl.scrollLeft = headerEl.scrollLeft;
      // Slight delay reset to prevent feedback loop
      setTimeout(() => {
        isSyncingHeader = false;
      }, 50);
    };

    const handleTableScroll = () => {
      if (isSyncingHeader) return;
      isSyncingTable = true;
      headerEl.scrollLeft = tableEl.scrollLeft;
      // Slight delay reset to prevent feedback loop
      setTimeout(() => {
        isSyncingTable = false;
      }, 50);
    };

    headerEl.addEventListener("scroll", handleHeaderScroll);
    tableEl.addEventListener("scroll", handleTableScroll);

    return () => {
      headerEl.removeEventListener("scroll", handleHeaderScroll);
      tableEl.removeEventListener("scroll", handleTableScroll);
    };
  }, [comparedCars]); // Re-bind if cars count changes and components re-render

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 space-y-12">
      {/* 1. Phần chọn xe (Đặt ở đầu trang) */}
      <div className="space-y-4">
        <div className="border-l-4 border-[#e31837] pl-4">
          <h3 className="font-display text-xl font-bold text-[var(--foreground)]">Các mẫu xe so sánh</h3>
          <p className="text-xs text-[var(--subtle)] mt-0.5">Thêm, bớt hoặc đổi các mẫu xe cần so sánh</p>
        </div>
        <CompareHeader
          cars={comparedCars}
          allCars={allCars}
          scrollRef={headerRef}
        />
      </div>

      {/* 2. So sánh tổng quan (Biểu đồ Radar & AI Insights) */}
      <div className="grid gap-8 lg:grid-cols-2">
        <CompareRadarChart cars={comparedCars} />
        <CompareInsights cars={comparedCars} />
      </div>

      {/* 3. Bảng so sánh chi tiết (Cuộn ngang đồng bộ với Header) */}
      <div className="space-y-4">
        <div className="border-l-4 border-[#e31837] pl-4">
          <h3 className="font-display text-xl font-bold text-[var(--foreground)]">Bảng so sánh chi tiết</h3>
          <p className="text-xs text-[var(--subtle)] mt-0.5">So sánh từng chỉ số nhỏ trên 7 nhóm kỹ thuật</p>
        </div>
        <CompareTable
          cars={comparedCars}
          scrollRef={tableRef}
        />
      </div>

      {/* 4. Bottom CTA Actions */}
      <div className="border-t border-[var(--line)] bg-[var(--surface)] mt-12 rounded-xl overflow-hidden">
        <CompareCTA cars={comparedCars} allCars={allCars} />
      </div>
    </div>
  );
}
