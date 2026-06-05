import Image from "next/image";
import { ArrowRight, CalendarDays, CheckCircle2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CarCard } from "@/components/public/CarCard";
import { Footer } from "@/components/public/Footer";
import { HomeSearchBar } from "@/components/public/HomeSearchBar";
import { PublicHeader } from "@/components/public/PublicHeader";
import { SectionHeading } from "@/components/public/SectionHeading";
import { cars } from "@/data/mock";

export default function Home() {
  return (
    <>
      <PublicHeader />
      <main className="theme-page">
        <section className="relative overflow-hidden bg-[#080c11] text-white">
          <Image
            src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=2200&q=90"
            alt="TQ Auto showroom hero"
            fill
            priority
            sizes="100vw"
            className="absolute inset-0 h-full w-full object-cover opacity-34"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(227,24,55,0.18),transparent_28%),linear-gradient(120deg,#070b10_0%,rgba(7,11,16,0.96)_45%,rgba(7,11,16,0.62)_100%)]" />
          <div className="relative mx-auto flex min-h-[620px] max-w-7xl flex-col justify-center px-5 py-20 sm:px-8">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.22em] text-white/70">
              TQ Auto Online Showroom
            </p>
            <h1 className="max-w-3xl font-display text-5xl font-extrabold leading-[1.04] tracking-normal sm:text-6xl">
              Tìm chiếc xe phù hợp cùng TQ Auto
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/70">
              Kho xe cao cấp đã kiểm định, trình bày rõ thông số, hình ảnh và lịch hẹn
              để khách hàng ra quyết định nhanh hơn.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button href="/cars">Khám phá kho xe <ArrowRight size={18} /></Button>
              <Button href="/cars/camry-2022" variant="secondary" className="border-white text-white hover:bg-white hover:text-[#1a1a1a]">
                Xem xe nổi bật
              </Button>
            </div>
          </div>
        </section>

        <section className="-mt-16 pb-14">
          <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8">
            <HomeSearchBar />
          </div>
        </section>

        <section className="py-10">
          <div className="mx-auto grid max-w-7xl gap-4 px-5 sm:px-8 md:grid-cols-3">
            {[
              ["Kiểm định 176 điểm", "Hồ sơ xe, odo, pháp lý và tình trạng vận hành được rà soát trước khi lên sàn."],
              ["Đặt lịch nhanh", "Chọn xe, khung giờ xem xe và nhận xác nhận từ đội tư vấn."],
              ["Tư vấn minh bạch", "Báo giá, phí lăn bánh và phương án tài chính được trình bày rõ."],
            ].map(([title, copy]) => (
              <div key={title} className="rounded-md border theme-surface p-6">
                <CheckCircle2 className="mb-5 text-[#e31837]" size={24} />
                <h3 className="font-display text-xl font-bold text-[var(--foreground)]">{title}</h3>
                <p className="mt-3 text-sm leading-6 theme-subtle">{copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <SectionHeading
              eyebrow="Featured inventory"
              title="Những mẫu xe đang được quan tâm"
              copy="Bố cục card xe bám theo thiết kế Stitch: ảnh lớn, trạng thái rõ, giá nổi bật và cụm thông số dạng spec-sheet."
            />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {cars.slice(0, 6).map((car) => (
                <CarCard key={car.id} car={car} />
              ))}
            </div>
          </div>
        </section>

        <section className="border-y theme-surface py-20">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#e31837]">
                Appointment flow
              </p>
              <h2 className="font-display text-4xl font-extrabold text-[var(--foreground)]">Trải nghiệm showroom được số hóa trước.</h2>
              <p className="mt-5 leading-7 theme-subtle">
                Khách chọn xe, gửi nhu cầu, sau đó admin quản lý lịch hẹn và trạng thái tư vấn trong một luồng thống nhất.
              </p>
              <Button href="/admin" className="mt-8">Mở giao diện admin</Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                [CalendarDays, "28", "lịch hẹn tuần này"],
                [ShieldCheck, "176", "điểm kiểm định"],
              ].map(([Icon, value, label]) => (
                <div key={String(label)} className="rounded-md border theme-surface-strong p-7">
                  <Icon className="mb-8 text-[#e31837]" size={28} />
                  <p className="font-display text-5xl font-extrabold text-[var(--foreground)]">{String(value)}</p>
                  <p className="mt-2 text-sm font-semibold uppercase tracking-[0.12em] theme-subtle">{String(label)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
