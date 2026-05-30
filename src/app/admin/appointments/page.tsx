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
      customerName: app.customer_name,
      phone: app.customer_phone,
      email: app.customer_email,
      carName: car ? car.title : "Xe đã ẩn/xóa",
      date: dateStr,
      time: timeStr,
      note: app.note,
      status: app.status,
    };
  });

  // Sort appointments so that pending/recent ones are on top
  const statusPriority = { pending: 0, confirmed: 1, completed: 2, cancelled: 3 };
  appointments.sort((a, b) => {
    if (statusPriority[a.status] !== statusPriority[b.status]) {
      return statusPriority[a.status] - statusPriority[b.status];
    }
    return b.date.localeCompare(a.date) || b.time.localeCompare(a.time);
  });

  return (
    <AdminShell
      title="Quản lý lịch hẹn"
      subtitle="Theo dõi, xác nhận, hoàn thành hoặc hủy lịch hẹn xem xe theo yêu cầu F10."
    >
      <AdminAppointmentList initialAppointments={appointments} />
    </AdminShell>
  );
}
