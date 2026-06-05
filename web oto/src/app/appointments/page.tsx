  import { CalendarDays, Clock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Footer } from "@/components/public/Footer";
import { FormField } from "@/components/public/FormField";
import { PublicHeader } from "@/components/public/PublicHeader";
import { cars } from "@/data/mock";

export default function AppointmentPage() {
  return (
    <>
      <PublicHeader />
      <main className="theme-page">
        <section className="border-b theme-border py-14">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#e31837]">
              Test drive appointment
            </p>
            <h1 className="font-display text-5xl font-extrabold">Đặt lịch xem xe</h1>
            <p className="mt-4 max-w-2xl leading-7 theme-subtle">
              Điền thông tin, chọn xe quan tâm và thời gian mong muốn. Lịch hẹn mock sẽ ở trạng thái chờ xác nhận.
            </p>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-8 lg:grid-cols-[1fr_360px]">
          <form className="rounded-md border theme-surface p-6">
            <div className="grid gap-5 md:grid-cols-2">
              <FormField label="Họ tên" placeholder="Nguyễn Văn A" />
              <FormField label="Số điện thoại" placeholder="0909 888 668" />
              <FormField label="Email" type="email" placeholder="email@example.com" />
              <FormField label="Xe quan tâm" as="select" options={cars.map((car) => car.name)} />
              <FormField label="Ngày hẹn" type="date" />
              <FormField label="Giờ hẹn" type="time" />
              <div className="md:col-span-2">
                <FormField label="Ghi chú" as="textarea" placeholder="Nhu cầu tư vấn, trả góp, lái thử..." />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button type="submit"><CalendarDays size={18} /> Gửi lịch hẹn</Button>
            </div>
          </form>

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
