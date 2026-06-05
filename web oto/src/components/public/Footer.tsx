import { CarFront, Mail, MapPin, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t theme-surface text-[var(--foreground)]">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded bg-[#e31837] text-white">
              <CarFront size={22} />
            </span>
            <span className="font-display text-xl font-extrabold uppercase">TQ Auto</span>
          </div>
          <p className="max-w-md text-sm leading-6 theme-subtle">
            Showroom xe đã qua kiểm định, tập trung vào trải nghiệm xem xe rõ ràng,
            minh bạch thông tin và quy trình tư vấn nhanh.
          </p>
        </div>
        <div className="space-y-4 text-sm theme-subtle">
          <p className="flex gap-3"><MapPin size={18} /> 72 Nguyễn Văn Trỗi, Phú Nhuận, TP.HCM</p>
          <p className="flex gap-3"><Phone size={18} /> 0909 888 668</p>
          <p className="flex gap-3"><Mail size={18} /> showroom@tqauto.vn</p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm font-semibold uppercase tracking-[0.05em] theme-subtle">
          <span>Kho xe</span>
          <span>Tư vấn</span>
          <span>Đặt lịch</span>
          <span>Admin</span>
        </div>
      </div>
    </footer>
  );
}
