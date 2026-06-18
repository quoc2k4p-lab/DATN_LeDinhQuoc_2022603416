export const dynamic = "force-dynamic";

import { CalendarDays, Clock, ShieldCheck } from "lucide-react";
import { Footer } from "@/components/public/Footer";
import { PublicHeader } from "@/components/public/PublicHeader";
import { getUiCars } from "@/lib/dbAdapter";
import { AppointmentForm } from "@/components/public/AppointmentForm";

export default async function AppointmentPage() {
  const cars = await getUiCars();

  return (
    <>
      <PublicHeader />
      <main className="theme-page">
        <section className="border-b theme-border py-12">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#e31837]">
              Test drive appointment
            </p>
            <h1 className="font-display text-5xl font-extrabold">Đặt lịch xem xe</h1>
            {/* <p className="mt-4 max-w-2xl leading-7 theme-subtle">
              Điền thông tin, chọn xe quan tâm và thời gian mong muốn. Lịch hẹn của bạn sẽ được lưu trữ vào hệ thống.
            </p> */}
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-8 lg:grid-cols-[1fr_360px]">
          <AppointmentForm cars={cars} />

          <aside className="space-y-4">
            {[
              [Clock, "Xác nhận nhanh", "Nhân viên liên hệ lại trong giờ làm việc."],
              [ShieldCheck, "Dữ liệu bảo mật", "Thông tin khách hàng chỉ dùng cho tư vấn showroom."],
              [CalendarDays, "Chủ động thời gian", "Chọn ngày giờ xem xe hoặc đăng ký lái thử."],
            ].map(([Icon, title, copy]) => (
              <div key={String(title)} className="rounded-md border theme-surface p-5">
                <Icon className="mb-5 text-[#e31837]" size={24} />
                <h2 className="font-display text-xl font-bold">{String(title)}</h2>
                <p className="mt-2 text-sm leading-6 theme-subtle">{String(copy)}</p>
              </div>
            ))}
          </aside>
        </section>
      </main>
      <Footer />
    </>
  );
}
