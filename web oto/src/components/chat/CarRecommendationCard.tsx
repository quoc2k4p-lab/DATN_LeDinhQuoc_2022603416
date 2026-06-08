"use client";

import { DollarSign, Calendar } from "lucide-react";

export interface CarRecommendation {
  id: string;
  name: string;
  brand: string;
  price: number;
  thumbnail: string;
  score: number;
  matchPercent: string;
  reasons: string[];
}

interface CarRecommendationCardProps {
  car: CarRecommendation;
  locale: string;
}

export function CarRecommendationCard({ car, locale }: CarRecommendationCardProps) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN").format(val) + " đ";
  };

  return (
    <div className="rounded-xl border border-white/5 bg-[#0d1016] p-3 space-y-3 hover:border-white/10 transition-all duration-200">
      <div className="flex gap-3">
        {/* Thumbnail */}
        <div className="h-16 w-24 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
          <img src={car.thumbnail} alt={car.name} className="h-full w-full object-cover" />
        </div>

        {/* Text Details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider truncate">
              {car.brand}
            </span>
            <span className="flex-shrink-0 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
              {car.matchPercent} khớp
            </span>
          </div>
          <h5 className="font-display text-xs font-bold text-white truncate mt-0.5">{car.name}</h5>
          <p className="font-display text-xs font-extrabold text-[#e31837] mt-1">
            {formatCurrency(car.price)}
          </p>
        </div>
      </div>

      {car.reasons && car.reasons.length > 0 && (
        <div className="border-t border-white/5 pt-2 text-[10px] text-zinc-400 space-y-1">
          {car.reasons.slice(0, 2).map((r, idx) => (
            <p key={idx} className="truncate">
              {r}
            </p>
          ))}
        </div>
      )}

      {/* Buttons */}
      <div className="grid grid-cols-2 gap-1.5 border-t border-white/5 pt-2">
        <a
          href={`/${locale}/loan-calculator?carId=${car.id}`}
          className="inline-flex items-center justify-center gap-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[9px] font-bold text-white py-1.5 transition"
        >
          <DollarSign size={10} /> Trả góp
        </a>
        <a
          href={`/${locale}/appointments?carId=${car.id}`}
          className="inline-flex items-center justify-center gap-1 rounded bg-[#e31837] hover:bg-[#c1132a] text-[9px] font-bold text-white py-1.5 transition"
        >
          <Calendar size={10} /> Đặt lịch
        </a>
      </div>
    </div>
  );
}
