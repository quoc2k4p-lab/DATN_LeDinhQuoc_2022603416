export const dynamic = "force-dynamic";

import { getAppointments, getCars } from "@/lib/db";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminAppointmentList, AppointmentUiItem } from "@/components/admin/AdminAppointmentList";

export default async function AppointmentsPage() {
  const dbAppointments = await getAppointments();
  const dbCars = await getCars();

  // Map database appointments to UI format
  const appointments: AppointmentUiItem[] = dbAppointments.map((app) => {
    const car = dbCars.find((c) => c.id === app.car_id);
    
    let dateStr = "";
    let timeStr = "";
    try {
      const d = new Date(app.appointment_date);
      // Format as YYYY-MM-DD for easy comparison, but nice display
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      dateStr = `${year}-${month}-${day}`;
      
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      timeStr = `${hours}:${minutes}`;
    } catch (e) {
      dateStr = app.appointment_date.split("T")[0] || "";
      timeStr = app.appointment_date.split("T")[1]?.substring(0, 5) || "09:30";
    }

    return {
      id: app.id,
      // Use snapshot columns (set at booking time) — never changes even if customer updates profile
      customerName: app.customer_snapshot_name || app.customer_name,
      phone: app.customer_snapshot_phone || app.customer_phone,
      email: app.customer_snapshot_email || app.customer_email,
      carName: car ? car.title : "Xe đã ẩn/xóa",
      carAddress: car ? car.address : "Showroom TQ Auto",
      date: dateStr,
      time: timeStr,
      note: app.note,
      status: app.status,
      // user_id is stored directly on the appointment row now
      customerType: app.user_id ? "Tài khoản" : "Khách vãng lai",
      assignedStaffName: app.assigned_staff_name || null,
    };
  });

  // Return the list in the newest-first order as returned from the database query

  const cars = dbCars.map((c) => ({
    id: c.id,
    name: c.title,
    status: c.status,
  }));

  return (
    <AdminShell
      title="Quản lý lịch hẹn"
      subtitle="Theo dõi, xác nhận, hoàn thành hoặc hủy lịch hẹn xem xe theo yêu cầu."
    >
      <AdminAppointmentList initialAppointments={appointments} cars={cars} />
    </AdminShell>
  );
}
