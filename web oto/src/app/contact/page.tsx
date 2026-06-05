import { Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Footer } from "@/components/public/Footer";
import { FormField } from "@/components/public/FormField";
import { PublicHeader } from "@/components/public/PublicHeader";

export default function ContactPage() {
  return (
    <>
      <PublicHeader />
      <main className="theme-page">
        <section className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:px-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#e31837]">Contact request</p>
            <h1 className="font-display text-5xl font-extrabold">Liên hệ tư vấn</h1>
            <p className="mt-4 max-w-xl leading-7 theme-subtle">
              Gửi yêu cầu tư vấn không gắn trực tiếp với lịch hẹn. Thông tin này tương ứng bảng contact_requests trong báo cáo.
            </p>
            <div className="mt-8 space-y-4 text-sm theme-subtle">
              <p className="flex items-center gap-3"><MapPin size={18} /> 72 Nguyễn Văn Trỗi, Phú Nhuận, TP.HCM</p>
              <p className="flex items-center gap-3"><Phone size={18} /> 0909 888 668</p>
              <p className="flex items-center gap-3"><Mail size={18} /> showroom@tqauto.vn</p>
            </div>
          </div>

          <form className="rounded-md border theme-surface p-6">
            <div className="grid gap-5 md:grid-cols-2">
              <FormField label="Họ tên" placeholder="Nguyễn Văn A" />
              <FormField label="Số điện thoại" placeholder="0909 888 668" />
              <FormField label="Email" type="email" placeholder="email@example.com" />
              <FormField label="Nhu cầu" as="select" options={["Tư vấn mua xe", "Tư vấn trả góp", "Báo giá lăn bánh", "Chăm sóc sau bán"]} />
              <div className="md:col-span-2">
                <FormField label="Nội dung" as="textarea" placeholder="Nhập nội dung cần showroom hỗ trợ..." />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button type="submit">Gửi yêu cầu</Button>
            </div>
          </form>
        </section>
      </main>
      <Footer />
    </>
  );
}
