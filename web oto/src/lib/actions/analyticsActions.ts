"use server";

import { getPool } from "@/lib/db";
import crypto from "crypto";

// ===================== TYPES =====================

export interface OverviewStats {
  totalRevenue: number;
  soldThisMonth: number;
  soldThisYear: number;
  totalCustomers: number;
  totalAppointments: number;
  totalInventory: number;
  newLeads: number;
  totalSold: number;
}

export interface RevenuePoint {
  label: string;
  revenue: number;
}

export interface BrandRevenue {
  name: string;
  value: number;
  count: number;
}

export interface SoldCarDetail {
  id: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  thumbnail: string;
  listPrice: number;
  soldPrice: number;
  soldAt: string;
  staffName: string;
  buyerName: string;
}

export interface BrandStat {
  brand: string;
  totalCars: number;
  soldCars: number;
  totalRevenue: number;
  availableCars: number;
}

export interface TopSellingData {
  topCars: { title: string; brand: string; soldPrice: number; soldAt: string }[];
  topBrands: { brand: string; count: number; revenue: number }[];
  mostViewed: { title: string; brand: string; views: number; thumbnail: string }[];
}

export interface StaffPerf {
  id: string;
  name: string;
  carsSold: number;
  totalRevenue: number;
  totalLeads: number;
  conversionRate: number;
}

export interface InventoryStats {
  available: number;
  reserved: number;
  sold: number;
  hidden: number;
  agingCars: { id: string; title: string; brand: string; price: number; daysListed: number; thumbnail: string }[];
}

export interface CustomerStats {
  totalLeads: number;
  totalCustomers: number;
  leadConversion: number;
  appointmentConversion: number;
  stageBreakdown: { stage: string; count: number }[];
}

// ===================== ACTIONS =====================

export async function getOverviewStats(): Promise<OverviewStats> {
  const pool = getPool();

  const [revRes] = await pool.query(
    "SELECT COALESCE(SUM(sold_price), 0) as total FROM cars WHERE status = 'sold' AND sold_price IS NOT NULL;"
  );
  const totalRevenue = Number((revRes as any[])[0]?.total) || 0;

  const [monthRes] = await pool.query(
    "SELECT COUNT(*) as cnt FROM cars WHERE status = 'sold' AND sold_at IS NOT NULL AND MONTH(sold_at) = MONTH(NOW()) AND YEAR(sold_at) = YEAR(NOW());"
  );
  const soldThisMonth = Number((monthRes as any[])[0]?.cnt) || 0;

  const [yearRes] = await pool.query(
    "SELECT COUNT(*) as cnt FROM cars WHERE status = 'sold' AND sold_at IS NOT NULL AND YEAR(sold_at) = YEAR(NOW());"
  );
  const soldThisYear = Number((yearRes as any[])[0]?.cnt) || 0;

  const [custRes] = await pool.query("SELECT COUNT(*) as cnt FROM customers;");
  const totalCustomers = Number((custRes as any[])[0]?.cnt) || 0;

  const [aptRes] = await pool.query("SELECT COUNT(*) as cnt FROM appointments;");
  const totalAppointments = Number((aptRes as any[])[0]?.cnt) || 0;

  const [invRes] = await pool.query("SELECT COUNT(*) as cnt FROM cars WHERE status IN ('available', 'reserved');");
  const totalInventory = Number((invRes as any[])[0]?.cnt) || 0;

  const [leadRes] = await pool.query(
    "SELECT COUNT(*) as cnt FROM customers WHERE stage = 'new_lead' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY);"
  );
  const newLeads = Number((leadRes as any[])[0]?.cnt) || 0;

  const [soldRes] = await pool.query("SELECT COUNT(*) as cnt FROM cars WHERE status = 'sold';");
  const totalSold = Number((soldRes as any[])[0]?.cnt) || 0;

  return { totalRevenue, soldThisMonth, soldThisYear, totalCustomers, totalAppointments, totalInventory, newLeads, totalSold };
}

export async function getRevenueByPeriod(
  from: string,
  to: string,
  groupBy: "day" | "month" = "day"
): Promise<RevenuePoint[]> {
  const pool = getPool();

  const dateFormat = groupBy === "month" ? "%Y-%m" : "%Y-%m-%d";
  const labelFormat = groupBy === "month" ? "%m/%Y" : "%d/%m";

  const [rows] = await pool.query(
    `SELECT DATE_FORMAT(sold_at, ?) as period, DATE_FORMAT(sold_at, ?) as label, 
     COALESCE(SUM(sold_price), 0) as revenue
     FROM cars
     WHERE status = 'sold' AND sold_at IS NOT NULL
       AND sold_at >= ? AND sold_at <= CONCAT(?, ' 23:59:59')
     GROUP BY period, label
     ORDER BY period ASC;`,
    [dateFormat, labelFormat, from, to]
  );

  return (rows as any[]).map((r) => ({
    label: r.label || r.period,
    revenue: Number(r.revenue) || 0,
  }));
}

export async function getRevenueByBrand(): Promise<BrandRevenue[]> {
  const pool = getPool();

  const [rows] = await pool.query(
    `SELECT brand as name, COALESCE(SUM(sold_price), 0) as value, COUNT(*) as count
     FROM cars
     WHERE status = 'sold' AND sold_price IS NOT NULL
     GROUP BY brand
     ORDER BY value DESC;`
  );

  return (rows as any[]).map((r) => ({
    name: r.name,
    value: Number(r.value) || 0,
    count: Number(r.count) || 0,
  }));
}

export async function getSoldCarsAnalytics(brand?: string): Promise<SoldCarDetail[]> {
  const pool = getPool();

  let query = `
    SELECT c.id, c.title, c.brand, c.model, c.year, c.thumbnail, c.price as listPrice,
           c.sold_price as soldPrice, c.sold_at as soldAt,
           COALESCE(u.full_name, 'N/A') as staffName,
           COALESCE(cu.full_name, 'N/A') as buyerName
    FROM cars c
    LEFT JOIN users u ON c.sold_by = u.id
    LEFT JOIN customers cu ON c.buyer_id = cu.id
    WHERE c.status = 'sold'
  `;
  const params: any[] = [];

  if (brand && brand !== "all") {
    query += " AND c.brand = ?";
    params.push(brand);
  }

  query += " ORDER BY c.sold_at DESC;";

  const [rows] = await pool.query(query, params);

  return (rows as any[]).map((r) => ({
    id: r.id,
    title: r.title,
    brand: r.brand,
    model: r.model,
    year: r.year,
    thumbnail: r.thumbnail,
    listPrice: Number(r.listPrice) || 0,
    soldPrice: Number(r.soldPrice) || 0,
    soldAt: r.soldAt ? new Date(r.soldAt).toLocaleDateString("vi-VN") : "N/A",
    staffName: r.staffName,
    buyerName: r.buyerName,
  }));
}

export async function getBrandStats(): Promise<BrandStat[]> {
  const pool = getPool();

  const [rows] = await pool.query(`
    SELECT brand,
           COUNT(*) as totalCars,
           SUM(CASE WHEN status = 'sold' THEN 1 ELSE 0 END) as soldCars,
           COALESCE(SUM(CASE WHEN status = 'sold' THEN sold_price ELSE 0 END), 0) as totalRevenue,
           SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as availableCars
    FROM cars
    GROUP BY brand
    ORDER BY totalRevenue DESC;
  `);

  return (rows as any[]).map((r) => ({
    brand: r.brand,
    totalCars: Number(r.totalCars) || 0,
    soldCars: Number(r.soldCars) || 0,
    totalRevenue: Number(r.totalRevenue) || 0,
    availableCars: Number(r.availableCars) || 0,
  }));
}

export async function getTopSellingData(): Promise<TopSellingData> {
  const pool = getPool();

  const [topCarsRes] = await pool.query(`
    SELECT title, brand, sold_price as soldPrice, sold_at as soldAt
    FROM cars WHERE status = 'sold' AND sold_price IS NOT NULL
    ORDER BY sold_price DESC LIMIT 5;
  `);

  const [topBrandsRes] = await pool.query(`
    SELECT brand, COUNT(*) as count, COALESCE(SUM(sold_price), 0) as revenue
    FROM cars WHERE status = 'sold' AND sold_price IS NOT NULL
    GROUP BY brand ORDER BY count DESC LIMIT 5;
  `);

  const [mostViewedRes] = await pool.query(`
    SELECT title, brand, views, thumbnail
    FROM cars ORDER BY views DESC LIMIT 5;
  `);

  return {
    topCars: (topCarsRes as any[]).map((r) => ({
      title: r.title,
      brand: r.brand,
      soldPrice: Number(r.soldPrice) || 0,
      soldAt: r.soldAt ? new Date(r.soldAt).toLocaleDateString("vi-VN") : "N/A",
    })),
    topBrands: (topBrandsRes as any[]).map((r) => ({
      brand: r.brand,
      count: Number(r.count) || 0,
      revenue: Number(r.revenue) || 0,
    })),
    mostViewed: (mostViewedRes as any[]).map((r) => ({
      title: r.title,
      brand: r.brand,
      views: Number(r.views) || 0,
      thumbnail: r.thumbnail,
    })),
  };
}

export async function getStaffPerformance(): Promise<StaffPerf[]> {
  const pool = getPool();

  const [rows] = await pool.query(`
    SELECT u.id, u.full_name as name,
           COALESCE(sold.cnt, 0) as carsSold,
           COALESCE(sold.rev, 0) as totalRevenue,
           COALESCE(leads.cnt, 0) as totalLeads
    FROM users u
    LEFT JOIN (
      SELECT sold_by, COUNT(*) as cnt, SUM(sold_price) as rev
      FROM cars WHERE status = 'sold' AND sold_by IS NOT NULL
      GROUP BY sold_by
    ) sold ON u.id = sold.sold_by
    LEFT JOIN (
      SELECT assigned_staff_id, COUNT(*) as cnt
      FROM customers WHERE assigned_staff_id IS NOT NULL
      GROUP BY assigned_staff_id
    ) leads ON u.id = leads.assigned_staff_id
    WHERE u.role IN ('admin', 'staff')
    ORDER BY carsSold DESC;
  `);

  return (rows as any[]).map((r) => ({
    id: r.id,
    name: r.name,
    carsSold: Number(r.carsSold) || 0,
    totalRevenue: Number(r.totalRevenue) || 0,
    totalLeads: Number(r.totalLeads) || 0,
    conversionRate: r.totalLeads > 0 ? Math.round((r.carsSold / r.totalLeads) * 100) : 0,
  }));
}

export async function getInventoryAnalytics(): Promise<InventoryStats> {
  const pool = getPool();

  const [statusRes] = await pool.query(`
    SELECT status, COUNT(*) as cnt FROM cars GROUP BY status;
  `);

  const statusMap: Record<string, number> = {};
  for (const r of statusRes as any[]) {
    statusMap[r.status] = Number(r.cnt) || 0;
  }

  const [agingRes] = await pool.query(`
    SELECT id, title, brand, price, thumbnail,
           DATEDIFF(NOW(), created_at) as daysListed
    FROM cars
    WHERE status = 'available' AND DATEDIFF(NOW(), created_at) > 60
    ORDER BY daysListed DESC
    LIMIT 10;
  `);

  return {
    available: statusMap["available"] || 0,
    reserved: statusMap["reserved"] || 0,
    sold: statusMap["sold"] || 0,
    hidden: statusMap["hidden"] || 0,
    agingCars: (agingRes as any[]).map((r) => ({
      id: r.id,
      title: r.title,
      brand: r.brand,
      price: Number(r.price) || 0,
      daysListed: Number(r.daysListed) || 0,
      thumbnail: r.thumbnail,
    })),
  };
}

export async function getCustomerAnalytics(): Promise<CustomerStats> {
  const pool = getPool();

  const [totalLeadsRes] = await pool.query("SELECT COUNT(*) as cnt FROM customers;");
  const totalLeads = Number((totalLeadsRes as any[])[0]?.cnt) || 0;

  const [purchasedRes] = await pool.query("SELECT COUNT(*) as cnt FROM customers WHERE stage = 'purchased';");
  const totalCustomers = Number((purchasedRes as any[])[0]?.cnt) || 0;

  const leadConversion = totalLeads > 0 ? Math.round((totalCustomers / totalLeads) * 100) : 0;

  const [aptTotalRes] = await pool.query("SELECT COUNT(*) as cnt FROM appointments;");
  const aptTotal = Number((aptTotalRes as any[])[0]?.cnt) || 0;

  const [aptCompletedRes] = await pool.query("SELECT COUNT(*) as cnt FROM appointments WHERE status = 'completed';");
  const aptCompleted = Number((aptCompletedRes as any[])[0]?.cnt) || 0;

  const appointmentConversion = aptTotal > 0 ? Math.round((aptCompleted / aptTotal) * 100) : 0;

  const [stageRes] = await pool.query(`
    SELECT stage, COUNT(*) as count FROM customers GROUP BY stage ORDER BY count DESC;
  `);

  return {
    totalLeads,
    totalCustomers,
    leadConversion,
    appointmentConversion,
    stageBreakdown: (stageRes as any[]).map((r) => ({
      stage: r.stage,
      count: Number(r.count) || 0,
    })),
  };
}

// ===================== MARK CAR AS SOLD =====================

export async function markCarAsSold(
  carId: string,
  soldPrice: number,
  soldBy: string,
  buyerId?: string
): Promise<{ success: boolean; message?: string }> {
  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Get old status
    const [carRows] = await connection.query("SELECT status FROM cars WHERE id = ? LIMIT 1;", [carId]);
    const oldStatus = (carRows as any[])[0]?.status || "available";

    // 2. Update car
    await connection.query(
      `UPDATE cars SET status = 'sold', sold_price = ?, sold_at = NOW(), sold_by = ?, buyer_id = ?
       WHERE id = ?;`,
      [soldPrice, soldBy, buyerId || null, carId]
    );

    // 3. Update customer stage if buyer provided
    if (buyerId) {
      await connection.query(
        "UPDATE customers SET stage = 'purchased', updated_at = NOW() WHERE id = ?;",
        [buyerId]
      );
    }

    // 4. Insert notification
    await connection.query(
      `INSERT INTO notifications (id, user_id, title, content, link, is_read, created_at)
       VALUES (?, NULL, ?, ?, ?, 0, NOW());`,
      [
        crypto.randomUUID(),
        "Xe đã bán",
        `Xe #${carId.substring(0, 8)} đã được bán thành công.`,
        "/admin/analytics",
      ]
    );

    // 5. Insert audit log
    await connection.query(
      `INSERT INTO audit_logs (id, car_id, user_id, action, old_status, new_status, details, created_at)
       VALUES (?, ?, ?, 'mark_as_sold', ?, 'sold', ?, NOW());`,
      [
        crypto.randomUUID(),
        carId,
        soldBy,
        oldStatus,
        JSON.stringify({ soldPrice, buyerId: buyerId || null }),
      ]
    );

    await connection.commit();
    return { success: true, message: "Cập nhật trạng thái bán xe và ghi nhận lịch sử giao dịch thành công." };
  } catch (error) {
    await connection.rollback();
    console.error("Error marking car as sold inside transaction:", error);
    return { success: false, message: "Không thể cập nhật trạng thái xe. Đã hoàn tác giao dịch." };
  } finally {
    connection.release();
  }
}

export type ComparedCarStat = { pair: string; count: number };
