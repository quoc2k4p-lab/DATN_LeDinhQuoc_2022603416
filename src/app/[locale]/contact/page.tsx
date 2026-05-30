import { Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Footer } from "@/components/public/Footer";
import { FormField } from "@/components/public/FormField";
import { PublicHeader } from "@/components/public/PublicHeader";

import { ContactForm } from "@/components/public/ContactForm";

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
              Gửi yêu cầu tư vấn nhanh chóng tới đội ngũ của chúng tôi. Thông tin liên hệ sẽ được cập nhật tự động vào hệ thống CRM của Showroom.
            </p>
            <div className="mt-8 space-y-4 text-sm theme-subtle">
              <p className="flex items-center gap-3"><MapPin size={18} /> 72 Nguyễn Văn Trỗi, Phú Nhuận, TP.HCM</p>
              <p className="flex items-center gap-3"><Phone size={18} /> 0909 888 668</p>
              <p className="flex items-center gap-3"><Mail size={18} /> showroom@tqauto.vn</p>
            </div>
          </div>

          <ContactForm />
        </section>
      </main>
      <Footer />
    </>
  );
}
