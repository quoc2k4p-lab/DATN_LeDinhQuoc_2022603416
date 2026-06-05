import { CalendarDays, CheckCircle2, Clock, Plus, XCircle } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { appointments } from "@/data/mock";

export default function AppointmentsPage() {
  return (
    <AdminShell
      title="Quản lý lịch hẹn"
      subtitle="Theo dõi, xác nhận, hoàn thành hoặc hủy lịch hẹn xem xe theo yêu cầu F10."
    >
      <div className="mb-6 flex justify-end">
        <Button><Plus size={18} /> Tạo lịch hẹn</Button>
      </div>
      <div className="grid gap-8 xl:grid-cols-[360px_1fr]">
        <div className="rounded-md border border-white/10 bg-[#151a22] p-6">
          <CalendarDays className="mb-6 text-[#e31837]" size={28} />
          <h2 className="font-display text-2xl font-bold">Hôm nay</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">Các slot đã đặt và cần xác nhận trong ngày.</p>
          <div className="mt-6 space-y-3">
            {appointments.map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-md border border-white/10 bg-white/5 p-3 text-sm font-semibold">
                <Clock size={16} className="text-[#e31837]" />
                {item.time} - {item.customer}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {appointments.map((item) => (
            <article key={item.id} className="rounded-md border border-white/10 bg-[#151a22] p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="mb-3 flex items-center gap-3">
                    <h3 className="font-display text-xl font-bold">{item.customer}</h3>
                    <Badge>{item.status}</Badge>
                  </div>
                  <div className="grid gap-2 text-sm text-zinc-400 sm:grid-cols-2">
                    <p>Xe: <span className="font-semibold text-zinc-200">{item.car}</span></p>
                    <p>Thời gian: <span className="font-semibold text-zinc-200">{item.date} {item.time}</span></p>
                    <p>SĐT: {item.phone}</p>
                    <p>Email: {item.email}</p>
                  </div>
                  <p className="mt-3 text-sm text-zinc-400">{item.note}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="inline-flex h-10 items-center gap-2 rounded-md border border-emerald-500/30 px-3 text-sm font-semibold text-emerald-300">
                    <CheckCircle2 size={16} /> Xác nhận
                  </button>
                  <button className="inline-flex h-10 items-center gap-2 rounded-md border border-white/10 px-3 text-sm font-semibold text-zinc-300">
                    <CheckCircle2 size={16} /> Hoàn thành
                  </button>
                  <button className="inline-flex h-10 items-center gap-2 rounded-md border border-red-500/30 px-3 text-sm font-semibold text-red-300">
                    <XCircle size={16} /> Hủy
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
