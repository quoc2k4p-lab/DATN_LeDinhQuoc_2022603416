import { CalendarDays, CarFront, Users } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { InventoryTable } from "@/components/admin/InventoryTable";
import { StatCard } from "@/components/admin/StatCard";
import { DataTable } from "@/components/admin/DataTable";
import { appointments, stats } from "@/data/mock";

export default function AdminDashboardPage() {
  return (
    <AdminShell
      title="Admin Dashboard"
      subtitle="Tổng quan vận hành showroom, lịch hẹn và kho xe theo phong cách admin surface trong Stitch."
    >
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-[1fr_360px]">
        <InventoryTable />
        <div className="space-y-5">
          {[
            [CarFront, "12 xe mới", "Đã thêm vào kho trong 30 ngày"],
            [CalendarDays, "7 lịch hôm nay", "3 lịch cần xác nhận lại"],
            [Users, "18 lead nóng", "Ngân sách trên 1.5 tỷ"],
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
          rows={appointments}
        />
      </div>
    </AdminShell>
  );
}
