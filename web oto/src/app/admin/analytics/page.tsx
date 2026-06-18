export const dynamic = "force-dynamic";

import { AdminShell } from "@/components/admin/AdminShell";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";
import { ensureDbExists, getAppointments, getCars } from "@/lib/db";
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

  // eslint-disable-next-line react-hooks/purity
  const dateFrom = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  // eslint-disable-next-line react-hooks/purity
  const dateTo = new Date().toISOString().slice(0, 10);

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
    dbAppointments,
    dbCars,
  ] = await Promise.all([
    getOverviewStats(),
    getRevenueByPeriod(dateFrom, dateTo),
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
    getAppointments(),
    getCars(),
  ]);

  const appointments = dbAppointments.map((app) => {
    const car = dbCars.find((c) => c.id === app.car_id);
    return {
      id: app.id,
      customerName: app.customer_snapshot_name || app.customer_name,
      phone: app.customer_snapshot_phone || app.customer_phone,
      email: app.customer_snapshot_email || app.customer_email,
      carName: car ? car.title : "Xe đã ẩn/xóa",
      appointment_date: app.appointment_date,
      note: app.note,
      status: app.status,
    };
  });

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
        initialAppointments={appointments}
      />
    </AdminShell>
  );
}
