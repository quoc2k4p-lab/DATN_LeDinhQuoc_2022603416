export const dynamic = "force-dynamic";

import { getTranslations } from "next-intl/server";
import { ArrowLeft, ArrowRightLeft, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PublicHeader } from "@/components/public/PublicHeader";
import { Footer } from "@/components/public/Footer";
import { CompareContainer } from "@/components/compare/CompareContainer";
import { getCarsForComparison, logCompareEventAction } from "@/lib/compare/compare-engine";
import { getUiCars } from "@/lib/dbAdapter";

interface ComparePageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ id?: string | string[] }>;
}

export default async function ComparePage({ params, searchParams }: ComparePageProps) {
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;
  const t = await getTranslations("Compare");

  // Extract car IDs from search params (supports multiple ?id=...)
  let carIds: string[] = [];
  if (resolvedSearchParams.id) {
    if (Array.isArray(resolvedSearchParams.id)) {
      carIds = resolvedSearchParams.id;
    } else {
      carIds = [resolvedSearchParams.id];
    }
  }

  // Filter empty/null strings
  carIds = carIds.filter((id) => id.trim() !== "");

  // Load public cars registry for appointment dialog popups
  const allCars = await getUiCars(locale);

  // If less than 1 car, show empty state
  if (carIds.length < 1) {
    return (
      <>
        <PublicHeader />
        <main className="theme-page min-h-[70vh] flex flex-col items-center justify-center px-5 py-20 text-center">
          <div className="max-w-md rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-8 shadow-2xl flex flex-col items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#e31837]/10 text-[#e31837] mb-6">
              <ArrowRightLeft size={28} />
            </div>
            <h1 className="font-display text-2xl font-bold text-[var(--foreground)] mb-3">
              {t("title")}
            </h1>
            <p className="text-sm text-[var(--subtle)] mb-6">
              {t("noCars")}
            </p>
            <Button href={`/${locale}/cars`} className="flex items-center gap-2 font-bold uppercase tracking-wider text-xs">
              <ArrowLeft size={16} /> Quay lại kho xe
            </Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Fetch cars and resolve specs
  const comparedCars = await getCarsForComparison(carIds.slice(0, 3), locale);

  // If DB query fails or yields no results
  if (comparedCars.length < 1) {
    return (
      <>
        <PublicHeader />
        <main className="theme-page min-h-[70vh] flex flex-col items-center justify-center px-5 py-20 text-center">
          <div className="max-w-md rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-8 shadow-2xl flex flex-col items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 mb-6">
              <ShieldAlert size={28} />
            </div>
            <h1 className="font-display text-2xl font-bold text-[var(--foreground)] mb-3">
              Lỗi dữ liệu xe
            </h1>
            <p className="text-sm text-[var(--subtle)] mb-6">
              Không thể tìm thấy thông tin hợp lệ của các xe cần so sánh. Vui lòng chọn lại.
            </p>
            <Button href={`/${locale}/cars`} className="flex items-center gap-2 font-bold uppercase tracking-wider text-xs">
              <ArrowLeft size={16} /> Quay lại kho xe
            </Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Log comparison analytics async (non-blocking)
  logCompareEventAction(comparedCars.map((c) => c.id)).catch(console.error);

  return (
    <>
      <PublicHeader />
      <main className="theme-page bg-[var(--background)] text-[var(--foreground)] min-h-screen relative overflow-hidden">
        {/* Glow Effects (Only active in dark mode) */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#e31837]/5 rounded-full blur-[140px] pointer-events-none opacity-0 dark:opacity-100 transition-opacity" />
        <div className="absolute top-[400px] right-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none opacity-0 dark:opacity-100 transition-opacity" />

        {/* Intro Hero Section */}
        <section className="relative border-b border-[var(--line)] bg-gradient-to-b from-[var(--surface-strong)] to-[var(--background)] py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#e31837]">
                  {t("title")}
                </span>
                <h1 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl text-[var(--foreground)]">
                  So sánh xe chi tiết
                </h1>
                <p className="mt-3 text-sm text-[var(--subtle)] max-w-2xl leading-relaxed">
                  {t("subtitle")}
                </p>
              </div>
              <Button
                href={`/${locale}/cars`}
                variant="secondary"
                className="flex items-center gap-2 font-bold uppercase tracking-wider text-xs border-[var(--line)] text-[var(--subtle)] hover:bg-[var(--surface-strong)] hover:text-[var(--foreground)] shrink-0 self-start md:self-center"
              >
                <ArrowLeft size={16} /> Tiếp tục chọn xe
              </Button>
            </div>
          </div>
        </section>



        <CompareContainer comparedCars={comparedCars} allCars={allCars} />
      </main>
      <Footer />
    </>
  );
}
