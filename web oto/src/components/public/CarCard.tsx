"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Fuel, Gauge, Settings, Zap, ArrowRightLeft, Check } from "lucide-react";
import type { UiCar } from "@/lib/dbAdapter";
import { isInCompare, addToCompare, removeFromCompare } from "@/components/compare/CompareBar";

const statusLabel = {
  available: "CÒN XE",
  reserved: "ĐANG GIỮ CHỖ",
  sold: "ĐÃ BÁN",
  hidden: "TẠM ẨN",
};

export function CarCard({ car }: { car: UiCar }) {
  const [selected, setSelected] = useState(false);

  useEffect(() => {
    setSelected(isInCompare(car.id));
    const handleUpdate = () => {
      setSelected(isInCompare(car.id));
    };
    window.addEventListener("compare-store-updated", handleUpdate);
    return () => window.removeEventListener("compare-store-updated", handleUpdate);
  }, [car.id]);

  const handleCompareToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (selected) {
      removeFromCompare(car.id);
      setSelected(false);
    } else {
      const added = addToCompare({
        id: car.id,
        name: car.name,
        thumbnail: car.image,
        brand: car.brand,
      });
      if (added) {
        setSelected(true);
      }
    }
  };

  return (
    <article className="group relative overflow-hidden rounded-md border theme-surface transition hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(0,0,0,0.22)]">
      {/* Compare Button Overlay */}
      <button
        type="button"
        onClick={handleCompareToggle}
        className={`absolute right-4 top-4 z-20 flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg backdrop-blur-md transition cursor-pointer ${
          selected
            ? "bg-[#e31837] hover:bg-[#c2142d]"
            : "bg-black/50 hover:bg-black/75 border border-white/10"
        }`}
      >
        {selected ? (
          <>
            <Check size={11} strokeWidth={3} /> Đã thêm
          </>
        ) : (
          <>
            <ArrowRightLeft size={11} /> So sánh
          </>
        )}
      </button>

      <Link href={`/cars/${car.slug}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden bg-[var(--muted)]">
          <Image
            src={car.image}
            alt={car.name}
            fill
            sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute left-4 top-4 flex flex-wrap gap-1.5 items-center">
            <span className={`flex h-7 items-center rounded-full px-2.5 text-[10px] font-bold uppercase tracking-wider shadow-lg backdrop-blur-md ${
              car.condition === "new"
                ? "bg-black/50 border border-blue-500/30 text-blue-300"
                : "bg-black/50 border border-amber-500/30 text-amber-300"
            }`}>
              {car.condition === "new" ? "XE MỚI" : "XE CŨ"}
            </span>
            <span className={`flex h-7 items-center rounded-full px-2.5 text-[10px] font-bold uppercase tracking-wider shadow-lg backdrop-blur-md ${
              car.status === "available"
                ? "bg-black/50 border border-emerald-500/30 text-emerald-300"
                : car.status === "reserved"
                ? "bg-black/50 border border-amber-500/30 text-amber-300"
                : car.status === "sold"
                ? "bg-black/50 border border-red-500/30 text-red-300"
                : "bg-black/50 border border-white/10 text-zinc-300"
            }`}>
              {statusLabel[car.status]}
            </span>
          </div>
        </div>
        <div className="space-y-5 p-5">
          <div>
            <p className="theme-subtle mb-2 text-xs font-bold uppercase tracking-[0.12em]">
              {car.brand} / {car.year}
            </p>
            <h3 className="font-display text-xl font-bold text-[var(--foreground)] truncate">{car.name}</h3>
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
