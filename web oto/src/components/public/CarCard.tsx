import Link from "next/link";
import Image from "next/image";
import { Fuel, Gauge, Settings, Zap } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { Car } from "@/data/mock";

const statusLabel = {
  available: "Còn xe",
  reserved: "Giữ chỗ",
  sold: "Đã bán",
};

export function CarCard({ car }: { car: Car }) {
  return (
    <article className="group overflow-hidden rounded-md border theme-surface transition hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(0,0,0,0.22)]">
      <Link href={`/cars/${car.slug}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden bg-[var(--muted)]">
          <Image
            src={car.image}
            alt={car.name}
            fill
            sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute left-4 top-4">
            <Badge tone={car.status}>{statusLabel[car.status]}</Badge>
          </div>
        </div>
        <div className="space-y-5 p-5">
          <div>
            <p className="theme-subtle mb-2 text-xs font-bold uppercase tracking-[0.12em]">
              {car.brand} / {car.year}
            </p>
            <h3 className="font-display text-xl font-bold text-[var(--foreground)]">{car.name}</h3>
            <p className="mt-2 font-display text-2xl font-bold text-[var(--foreground)]">{car.price}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 border-t theme-border pt-4 text-xs font-semibold uppercase tracking-[0.04em] theme-subtle">
            <span className="flex items-center gap-2"><Gauge size={16} /> {car.mileage}</span>
            <span className="flex items-center gap-2"><Fuel size={16} /> {car.fuel}</span>
            <span className="flex items-center gap-2"><Settings size={16} /> {car.transmission}</span>
            <span className="flex items-center gap-2"><Zap size={16} /> {car.power}</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
