import Image from "next/image";
import { CarsExplorer } from "@/components/public/CarsExplorer";
import { Footer } from "@/components/public/Footer";
import { PublicHeader } from "@/components/public/PublicHeader";
import { cars } from "@/data/mock";

export default function CarsPage() {
  return (
    <>
      <PublicHeader />
      <main className="theme-page">
        <section className="border-b theme-border py-10">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="relative overflow-hidden rounded-md border theme-surface px-6 py-16 text-center">
              <Image
                src="https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=1800&q=80"
                alt=""
                fill
                sizes="100vw"
                className="absolute inset-0 h-full w-full object-cover opacity-20"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--surface)] via-[var(--surface)]/90 to-[var(--surface)]" />
              <div className="relative">
                <h1 className="font-display text-5xl font-extrabold tracking-normal">Xe đang bán</h1>
                <p className="mx-auto mt-4 max-w-2xl leading-7 theme-subtle">
                  Khám phá bộ sưu tập xe hơi cao cấp được tuyển chọn kỹ lưỡng.
                </p>
              </div>
            </div>
          </div>
        </section>

        <CarsExplorer cars={cars} />
      </main>
      <Footer />
    </>
  );
}
