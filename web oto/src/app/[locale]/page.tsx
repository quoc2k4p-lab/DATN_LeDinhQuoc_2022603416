export const dynamic = "force-dynamic";

import Image from "next/image";
import { ArrowRight, CalendarDays, CheckCircle2, ShieldCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/Button";
import { CarCard } from "@/components/public/CarCard";
import { Footer } from "@/components/public/Footer";
import { HomeSearchBar } from "@/components/public/HomeSearchBar";
import { PublicHeader } from "@/components/public/PublicHeader";
import { getUiCars } from "@/lib/dbAdapter";
import { HomepageNews } from "@/components/public/HomepageNews";

interface HomeProps {
  params: Promise<{ locale: string }>;
}

export default async function Home({ params }: HomeProps) {
  const { locale } = await params;
  const t = await getTranslations("Homepage");
  
  // Fetch cars localized
  const cars = await getUiCars(locale);

  return (
    <>
      <PublicHeader />
      <main className="theme-page">
        {/* Hero Section */}
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
              {t("heroEyebrow")}
            </p>
            <h1 className="max-w-3xl font-display text-5xl font-extrabold leading-[1.04] tracking-normal sm:text-6xl">
              {t("heroTitle")}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/70">
              {t("heroSubtitle")}
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button href="/cars">{t("exploreInventory")} <ArrowRight size={18} /></Button>
              <Button href="/cars/camry-2022" variant="secondary" className="border-white text-white hover:bg-white hover:text-[#1a1a1a]">
                {t("exploreFeatured")}
              </Button>
            </div>
          </div>
        </section>

        {/* Search Bar Section */}
        <section className="-mt-16 pb-14">
          <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8">
            <HomeSearchBar />
          </div>
        </section>

        {/* Features Section */}
        <section className="py-10">
          <div className="mx-auto grid max-w-7xl gap-4 px-5 sm:px-8 md:grid-cols-3">
            {[
              [t("featuresTitle1"), t("featuresSub1")],
              [t("featuresTitle2"), t("featuresSub2")],
              [t("featuresTitle3"), t("featuresSub3")],
            ].map(([title, copy]) => (
              <div key={title} className="rounded-md border theme-surface p-6">
                <CheckCircle2 className="mb-5 text-[#e31837]" size={24} />
                <h3 className="font-display text-xl font-bold text-[var(--foreground)]">{title}</h3>
                <p className="mt-3 text-sm leading-6 theme-subtle">{copy}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 1. NEWS SECTION (Moved before Featured cars) */}
        <HomepageNews locale={locale} />

        {/* 2. FEATURED CARS SECTION */}
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="mb-10 text-center md:text-left">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#e31837]">
                {t("inventoryEyebrow")}
              </p>
              <h2 className="font-display text-4xl font-extrabold text-[var(--foreground)]">
                {t("inventoryTitle")}
              </h2>
              <p className="mt-3 text-sm leading-6 theme-subtle max-w-2xl">
                {t("inventorySub")}
              </p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {cars.slice(0, 6).map((car) => (
                <CarCard key={car.id} car={car} />
              ))}
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
