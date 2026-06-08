export const dynamic = "force-dynamic";

import { AdminShell } from "@/components/admin/AdminShell";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";
import { ensureDbExists } from "@/lib/db";
import {
  getOverviewStats,
  getRevenueByPeriod,
  getRevenueByBrand,
  getSoldCarsAnalytics,
  getBrandStats,
  getTopSellingData,
  getStaffPerformance,
  getInventoryAnalytics,
  getCustomerAnalytics,
} from "@/lib/actions/analyticsActions";
import { getTopComparedCars } from "@/lib/compare/compare-engine";
import { getLoanAnalyticsAction } from "@/lib/actions/loanActions";
import { getAiAssistantAnalyticsAction } from "@/lib/actions/aiAnalyticsActions";

export default async function AnalyticsPage() {
  await ensureDbExists();

  // Fetch all initial data in parallel
  const [
    overview,
    revenue,
    brandRevenue,
    soldCars,
    brandStats,
    topSelling,
    staffPerf,
    inventory,
    customers,
    compared,
    loanRes,
    aiRes,
  ] = await Promise.all([
    getOverviewStats(),
    getRevenueByPeriod(
      new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
      new Date().toISOString().slice(0, 10)
    ),
    getRevenueByBrand(),
    getSoldCarsAnalytics(),
    getBrandStats(),
    getTopSellingData(),
    getStaffPerformance(),
    getInventoryAnalytics(),
    getCustomerAnalytics(),
    getTopComparedCars(),
    getLoanAnalyticsAction(),
    getAiAssistantAnalyticsAction(),
  ]);

  return (
    <AdminShell
      title="Thống kê & Phân tích"
      subtitle="Doanh thu, hiệu suất bán hàng, kho xe và phân tích khách hàng."
    >
      <AnalyticsDashboard
        initialOverview={overview}
        initialRevenue={revenue}
        initialBrandRevenue={brandRevenue}
        initialSoldCars={soldCars}
        initialBrandStats={brandStats}
        initialTopSelling={topSelling}
        initialStaffPerf={staffPerf}
        initialInventory={inventory}
        initialCustomers={customers}
        initialCompared={compared}
        initialLoan={loanRes.success ? loanRes.analytics : undefined}
        initialAi={aiRes.success ? aiRes.analytics : undefined}
      />
    </AdminShell>
  );
}
