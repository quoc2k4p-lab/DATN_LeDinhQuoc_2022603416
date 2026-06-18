export const dynamic = "force-dynamic";

import { getTranslations } from "next-intl/server";
import { CheckCircle2, Fuel, Gauge, MapPin, Settings, ShieldCheck, Zap } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CarCard } from "@/components/public/CarCard";
import { Footer } from "@/components/public/Footer";
import { PublicHeader } from "@/components/public/PublicHeader";
import { getUiCarBySlug, getUiCars } from "@/lib/dbAdapter";
import { CarDetailsActions } from "@/components/public/CarDetailsActions";
import { CarGallery } from "@/components/public/CarGallery";
import { LoanCalculator } from "@/components/loan/LoanCalculator";

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
}

export default async function CarDetailPage({ params }: PageProps) {
  const { slug, locale } = await params;
  const t = await getTranslations("CarDetails");
  const allCars = await getUiCars(locale);
  const car = await getUiCarBySlug(slug, locale);

  if (!car) {
    return (
      <>
        <PublicHeader />
        <main className="theme-page flex min-h-[50vh] items-center justify-center text-center">
          <div>
            <h1 className="font-display text-3xl font-bold text-[var(--foreground)]">{t("notFound")}</h1>
            <p className="mt-2 theme-subtle">{t("notFoundSub")}</p>
            <Button href={`/${locale}/cars`} className="mt-5">{t("backToInventory")}</Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const specItems = [
    { icon: Gauge, label: t("mileage"), value: car.mileage },
    { icon: Fuel, label: t("fuel"), value: car.fuel },
    { icon: Settings, label: t("transmission"), value: car.transmission },
    { icon: Zap, label: t("power"), value: car.power },
  ];

  const relatedCars = allCars
    .filter((c) => c.id !== car.id)
    .sort((a, b) => {
      const diffA = Math.abs(a.year - car.year);
      const diffB = Math.abs(b.year - car.year);
      if (diffA !== diffB) {
        return diffA - diffB;
      }
      return b.year - a.year; // Tie-breaker: newer first
    })
    .slice(0, 3);

  return (
    <>
      <PublicHeader />
      <main className="theme-page">
        <section className="border-b theme-border">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="min-w-0">
              <CarGallery mainImage={car.image} gallery={car.gallery} alt={car.name} />
              
              <div className="mt-8 rounded-md border theme-surface p-6">
                <h3 className="font-display text-xl font-bold text-[var(--foreground)] border-b theme-border pb-3 mb-4">
                  {t("description")}
                </h3>
                <p className="leading-7 theme-subtle whitespace-pre-line">{car.description}</p>
              </div>
            </div>

            <aside className="h-fit rounded-md border theme-surface p-7">
              <div className="flex flex-wrap gap-1.5 items-center">
                <Badge tone={car.condition === "new" ? "info" : "reserved"}>
                  {car.condition === "new" ? t("newBadge") : t("usedBadge")}
                </Badge>
                <Badge tone={car.status === "hidden" ? "neutral" : car.status as any}>
                  {car.status === "available" ? t("availableBadge") : car.status === "reserved" ? t("reservedBadge") : car.status === "hidden" ? "Tạm ẩn" : t("soldBadge")}
                </Badge>
              </div>
              <h1 className="mt-5 font-display text-4xl font-extrabold tracking-normal text-[var(--foreground)]">
                {car.name}
              </h1>
              <p className="mt-3 text-sm font-bold uppercase tracking-[0.12em] theme-subtle">
                {car.brand} / {car.year}
              </p>
              <p className="mt-7 font-display text-4xl font-extrabold text-[var(--foreground)]">{car.price}</p>

              <div className="mt-4 flex items-start gap-2.5 rounded-md border border-white/5 bg-white/2 p-3 text-sm">
                <MapPin className="mt-0.5 shrink-0 text-[#e31837]" size={18} />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] theme-subtle">{t("showroom")}</p>
                  <p className="mt-0.5 font-medium text-[var(--foreground)] leading-relaxed">{car.address}</p>
                </div>
              </div>

              {car.status === "reserved" && (
                <div className="mt-5 rounded-md border border-amber-500/20 bg-amber-500/10 p-4 text-sm font-medium text-amber-300">
                  <p>{t("reservedNotice")}</p>
                  {car.reservedUntil && (
                    <p className="mt-2 text-xs font-semibold text-amber-400">
                      {t("reservedUntil")} {new Date(car.reservedUntil).toLocaleString(locale === "vi" ? "vi-VN" : "en-US")}
                    </p>
                  )}
                </div>
              )}

              <div className="mt-7 grid grid-cols-2 gap-3 text-sm font-semibold">
                {specItems.map((item) => (
                  <div key={item.label} className="rounded-md border theme-surface-strong p-4">
                    <item.icon className="mb-3 text-[#e31837]" size={18} />
                    <p className="text-xs font-bold uppercase tracking-[0.12em] theme-subtle">{item.label}</p>
                    <p className="mt-1 text-[var(--foreground)]">{item.value}</p>
                  </div>
                ))}
              </div>

              <CarDetailsActions car={car} allCars={allCars} />
            </aside>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#e31837]">{t("specifications")}</p>
            <h2 className="font-display text-3xl font-extrabold text-[var(--foreground)]">{t("specsTitle")}</h2>
          </div>

          <div className="rounded-md border theme-surface p-6 sm:p-8">
            <h3 className="font-display text-2xl font-bold text-[var(--foreground)] border-b theme-border pb-4 mb-6">
              Thông số kỹ thuật chi tiết
            </h3>
            
            <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {/* Left Column */}
              <div className="space-y-4">
                <div className="flex justify-between border-b border-white/5 pb-3">
                  <span className="theme-subtle text-sm">Năm sản xuất</span>
                  <span className="font-semibold text-[var(--foreground)]">{car.year}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-3">
                  <span className="theme-subtle text-sm">Tình trạng</span>
                  <span className="font-semibold text-[var(--foreground)]">
                    {car.conditionType === "new" ? "Xe mới" : "Xe đã dùng"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-3">
                  <span className="theme-subtle text-sm">Số Km đã đi</span>
                  <span className="font-semibold text-[var(--foreground)]">{car.mileage}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-3">
                  <span className="theme-subtle text-sm">Xuất xứ</span>
                  <span className="font-semibold text-[var(--foreground)]">
                    {car.origin === "imported" ? "Nhập khẩu" : "Trong nước"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-3">
                  <span className="theme-subtle text-sm">Kiểu dáng</span>
                  <span className="font-semibold text-[var(--foreground)]">{car.category}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 sm:border-none pb-3 sm:pb-0">
                  <span className="theme-subtle text-sm">Hộp số</span>
                  <span className="font-semibold text-[var(--foreground)]">{car.transmission}</span>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div className="flex justify-between border-b border-white/5 pb-3">
                  <span className="theme-subtle text-sm">Động cơ</span>
                  <span className="font-semibold text-[var(--foreground)]">{car.engine}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-3">
                  <span className="theme-subtle text-sm">Màu ngoại thất</span>
                  <span className="font-semibold text-[var(--foreground)]">{car.color}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-3">
                  <span className="theme-subtle text-sm">Màu nội thất</span>
                  <span className="font-semibold text-[var(--foreground)]">{car.interiorColor}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-3">
                  <span className="theme-subtle text-sm">Số chỗ ngồi</span>
                  <span className="font-semibold text-[var(--foreground)]">{car.specs["Ghế"] || `${car.doors && car.doors > 4 ? 7 : 5} chỗ`}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-3">
                  <span className="theme-subtle text-sm">Số cửa</span>
                  <span className="font-semibold text-[var(--foreground)]">{car.doors} cửa</span>
                </div>
                <div className="flex justify-between pb-3 sm:pb-0">
                  <span className="theme-subtle text-sm">Dẫn động</span>
                  <span className="font-semibold text-[var(--foreground)]">
                    {car.drivetrain} - {
                      car.drivetrain === "FWD" ? "Cầu trước" :
                      car.drivetrain === "RWD" ? "Cầu sau" :
                      car.drivetrain === "AWD" ? "4 bánh toàn thời gian" : "2 cầu / 4 bánh bán thời gian"
                    }
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-white/5 pt-4 flex justify-between items-start gap-4">
              <span className="theme-subtle text-sm shrink-0">{locale === "vi" ? "Địa điểm xem xe" : "Showroom Address"}</span>
              <span className="font-semibold text-[var(--foreground)] text-right leading-relaxed">{car.address}</span>
            </div>
            
            <div className="rounded-md border theme-border bg-white/1 p-6 mt-8">
              <ShieldCheck className="mb-4 text-[#e31837]" size={24} />
              <p className="font-display text-xl font-bold text-[var(--foreground)]">{t("warrantyTitle")}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[t("warranty1"), t("warranty2"), t("warranty3")].map((item) => (
                  <p key={item} className="flex items-center gap-2 text-sm font-semibold theme-subtle">
                    <CheckCircle2 size={16} className="text-[#e31837]" />
                    {item}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Loan Calculator Simulator Section */}
        <section id="loan-calculator" className="border-t border-b theme-border bg-white/[0.01] py-4">
          <LoanCalculator
            initialCar={{
              id: car.id,
              name: car.name,
              brand: car.brand,
              price: parseInt(car.price.replace(/\D/g, ""), 10) || 0,
              image: car.image,
            }}
          />
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#e31837]">{t("relatedEyebrow")}</p>
              <h2 className="font-display text-3xl font-extrabold">{t("relatedTitle")}</h2>
            </div>
            <Button href={`/${locale}/cars`} variant="secondary">{t("viewAllBtn")}</Button>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {relatedCars.map((relatedCar) => (
              <CarCard key={relatedCar.id} car={relatedCar} />
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
