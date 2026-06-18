export const dynamic = "force-dynamic";

import Image from "next/image";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { CarsExplorer } from "@/components/public/CarsExplorer";
import { Footer } from "@/components/public/Footer";
import { PublicHeader } from "@/components/public/PublicHeader";
import { getUiCars } from "@/lib/dbAdapter";

interface CarsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function CarsPage({ params }: CarsPageProps) {
  const { locale } = await params;
  const t = await getTranslations("Cars");
  const cars = await getUiCars(locale);
  return (
    <>
      <PublicHeader />
      <main className="theme-page">
        <section className="border-b theme-border py-10">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="group relative overflow-hidden rounded-xl border theme-banner px-6 py-20 text-center shadow-xl transition-all duration-300 hover:border-red-600/30">
              <Image
                src="https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1800&q=80"
                alt=""
                fill
                sizes="100vw"
                className="absolute inset-0 h-full w-full object-cover theme-banner-img"
              />
              <div className="absolute inset-0 theme-banner-overlay z-10" />
              <div className="absolute inset-0 theme-banner-glow z-15" />
              <div className="relative z-20">
                <h1 className="font-display text-5xl font-extrabold tracking-tight drop-shadow-md">{t("title")}</h1>
                <p className="mx-auto mt-4 max-w-2xl leading-7 theme-banner-text-subtle drop-shadow">
                  {t("subtitle")}
                </p>
              </div>
            </div>
          </div>
        </section>

        <Suspense fallback={<div className="py-20 text-center theme-subtle">Đang tải...</div>}>
          <CarsExplorer cars={cars} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
