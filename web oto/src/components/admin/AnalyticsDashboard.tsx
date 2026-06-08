"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DollarSign, Car, Users, CalendarDays, Package, UserPlus, TrendingUp,
  BarChart3, ShoppingCart, Award, Warehouse, Filter, Download, RefreshCw,
  ChevronRight, Clock, AlertTriangle, Eye, ArrowRightLeft, Calculator, Sparkles
} from "lucide-react";
import type {
  OverviewStats, RevenuePoint, BrandRevenue, SoldCarDetail, BrandStat,
  TopSellingData, StaffPerf, InventoryStats, CustomerStats, ComparedCarStat
} from "@/lib/actions/analyticsActions";
import { getLoanAnalyticsAction, LoanAnalyticsData } from "@/lib/actions/loanActions";
import { getAiAssistantAnalyticsAction, AiAnalyticsData } from "@/lib/actions/aiAnalyticsActions";
import { RevenueChart } from "@/components/admin/charts/RevenueChart";
import { BrandPieChart } from "@/components/admin/charts/BrandPieChart";
import { StaffBarChart } from "@/components/admin/charts/StaffBarChart";
import { InventoryDonut } from "@/components/admin/charts/InventoryDonut";

// ========== HELPERS ==========

function fmtVND(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} tỷ`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)} triệu`;
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

function fmtPrice(n: number): string {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
}

const TABS = [
  { id: "overview", label: "Tổng quan", icon: BarChart3 },
  { id: "revenue", label: "Doanh thu", icon: DollarSign },
  { id: "sold", label: "Xe đã bán", icon: ShoppingCart },
  { id: "staff", label: "Nhân viên", icon: Award },
  { id: "inventory", label: "Kho & KH", icon: Warehouse },
  { id: "loan", label: "Báo cáo Trả góp", icon: Calculator },
  { id: "ai", label: "Trợ lý AI", icon: Sparkles },
] as const;

type TabId = (typeof TABS)[number]["id"];

const STAGE_LABELS: Record<string, string> = {
  new_lead: "Lead mới",
  consulting: "Đang tư vấn",
  appointment: "Đã đặt lịch",
  quotation: "Báo giá",
  negotiating: "Đàm phán",
  reserved: "Đã đặt cọc",
  purchased: "Đã mua",
  follow_up: "Chăm sóc lại",
};

// ========== PROPS ==========

interface AnalyticsDashboardProps {
  initialOverview: OverviewStats;
  initialRevenue: RevenuePoint[];
  initialBrandRevenue: BrandRevenue[];
  initialSoldCars: SoldCarDetail[];
  initialBrandStats: BrandStat[];
  initialTopSelling: TopSellingData;
  initialStaffPerf: StaffPerf[];
  initialInventory: InventoryStats;
  initialCustomers: CustomerStats;
  initialCompared?: ComparedCarStat[];
  initialLoan?: LoanAnalyticsData;
  initialAi?: AiAnalyticsData;
}

// ========== COMPONENT ==========

export function AnalyticsDashboard({
  initialOverview,
  initialRevenue,
  initialBrandRevenue,
  initialSoldCars,
  initialBrandStats,
  initialTopSelling,
  initialStaffPerf,
  initialInventory,
  initialCustomers,
  initialCompared,
  initialLoan,
  initialAi,
}: AnalyticsDashboardProps) {
  const [tab, setTab] = useState<TabId>("overview");
  const [overview, setOverview] = useState(initialOverview);
  const [revenue, setRevenue] = useState(initialRevenue);
  const [brandRevenue, setBrandRevenue] = useState(initialBrandRevenue);
  const [soldCars, setSoldCars] = useState(initialSoldCars);
  const [brandStats, setBrandStats] = useState(initialBrandStats);
  const [topSelling, setTopSelling] = useState(initialTopSelling);
  const [staffPerf, setStaffPerf] = useState(initialStaffPerf);
  const [inventory, setInventory] = useState(initialInventory);
  const [customers, setCustomers] = useState(initialCustomers);
  const [compared, setCompared] = useState(initialCompared || []);
  const [loanAnalytics, setLoanAnalytics] = useState<LoanAnalyticsData | undefined>(initialLoan);
  const [aiAnalytics, setAiAnalytics] = useState<AiAnalyticsData | undefined>(initialAi);

  // Filters
  const [dateFrom, setDateFrom] = useState(daysAgo(30));
  const [dateTo, setDateTo] = useState(todayStr());
  const [brandFilter, setBrandFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const refreshData = useCallback(async () => {
    setRefreshing(true);
    try {
      const [ovRes, brRes, compRes, loanRes, aiRes] = await Promise.all([
        fetch("/api/analytics?type=overview").then((r) => r.json()),
        fetch("/api/analytics?type=revenue-brand").then((r) => r.json()),
        fetch("/api/analytics?type=compared").then((r) => r.json()),
        getLoanAnalyticsAction(),
        getAiAssistantAnalyticsAction(),
      ]);
      if (ovRes.success) setOverview(ovRes.data);
      if (brRes.success) setBrandRevenue(brRes.data);
      if (compRes.success) setCompared(compRes.data);
      if (loanRes.success && loanRes.analytics) setLoanAnalytics(loanRes.analytics);
      if (aiRes.success && aiRes.analytics) setAiAnalytics(aiRes.analytics);
    } catch {}
    setRefreshing(false);
  }, []);

  const fetchRevenue = useCallback(async () => {
    try {
      const res = await fetch(`/api/analytics?type=revenue&from=${dateFrom}&to=${dateTo}`);
      const data = await res.json();
      if (data.success) setRevenue(data.data);
    } catch {}
  }, [dateFrom, dateTo]);

  const fetchLoanData = useCallback(async () => {
    try {
      const res = await getLoanAnalyticsAction();
      if (res.success && res.analytics) {
        setLoanAnalytics(res.analytics);
      }
    } catch {}
  }, []);

  const fetchAiData = useCallback(async () => {
    try {
      const res = await getAiAssistantAnalyticsAction();
      if (res.success && res.analytics) {
        setAiAnalytics(res.analytics);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (tab === "revenue") fetchRevenue();
    if (tab === "loan") fetchLoanData();
    if (tab === "ai") fetchAiData();
  }, [tab, fetchRevenue, fetchLoanData, fetchAiData]);

  const fetchSoldByBrand = useCallback(async (brand: string) => {
    try {
      const res = await fetch(`/api/analytics?type=sold&brand=${brand}`);
      const data = await res.json();
      if (data.success) setSoldCars(data.data);
    } catch {}
  }, []);

  const handleBrandFilter = (brand: string) => {
    setBrandFilter(brand);
    fetchSoldByBrand(brand);
  };

  const handleDatePreset = (days: number) => {
    setDateFrom(daysAgo(days));
    setDateTo(todayStr());
  };

  // CSV Export
  const exportCSV = (data: any[], filename: string) => {
    if (!data.length) return;
    const keys = Object.keys(data[0]);
    const csv = [keys.join(","), ...data.map((row) => keys.map((k) => `"${row[k]}"`).join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}_${todayStr()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ========== OVERVIEW CARDS ==========
  const overviewCards = [
    { label: "Tổng doanh thu", value: fmtVND(overview.totalRevenue), icon: DollarSign, color: "text-emerald-400" },
    { label: "Bán tháng này", value: String(overview.soldThisMonth), icon: Car, color: "text-blue-400" },
    { label: "Bán năm nay", value: String(overview.soldThisYear), icon: TrendingUp, color: "text-purple-400" },
    { label: "Tổng khách hàng", value: String(overview.totalCustomers), icon: Users, color: "text-amber-400" },
    { label: "Tổng lịch hẹn", value: String(overview.totalAppointments), icon: CalendarDays, color: "text-cyan-400" },
    { label: "Kho xe hiện có", value: String(overview.totalInventory), icon: Package, color: "text-indigo-400" },
    { label: "Lead mới (30d)", value: String(overview.newLeads), icon: UserPlus, color: "text-pink-400" },
    { label: "Tổng xe đã bán", value: String(overview.totalSold), icon: ShoppingCart, color: "text-rose-400" },
  ];

  // Unique brands for filter
  const allBrands = Array.from(new Set(brandStats.map((b) => b.brand)));

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-lg bg-[#111] p-1 border border-white/5">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold transition-all ${
                  active
                    ? "bg-[#e31837]/15 text-[#e31837] shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            );
          })}
        </div>
        <button
          onClick={refreshData}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition disabled:opacity-40"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Làm mới</span>
        </button>
      </div>

      {/* ========== TAB: OVERVIEW ========== */}
      {tab === "overview" && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            {overviewCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="rounded-lg border border-white/10 bg-[#151a22] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                  <p className="text-2xl font-extrabold text-white">{card.value}</p>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mt-1">{card.label}</p>
                </div>
              );
            })}
          </div>

          {/* Charts Row */}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-[#151a22] p-4">
              <h3 className="text-sm font-bold text-white mb-3">Doanh thu gần đây</h3>
              <RevenueChart data={revenue} />
            </div>
            <div className="rounded-lg border border-white/10 bg-[#151a22] p-4">
              <h3 className="text-sm font-bold text-white mb-3">Doanh thu theo hãng</h3>
              <BrandPieChart data={brandRevenue} />
            </div>
          </div>

          {/* Top Selling & Comparisons */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {/* Top Cars */}
            <div className="rounded-lg border border-white/10 bg-[#151a22] p-4">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" /> Top xe bán giá cao
              </h3>
              <div className="space-y-2">
                {topSelling.topCars.map((car, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div>
                      <p className="text-xs font-medium text-white">{car.title}</p>
                      <p className="text-[10px] text-zinc-500">{car.soldAt}</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-400">{fmtVND(car.soldPrice)}</span>
                  </div>
                ))}
                {topSelling.topCars.length === 0 && <p className="text-xs text-zinc-500">Chưa có dữ liệu</p>}
              </div>
            </div>

            {/* Top Brands */}
            <div className="rounded-lg border border-white/10 bg-[#151a22] p-4">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" /> Top hãng bán chạy
              </h3>
              <div className="space-y-2">
                {topSelling.topBrands.map((b, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div>
                      <p className="text-xs font-medium text-white">{b.brand}</p>
                      <p className="text-[10px] text-zinc-500">{b.count} xe</p>
                    </div>
                    <span className="text-xs font-bold text-blue-400">{fmtVND(b.revenue)}</span>
                  </div>
                ))}
                {topSelling.topBrands.length === 0 && <p className="text-xs text-zinc-500">Chưa có dữ liệu</p>}
              </div>
            </div>

            {/* Most Viewed */}
            <div className="rounded-lg border border-white/10 bg-[#151a22] p-4">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-400" /> Xe xem nhiều nhất
              </h3>
              <div className="space-y-2">
                {topSelling.mostViewed.map((v, i) => (
                  <div key={i} className="flex items-center gap-2 py-2 border-b border-white/5 last:border-0">
                    <img src={v.thumbnail} alt={v.title} className="w-10 h-7 rounded object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">{v.title}</p>
                      <p className="text-[10px] text-zinc-500">{v.brand}</p>
                    </div>
                    <span className="text-xs font-bold text-purple-400">{v.views} <Eye className="w-3 h-3 inline" /></span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Compared Cars */}
            <div className="rounded-lg border border-white/10 bg-[#151a22] p-4">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-emerald-400" /> Top xe được so sánh
              </h3>
              <div className="space-y-2">
                {compared.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{item.pair}</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 shrink-0 ml-2">{item.count} lượt</span>
                  </div>
                ))}
                {compared.length === 0 && <p className="text-xs text-zinc-500 py-4 text-center">Chưa có dữ liệu so sánh</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== TAB: REVENUE ========== */}
      {tab === "revenue" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-[#151a22] p-3">
            <Filter className="w-4 h-4 text-zinc-500" />
            <div className="flex items-center gap-2">
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                className="bg-[#0b1016] border border-white/10 rounded px-2 py-1.5 text-xs text-white" />
              <ChevronRight className="w-3 h-3 text-zinc-600" />
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                className="bg-[#0b1016] border border-white/10 rounded px-2 py-1.5 text-xs text-white" />
            </div>
            <div className="flex gap-1">
              {[{ label: "7 ngày", days: 7 }, { label: "30 ngày", days: 30 }, { label: "90 ngày", days: 90 }, { label: "Năm nay", days: 365 }].map((p) => (
                <button key={p.days} onClick={() => handleDatePreset(p.days)}
                  className="px-2.5 py-1 rounded text-[10px] font-semibold bg-white/5 hover:bg-[#e31837]/10 hover:text-[#e31837] text-zinc-400 transition">
                  {p.label}
                </button>
              ))}
            </div>
            <button onClick={fetchRevenue}
              className="ml-auto px-3 py-1.5 rounded text-xs font-semibold bg-[#e31837] text-white hover:bg-[#c2142d] transition">
              Lọc
            </button>
            <button onClick={() => exportCSV(revenue, "doanh_thu")}
              className="px-2 py-1.5 rounded text-xs text-zinc-400 hover:text-white hover:bg-white/5 transition">
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Revenue Chart */}
          <div className="rounded-lg border border-white/10 bg-[#151a22] p-4">
            <h3 className="text-sm font-bold text-white mb-3">Biểu đồ doanh thu</h3>
            {revenue.length > 0 ? (
              <RevenueChart data={revenue} />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-sm text-zinc-500">Không có dữ liệu trong khoảng thời gian này</div>
            )}
          </div>

          {/* Revenue by Brand */}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-[#151a22] p-4">
              <h3 className="text-sm font-bold text-white mb-3">Doanh thu theo hãng</h3>
              <BrandPieChart data={brandRevenue} />
            </div>
            <div className="rounded-lg border border-white/10 bg-[#151a22] p-4">
              <h3 className="text-sm font-bold text-white mb-3">Chi tiết doanh thu hãng</h3>
              <div className="space-y-1">
                {brandRevenue.map((b, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <span className="text-xs font-medium text-white">{b.name}</span>
                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-400">{fmtVND(b.value)}</span>
                      <span className="text-[10px] text-zinc-500 ml-2">({b.count} xe)</span>
                    </div>
                  </div>
                ))}
                {brandRevenue.length === 0 && <p className="text-xs text-zinc-500 py-4 text-center">Chưa có dữ liệu bán hàng</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== TAB: SOLD CARS ========== */}
      {tab === "sold" && (
        <div className="space-y-4">
          {/* Brand Filter Pills */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleBrandFilter("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                brandFilter === "all" ? "bg-[#e31837] text-white" : "bg-white/5 text-zinc-400 hover:text-white"
              }`}
            >
              Tất cả
            </button>
            {allBrands.map((b) => (
              <button
                key={b}
                onClick={() => handleBrandFilter(b)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                  brandFilter === b ? "bg-[#e31837] text-white" : "bg-white/5 text-zinc-400 hover:text-white"
                }`}
              >
                {b}
              </button>
            ))}
            <button onClick={() => exportCSV(soldCars, "xe_da_ban")}
              className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded text-xs text-zinc-400 hover:text-white hover:bg-white/5 transition">
              <Download className="w-3 h-3" /> Export
            </button>
          </div>

          {/* Sold Cars Table */}
          <div className="rounded-lg border border-white/10 bg-[#151a22] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left">
                <thead className="bg-white/5">
                  <tr>
                    {["Xe", "Hãng", "Năm", "Giá niêm yết", "Giá bán", "Ngày bán", "NV bán", "Khách hàng"].map((h) => (
                      <th key={h} className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {soldCars.map((car) => (
                    <tr key={car.id} className="border-t border-white/5 hover:bg-white/[0.02] transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <img src={car.thumbnail} alt={car.title} className="w-12 h-8 rounded object-cover" />
                          <span className="text-xs font-medium text-white truncate max-w-[150px]">{car.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-300">{car.brand}</td>
                      <td className="px-4 py-3 text-xs text-zinc-300">{car.year}</td>
                      <td className="px-4 py-3 text-xs text-zinc-400">{fmtPrice(car.listPrice)}</td>
                      <td className="px-4 py-3 text-xs font-bold text-emerald-400">{fmtPrice(car.soldPrice)}</td>
                      <td className="px-4 py-3 text-xs text-zinc-300">{car.soldAt}</td>
                      <td className="px-4 py-3 text-xs text-zinc-300">{car.staffName}</td>
                      <td className="px-4 py-3 text-xs text-zinc-300">{car.buyerName}</td>
                    </tr>
                  ))}
                  {soldCars.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-zinc-500">Chưa có xe nào được bán</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Brand Stats Cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {brandStats.map((b) => (
              <div key={b.brand}
                onClick={() => handleBrandFilter(b.brand)}
                className="rounded-lg border border-white/10 bg-[#151a22] p-4 cursor-pointer hover:border-[#e31837]/30 transition group">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-white group-hover:text-[#e31837] transition">{b.brand}</h4>
                  <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-[#e31837] transition" />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-extrabold text-white">{b.totalCars}</p>
                    <p className="text-[9px] text-zinc-500 uppercase">Tổng</p>
                  </div>
                  <div>
                    <p className="text-lg font-extrabold text-emerald-400">{b.soldCars}</p>
                    <p className="text-[9px] text-zinc-500 uppercase">Đã bán</p>
                  </div>
                  <div>
                    <p className="text-lg font-extrabold text-blue-400">{b.availableCars}</p>
                    <p className="text-[9px] text-zinc-500 uppercase">Đang bán</p>
                  </div>
                </div>
                {b.totalRevenue > 0 && (
                  <p className="mt-2 text-[10px] text-zinc-500">Doanh thu: <span className="text-emerald-400 font-semibold">{fmtVND(b.totalRevenue)}</span></p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========== TAB: STAFF ========== */}
      {tab === "staff" && (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-[#151a22] p-4">
              <h3 className="text-sm font-bold text-white mb-3">Biểu đồ hiệu suất</h3>
              <StaffBarChart data={staffPerf.map((s) => ({ name: s.name, sold: s.carsSold, revenue: s.totalRevenue }))} />
            </div>

            <div className="rounded-lg border border-white/10 bg-[#151a22] p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white">Bảng xếp hạng</h3>
                <button onClick={() => exportCSV(staffPerf, "hieu_suat_nv")}
                  className="p-1 rounded text-zinc-500 hover:text-white hover:bg-white/5 transition">
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr>
                      {["#", "Nhân viên", "Xe bán", "Doanh thu", "Leads", "Tỷ lệ"].map((h) => (
                        <th key={h} className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {staffPerf.map((s, i) => (
                      <tr key={s.id} className="border-t border-white/5">
                        <td className="px-3 py-2.5 text-xs font-bold text-zinc-500">{i + 1}</td>
                        <td className="px-3 py-2.5 text-xs font-medium text-white">{s.name}</td>
                        <td className="px-3 py-2.5 text-xs font-bold text-blue-400">{s.carsSold}</td>
                        <td className="px-3 py-2.5 text-xs font-bold text-emerald-400">{fmtVND(s.totalRevenue)}</td>
                        <td className="px-3 py-2.5 text-xs text-zinc-300">{s.totalLeads}</td>
                        <td className="px-3 py-2.5">
                          <span className={`text-xs font-bold ${s.conversionRate >= 50 ? "text-emerald-400" : s.conversionRate >= 20 ? "text-amber-400" : "text-zinc-500"}`}>
                            {s.conversionRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== TAB: INVENTORY & CUSTOMERS ========== */}
      {tab === "inventory" && (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Inventory Chart */}
            <div className="rounded-lg border border-white/10 bg-[#151a22] p-4">
              <h3 className="text-sm font-bold text-white mb-3">Phân bổ kho xe</h3>
              <InventoryDonut data={[
                { name: "Đang bán", value: inventory.available, color: "#10b981" },
                { name: "Đã đặt", value: inventory.reserved, color: "#f59e0b" },
                { name: "Đã bán", value: inventory.sold, color: "#e31837" },
                { name: "Ẩn", value: inventory.hidden, color: "#6b7280" },
              ]} />
            </div>

            {/* Customer Funnel */}
            <div className="rounded-lg border border-white/10 bg-[#151a22] p-4">
              <h3 className="text-sm font-bold text-white mb-3">Phễu khách hàng</h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-lg bg-[#0b1016] p-3 text-center">
                  <p className="text-2xl font-extrabold text-white">{customers.totalLeads}</p>
                  <p className="text-[10px] text-zinc-500 uppercase mt-1">Tổng leads</p>
                </div>
                <div className="rounded-lg bg-[#0b1016] p-3 text-center">
                  <p className="text-2xl font-extrabold text-emerald-400">{customers.totalCustomers}</p>
                  <p className="text-[10px] text-zinc-500 uppercase mt-1">Đã mua</p>
                </div>
                <div className="rounded-lg bg-[#0b1016] p-3 text-center">
                  <p className="text-2xl font-extrabold text-blue-400">{customers.leadConversion}%</p>
                  <p className="text-[10px] text-zinc-500 uppercase mt-1">Lead → Mua</p>
                </div>
                <div className="rounded-lg bg-[#0b1016] p-3 text-center">
                  <p className="text-2xl font-extrabold text-amber-400">{customers.appointmentConversion}%</p>
                  <p className="text-[10px] text-zinc-500 uppercase mt-1">Hẹn → Hoàn thành</p>
                </div>
              </div>
              {/* Stage breakdown */}
              <div className="space-y-1.5">
                {customers.stageBreakdown.map((s) => {
                  const pct = customers.totalLeads > 0 ? Math.round((s.count / customers.totalLeads) * 100) : 0;
                  return (
                    <div key={s.stage} className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-400 w-24 truncate">{STAGE_LABELS[s.stage] || s.stage}</span>
                      <div className="flex-1 h-2 rounded-full bg-[#0b1016] overflow-hidden">
                        <div className="h-full rounded-full bg-[#e31837]/70" style={{ width: `${Math.max(pct, 2)}%` }} />
                      </div>
                      <span className="text-[10px] font-bold text-zinc-300 w-8 text-right">{s.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Aging Cars */}
          {inventory.agingCars.length > 0 && (
            <div className="rounded-lg border border-amber-500/20 bg-[#151a22] p-4">
               <h3 className="text-sm font-bold text-amber-400 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Xe tồn kho lâu (&gt;60 ngày)
              </h3>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {inventory.agingCars.map((car) => (
                  <div key={car.id} className="flex items-center gap-3 rounded-lg bg-[#0b1016] p-3">
                    <img src={car.thumbnail} alt={car.title} className="w-14 h-10 rounded object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">{car.title}</p>
                      <p className="text-[10px] text-zinc-500">{car.brand} · {fmtVND(car.price)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-amber-400">{car.daysListed}</p>
                      <p className="text-[9px] text-zinc-500">ngày</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "loan" && loanAnalytics && (
        <div className="space-y-6">
          {/* Metrics cards */}
          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-[#151a22] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Tổng số lượt tính trả góp</p>
                  <h3 className="mt-2 text-3xl font-black text-white">{loanAnalytics.totalSimulations}</h3>
                </div>
                <div className="rounded-full bg-blue-500/10 p-3 text-blue-400">
                  <Calculator size={24} />
                </div>
              </div>
              <p className="mt-3 text-xs text-zinc-400">Tổng số lượt người dùng sử dụng máy tính trả góp trên website.</p>
            </div>

            <div className="rounded-lg border border-white/10 bg-[#151a22] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Tỷ lệ chuyển đổi thành khách mua</p>
                  <h3 className="mt-2 text-3xl font-black text-emerald-400">{loanAnalytics.conversionRate}%</h3>
                </div>
                <div className="rounded-full bg-emerald-500/10 p-3 text-emerald-400">
                  <TrendingUp size={24} />
                </div>
              </div>
              <p className="mt-3 text-xs text-zinc-400">Phần trăm khách hàng tính trả góp chuyển sang trạng thái đã mua xe (purchased).</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
            {/* Top Stats */}
            <div className="space-y-6">
              {/* Top Cars */}
              <div className="rounded-lg border border-white/10 bg-[#151a22] p-5">
                <h3 className="text-sm font-bold text-white mb-4">Top xe tính trả góp</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-zinc-400 uppercase tracking-wider font-bold">
                        <th className="pb-2">Tên xe</th>
                        <th className="pb-2 text-right">Lượt tính</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-zinc-300">
                      {loanAnalytics.topCars.map((car, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.01]">
                          <td className="py-2.5 font-semibold text-white">
                            {car.carName}
                          </td>
                          <td className="py-2.5 text-right font-bold text-blue-400">{car.count}</td>
                        </tr>
                      ))}
                      {loanAnalytics.topCars.length === 0 && (
                        <tr>
                          <td colSpan={2} className="py-4 text-center text-zinc-500">Chưa có dữ liệu.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top Terms */}
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="rounded-lg border border-white/10 bg-[#151a22] p-5">
                  <h3 className="text-sm font-bold text-white mb-4">Kỳ hạn vay phổ biến</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 text-zinc-400 uppercase tracking-wider font-bold">
                          <th className="pb-2">Kỳ hạn</th>
                          <th className="pb-2 text-right">Số lượt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-zinc-300">
                        {loanAnalytics.topTerms.map((term, idx) => (
                          <tr key={idx} className="hover:bg-white/[0.01]">
                            <td className="py-2.5 text-white font-semibold">{term.termMonths} tháng</td>
                            <td className="py-2.5 text-right font-bold text-purple-400">{term.count}</td>
                          </tr>
                        ))}
                        {loanAnalytics.topTerms.length === 0 && (
                          <tr>
                            <td colSpan={2} className="py-4 text-center text-zinc-500">Chưa có dữ liệu.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="rounded-lg border border-white/10 bg-[#151a22] p-5">
                  <h3 className="text-sm font-bold text-white mb-4">Mức trả trước phổ biến</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 text-zinc-400 uppercase tracking-wider font-bold">
                          <th className="pb-2">Tỷ lệ</th>
                          <th className="pb-2 text-right">Số lượt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-zinc-300">
                        {loanAnalytics.topDownPayments.map((dp, idx) => (
                          <tr key={idx} className="hover:bg-white/[0.01]">
                            <td className="py-2.5 text-white font-semibold">{dp.downPaymentPercent}%</td>
                            <td className="py-2.5 text-right font-bold text-amber-400">{dp.count}</td>
                          </tr>
                        ))}
                        {loanAnalytics.topDownPayments.length === 0 && (
                          <tr>
                            <td colSpan={2} className="py-4 text-center text-zinc-500">Chưa có dữ liệu.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Leads */}
            <div className="rounded-lg border border-white/10 bg-[#151a22] p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-white">Khách hàng đăng ký trả góp mới</h3>
                <button
                  onClick={() => exportCSV(loanAnalytics.latestLeads, "Leads_Tra_Gop")}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-400 hover:text-white bg-white/5 px-2 py-1 rounded transition-colors"
                >
                  <Download size={10} /> Xuất CSV
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-zinc-400 uppercase tracking-wider font-bold">
                      <th className="pb-2">Khách hàng</th>
                      <th className="pb-2">Xe</th>
                      <th className="pb-2 text-right">Giá trị vay</th>
                      <th className="pb-2 text-right">Hàng tháng</th>
                      <th className="pb-2 text-right">Ngày tính</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-zinc-300">
                    {loanAnalytics.latestLeads.map((lead, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.01]">
                        <td className="py-2.5">
                          <p className="font-bold text-white">{lead.customer_name}</p>
                          <p className="text-[10px] text-zinc-500">{lead.phone} · {lead.email}</p>
                        </td>
                        <td className="py-2.5">
                          <span className="font-semibold text-zinc-300">{lead.carName}</span>
                        </td>
                        <td className="py-2.5 text-right font-medium text-white">
                          {new Intl.NumberFormat("vi-VN").format(lead.loan_amount)}đ
                        </td>
                        <td className="py-2.5 text-right font-bold text-emerald-400">
                          {new Intl.NumberFormat("vi-VN").format(lead.monthly_payment)}đ
                        </td>
                        <td className="py-2.5 text-right text-zinc-500">
                          {new Date(lead.created_at).toLocaleDateString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric"
                          })}
                        </td>
                      </tr>
                    ))}
                    {loanAnalytics.latestLeads.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-zinc-500">Chưa có khách đăng ký tính trả góp.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== TAB: AI ASSISTANT ========== */}
      {tab === "ai" && aiAnalytics && (
        <div className="space-y-6">
          {/* Metrics cards */}
          <div className="grid gap-5 md:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-[#151a22] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Tổng cuộc trò chuyện AI</p>
                  <h3 className="mt-2 text-3xl font-black text-white">{aiAnalytics.totalChats}</h3>
                </div>
                <div className="rounded-full bg-indigo-500/10 p-3 text-indigo-400">
                  <Sparkles size={24} />
                </div>
              </div>
              <p className="mt-3 text-xs text-zinc-400">Tổng số phiên tư vấn tự động qua AI Sales Assistant.</p>
            </div>

            <div className="rounded-lg border border-white/10 bg-[#151a22] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Số lead chốt từ AI</p>
                  <h3 className="mt-2 text-3xl font-black text-blue-400">{aiAnalytics.totalLeads}</h3>
                </div>
                <div className="rounded-full bg-blue-500/10 p-3 text-blue-400">
                  <UserPlus size={24} />
                </div>
              </div>
              <p className="mt-3 text-xs text-zinc-400">Khách hàng để lại thông tin liên hệ (Tên, SĐT) qua AI Chatbot.</p>
            </div>

            <div className="rounded-lg border border-white/10 bg-[#151a22] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Tỷ lệ chuyển đổi mua hàng</p>
                  <h3 className="mt-2 text-3xl font-black text-emerald-400">{aiAnalytics.conversionRate}%</h3>
                </div>
                <div className="rounded-full bg-emerald-500/10 p-3 text-emerald-400">
                  <TrendingUp size={24} />
                </div>
              </div>
              <p className="mt-3 text-xs text-zinc-400">Phần trăm khách hàng từ AI chốt được giao dịch mua xe thành công.</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
            {/* Top Stats */}
            <div className="space-y-6">
              {/* Top Cars Asked */}
              <div className="rounded-lg border border-white/10 bg-[#151a22] p-5">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <Car className="w-4 h-4 text-blue-400" />
                  Top xe được hỏi nhiều nhất qua AI
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-zinc-400 uppercase tracking-wider font-bold">
                        <th className="pb-2">Tên xe</th>
                        <th className="pb-2 text-right">Lượt quan tâm</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-zinc-300">
                      {aiAnalytics.topCarsAsked.map((car, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.01]">
                          <td className="py-2.5 font-semibold text-white">
                            {car.carName}
                          </td>
                          <td className="py-2.5 text-right font-bold text-blue-400">{car.count} lượt</td>
                        </tr>
                      ))}
                      {aiAnalytics.topCarsAsked.length === 0 && (
                        <tr>
                          <td colSpan={2} className="py-4 text-center text-zinc-500">Chưa có dữ liệu xe được hỏi.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top Cars Recommended */}
              <div className="rounded-lg border border-white/10 bg-[#151a22] p-5">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  Top xe được đề xuất nhiều nhất (Điểm trung bình)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-zinc-400 uppercase tracking-wider font-bold">
                        <th className="pb-2">Tên xe</th>
                        <th className="pb-2 text-right">Điểm trung bình</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-zinc-300">
                      {aiAnalytics.topCarsRecommended.map((car, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.01]">
                          <td className="py-2.5 text-white font-semibold">{car.carName}</td>
                          <td className="py-2.5 text-right font-bold text-emerald-400">{car.score} / 100</td>
                        </tr>
                      ))}
                      {aiAnalytics.topCarsRecommended.length === 0 && (
                        <tr>
                          <td colSpan={2} className="py-4 text-center text-zinc-500">Chưa có dữ liệu đề xuất.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Recent AI Leads */}
            <div className="rounded-lg border border-white/10 bg-[#151a22] p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  Danh sách Lead nóng chốt từ AI Chatbot
                </h3>
                <button
                  onClick={() => exportCSV(aiAnalytics.latestLeads, "Leads_AI_Chatbot")}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-400 hover:text-white bg-white/5 px-2 py-1 rounded transition-colors"
                >
                  <Download size={10} /> Xuất CSV
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-zinc-400 uppercase tracking-wider font-bold">
                      <th className="pb-2">Khách hàng</th>
                      <th className="pb-2">Trạng thái</th>
                      <th className="pb-2 text-right">Ngày chốt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-zinc-300">
                    {aiAnalytics.latestLeads.map((lead, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.01]">
                        <td className="py-2.5">
                          <p className="font-bold text-white">{lead.name}</p>
                          <p className="text-[10px] text-zinc-500">{lead.phone} {lead.email ? `· ${lead.email}` : ''}</p>
                        </td>
                        <td className="py-2.5">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            lead.stage === 'purchased' ? 'bg-emerald-500/10 text-emerald-400' :
                            lead.stage === 'appointment' ? 'bg-blue-500/10 text-blue-400' :
                            lead.stage === 'new_lead' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                            'bg-zinc-500/10 text-zinc-400'
                          }`}>
                            {STAGE_LABELS[lead.stage] || lead.stage}
                          </span>
                        </td>
                        <td className="py-2.5 text-right text-zinc-500">
                          {new Date(lead.created_at).toLocaleDateString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </td>
                      </tr>
                    ))}
                    {aiAnalytics.latestLeads.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-zinc-500">Chưa có lead nào từ AI Chatbot.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
