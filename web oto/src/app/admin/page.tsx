export const dynamic = "force-dynamic";

import { CalendarDays, CarFront, Users } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { InventoryTable } from "@/components/admin/InventoryTable";
import { StatCard } from "@/components/admin/StatCard";
import { DataTable } from "@/components/admin/DataTable";
import { getPool, ensureDbExists } from "@/lib/db";
import { getUiCars } from "@/lib/dbAdapter";
import { getMeAction } from "@/lib/actions/auth";

export default async function AdminDashboardPage() {
  // Determine basePath based on user role
  const meRes = await getMeAction();
  const role = meRes?.user?.role;
  const basePath = role === "staff" ? "/staff" : "/admin";

  // Ensure DB and get connection pool
  await ensureDbExists();
  const pool = getPool();

  // 1. Fetch data for stats
  const [availableCarsRes] = await pool.query("SELECT COUNT(*) as count FROM cars WHERE status = 'available';");
  const availableCars = (availableCarsRes as any)[0]?.count || 0;

  const [appointmentsWeekRes] = await pool.query(
    "SELECT COUNT(*) as count FROM appointments WHERE appointment_date >= DATE_SUB(NOW(), INTERVAL 7 DAY);"
  );
  const appointmentsWeek = (appointmentsWeekRes as any)[0]?.count || 0;

  const [customersRes] = await pool.query("SELECT COUNT(*) as count FROM customers;");
  const potentialCustomers = (customersRes as any)[0]?.count || 0;

  const [revenueRes] = await pool.query("SELECT SUM(price) as total FROM cars WHERE status IN ('available', 'reserved');");
  const totalRevenue = (revenueRes as any)[0]?.total || 0;
  const revenueStr = totalRevenue ? `${(Number(totalRevenue) / 1_000_000_000).toFixed(1)} tỷ` : "0 tỷ";

  const stats = [
    { label: "Xe đang bán", value: String(availableCars), trend: "+8%" },
    { label: "Lịch hẹn tuần này", value: String(appointmentsWeek), trend: "+12%" },
    { label: "Khách tiềm năng", value: String(potentialCustomers), trend: "+21%" },
    { label: "Doanh thu dự kiến", value: revenueStr, trend: "+5%" },
  ];

  // 2. Fetch data for inventory table
  const uiCars = await getUiCars(undefined, true);

  // 3. Fetch data for side cards
  const [newCarsRes] = await pool.query("SELECT COUNT(*) as count FROM cars WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY);");
  const newCarsCount = (newCarsRes as any)[0]?.count || 0;

  const [todayAptsRes] = await pool.query("SELECT COUNT(*) as count FROM appointments WHERE DATE(appointment_date) = CURDATE();");
  const todayAptsCount = (todayAptsRes as any)[0]?.count || 0;

  const [pendingAptsRes] = await pool.query("SELECT COUNT(*) as count FROM appointments WHERE status = 'pending';");
  const pendingAptsCount = (pendingAptsRes as any)[0]?.count || 0;

  const [hotLeadsRes] = await pool.query(`
    SELECT COUNT(DISTINCT cust.email) as count 
    FROM appointments a 
    JOIN customers cust ON a.customer_id = cust.id
    JOIN cars c ON a.car_id = c.id 
    WHERE c.price >= 1500000000;
  `);
  const hotLeadsCount = (hotLeadsRes as any)[0]?.count || 0;

  // 4. Fetch data for bottom appointments table
  const [appointmentsRes] = await pool.query(`
    SELECT a.*, car.title as car_title, cust.full_name as customer_name
    FROM appointments a
    LEFT JOIN cars car ON a.car_id = car.id
    JOIN customers cust ON a.customer_id = cust.id
    ORDER BY a.appointment_date DESC
    LIMIT 5;
  `);
  const rawAppointments = appointmentsRes as any[];

  const appointmentRows = rawAppointments.map((apt) => {
    const d = new Date(apt.appointment_date);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    
    let statusText = "Mới";
    if (apt.status === "confirmed") statusText = "Đã xác nhận";
    else if (apt.status === "pending") statusText = "Chờ xác nhận";
    else if (apt.status === "cancelled") statusText = "Đã hủy";
    else if (apt.status === "completed") statusText = "Hoàn thành";

    return {
      time: `${hours}:${minutes} (${day}/${month})`,
      customer: apt.customer_name,
      car: apt.car_title || "Không xác định",
      status: statusText,
    };
  });

  return (
    <AdminShell
      title="Admin Dashboard"
      subtitle="Tổng quan vận hành showroom, lịch hẹn và kho xe."
    >
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-[1fr_360px]">
        <InventoryTable cars={uiCars} basePath={basePath} />
        <div className="space-y-5">
          {[
            [CarFront, `${newCarsCount} xe mới`, "Đã thêm vào kho trong 30 ngày"],
            [CalendarDays, `${todayAptsCount} lịch hôm nay`, `${pendingAptsCount} lịch cần xác nhận lại`],
            [Users, `${hotLeadsCount} lead nóng`, "Ngân sách trên 1.5 tỷ"],
          ].map(([Icon, title, copy]) => (
            <div key={String(title)} className="rounded-md border border-white/10 bg-[#151a22] p-6">
              <Icon className="mb-6 text-[#e31837]" size={24} />
              <h3 className="font-display text-xl font-bold">{String(title)}</h3>
              <p className="mt-2 text-sm text-zinc-400">{String(copy)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <DataTable
          columns={[
            { key: "time", label: "Giờ" },
            { key: "customer", label: "Khách hàng" },
            { key: "car", label: "Xe quan tâm" },
            { key: "status", label: "Trạng thái", badge: true },
          ]}
          rows={appointmentRows}
        />
      </div>
    </AdminShell>
  );
}

