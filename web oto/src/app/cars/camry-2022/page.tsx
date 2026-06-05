import Image from "next/image";
import { CalendarDays, CheckCircle2, Expand, Fuel, Gauge, RotateCcw, Settings, ShieldCheck, ZoomIn, Zap } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CarCard } from "@/components/public/CarCard";
import { Footer } from "@/components/public/Footer";
import { PublicHeader } from "@/components/public/PublicHeader";
import { cars } from "@/data/mock";

const car = cars[0];

const specItems = [
  { icon: Gauge, label: "Odo", value: car.mileage },
  { icon: Fuel, label: "Nhiên liệu", value: car.fuel },
  { icon: Settings, label: "Hộp số", value: car.transmission },
  { icon: Zap, label: "Công suất", value: car.power },
];

export default function CarDetailPage() {
  return (
    <>
      <PublicHeader />
      <main className="theme-page">
        <section className="border-b theme-border">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">
              <div className="relative aspect-[16/10] overflow-hidden rounded-md border theme-border bg-[var(--muted)]">
                <Image
                  src={car.image}
                  alt={car.name}
                  fill
                  priority
                  sizes="(min-width: 1024px) 60vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                {car.gallery.map((image) => (
                  <div key={image} className="relative aspect-[16/10] overflow-hidden rounded-md border theme-border bg-[var(--muted)]">
                    <Image src={image} alt={car.name} fill sizes="33vw" className="object-cover" />
                  </div>
                ))}
              </div>
            </div>

            <aside className="h-fit rounded-md border theme-surface p-7">
              <Badge tone="available">Còn xe</Badge>
              <h1 className="mt-5 font-display text-4xl font-extrabold tracking-normal text-[var(--foreground)]">
                {car.name}
              </h1>
              <p className="mt-3 text-sm font-bold uppercase tracking-[0.12em] theme-subtle">
                {car.brand} / {car.year}
              </p>
              <p className="mt-7 font-display text-4xl font-extrabold text-[var(--foreground)]">{car.price}</p>
              <p className="mt-5 leading-7 theme-subtle">{car.description}</p>

              <div className="mt-7 grid grid-cols-2 gap-3 text-sm font-semibold">
                {specItems.map((item) => (
                  <div key={item.label} className="rounded-md border theme-surface-strong p-4">
                    <item.icon className="mb-3 text-[#e31837]" size={18} />
                    <p className="text-xs font-bold uppercase tracking-[0.12em] theme-subtle">{item.label}</p>
                    <p className="mt-1 text-[var(--foreground)]">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button className="flex-1"><CalendarDays size={18} /> Đặt lịch xem</Button>
                <Button variant="secondary" className="flex-1">Liên hệ tư vấn</Button>
              </div>
            </aside>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#e31837]">Specification</p>
            <h2 className="font-display text-3xl font-extrabold text-[var(--foreground)]">Thông số & hồ sơ xe</h2>
            <p className="mt-4 leading-7 theme-subtle">
              Bố cục chi tiết đồng nhất với danh sách xe: ảnh lớn, panel giá rõ ràng, thông số dạng spec-sheet và CTA nổi bật.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {Object.entries(car.specs).map(([key, value]) => (
              <div key={key} className="rounded-md border theme-surface p-5">
                <p className="text-xs font-bold uppercase tracking-[0.12em] theme-subtle">{key}</p>
                <p className="mt-2 font-semibold text-[var(--foreground)]">{value}</p>
              </div>
            ))}
            <div className="rounded-md border theme-surface p-5 sm:col-span-2">
              <ShieldCheck className="mb-4 text-[#e31837]" size={24} />
              <p className="font-display text-xl font-bold text-[var(--foreground)]">Cam kết kiểm định</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {["Giấy tờ rõ ràng", "Bảo dưỡng minh bạch", "Kiểm tra kỹ thuật"].map((item) => (
                  <p key={item} className="flex items-center gap-2 text-sm font-semibold theme-subtle">
                    <CheckCircle2 size={16} className="text-[#e31837]" />
                    {item}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-y theme-border py-16">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 sm:px-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="relative min-h-[360px] overflow-hidden rounded-md border theme-surface">
              <Image
                src="https://images.unsplash.com/photo-1541443131876-44b03de101c5?auto=format&fit=crop&w=1600&q=85"
                alt="Khu vực xem xe 360 độ"
                fill
                sizes="(min-width: 1024px) 55vw, 100vw"
                className="object-cover opacity-70"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface)] via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#e31837]">360 / 3D Preview</p>
                <h2 className="font-display text-3xl font-extrabold text-white">Xem xe mô phỏng 360 độ</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-300">
                  Placeholder cho module xoay xe, phóng to và toàn màn hình khi có dữ liệu 3D/360 thật.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              {[
                [RotateCcw, "Xoay xe", "Mô phỏng thao tác xoay quanh thân xe."],
                [ZoomIn, "Phóng to", "Kiểm tra chi tiết ngoại thất và nội thất."],
                [Expand, "Toàn màn hình", "Chuẩn bị cho trải nghiệm xem xe tập trung."],
              ].map(([Icon, title, copy]) => (
                <div key={String(title)} className="rounded-md border theme-surface p-5">
                  <Icon className="mb-5 text-[#e31837]" size={24} />
                  <h3 className="font-display text-xl font-bold">{String(title)}</h3>
                  <p className="mt-2 text-sm leading-6 theme-subtle">{String(copy)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#e31837]">Related cars</p>
              <h2 className="font-display text-3xl font-extrabold">Xe liên quan</h2>
            </div>
            <Button href="/cars" variant="secondary">Xem toàn bộ kho xe</Button>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {cars.slice(1, 4).map((relatedCar) => (
              <CarCard key={relatedCar.id} car={relatedCar} />
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
