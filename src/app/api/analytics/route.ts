import { NextResponse } from "next/server";
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "overview";

    switch (type) {
      case "overview":
        return NextResponse.json({ success: true, data: await getOverviewStats() });

      case "revenue": {
        const from = searchParams.get("from") || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
        const to = searchParams.get("to") || new Date().toISOString().slice(0, 10);
        const groupBy = (searchParams.get("groupBy") as "day" | "month") || "day";
        return NextResponse.json({ success: true, data: await getRevenueByPeriod(from, to, groupBy) });
      }

      case "revenue-brand":
        return NextResponse.json({ success: true, data: await getRevenueByBrand() });

      case "sold": {
        const brand = searchParams.get("brand") || undefined;
        return NextResponse.json({ success: true, data: await getSoldCarsAnalytics(brand) });
      }

      case "brands":
        return NextResponse.json({ success: true, data: await getBrandStats() });

      case "top":
        return NextResponse.json({ success: true, data: await getTopSellingData() });

      case "staff":
        return NextResponse.json({ success: true, data: await getStaffPerformance() });

      case "inventory":
        return NextResponse.json({ success: true, data: await getInventoryAnalytics() });

      case "customers":
        return NextResponse.json({ success: true, data: await getCustomerAnalytics() });

      default:
        return NextResponse.json({ success: false, message: "Unknown type" }, { status: 400 });
    }
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
