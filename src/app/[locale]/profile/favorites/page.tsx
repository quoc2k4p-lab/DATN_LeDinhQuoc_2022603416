"use client";

import { useEffect, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Heart, Trash2, Eye, Loader2, CarFront } from "lucide-react";
import { getUserFavoritesAction, toggleFavoriteAction } from "@/lib/actions/auth";
import { Link } from "@/i18n/routing";

const MOCK_SLUGS: Record<string, string> = {
  "c0000000-0000-0000-0000-000000001024": "camry-2022",
  "c0000000-0000-0000-0000-000000001188": "mercedes-gls-450",
  "c0000000-0000-0000-0000-000000001302": "bmw-x5-m-sport",
  "c0000000-0000-0000-0000-000000001410": "mazda-cx5-premium",
  "c0000000-0000-0000-0000-000000001565": "honda-civic-rs",
  "c0000000-0000-0000-0000-000000001677": "audi-a6",
};

function generateSlug(dbCar: { id: string; brand: string; model: string; year: number }): string {
  if (MOCK_SLUGS[dbCar.id]) {
    return MOCK_SLUGS[dbCar.id];
  }
  const base = `${dbCar.brand}-${dbCar.model}-${dbCar.year}`.toLowerCase();
  return base
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function formatPrice(price: number): string {
  return price.toLocaleString("vi-VN") + "đ";
}

interface FavoriteCarItem {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  thumbnail: string;
  title: string;
  title_vi?: string;
  title_en?: string;
  car_condition: "new" | "used";
  status: "available" | "reserved" | "sold" | "hidden";
}

export default function FavoritesPage() {
  const t = useTranslations("Profile");
  const locale = useLocale();
  const [favorites, setFavorites] = useState<FavoriteCarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const loadFavorites = async () => {
    const res = await getUserFavoritesAction();
    if (res.success && res.favorites) {
      setFavorites(res.favorites);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const handleRemoveFavorite = (carId: string) => {
    startTransition(async () => {
      const res = await toggleFavoriteAction(carId);
      if (res.success) {
        // Optimistic UI update
        setFavorites((prev) => prev.filter((item) => item.id !== carId));
      }
    });
  };

  const getCarTitle = (car: FavoriteCarItem) => {
    return locale === "en" ? (car.title_en || car.title) : (car.title_vi || car.title);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#e31837]" />
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="rounded-lg border theme-border bg-[#11161d] p-12 text-center shadow-md">
        <Heart className="mx-auto h-12 w-12 text-[#a1a1aa] theme-subtle mb-4" />
        <h3 className="font-display text-lg font-bold text-[var(--foreground)]">{t("noFavorites")}</h3>
        <p className="mt-2 text-sm text-[#a1a1aa] theme-subtle max-w-sm mx-auto">
          {locale === "vi"
            ? "Lưu các mẫu xe bạn quan tâm bằng cách bấm vào biểu tượng Trái tim để dễ dàng so sánh và đặt lịch hẹn xem xe."
            : "Save vehicles you are interested in by clicking the Heart icon to easily compare and schedule test drives."}
        </p>
        <div className="mt-6">
          <Link
            href="/cars"
            className="inline-flex h-10 items-center justify-center rounded-md bg-[#e31837] px-5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#c2142d] transition"
          >
            {locale === "vi" ? "Khám phá kho xe" : "Browse Cars"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b theme-border pb-4 mb-4">
        <Heart className="text-[#e31837]" size={20} />
        <h2 className="font-display text-lg font-bold uppercase tracking-wider">{t("favorites")}</h2>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {favorites.map((car) => {
          const slug = generateSlug(car as any);
          const localizedTitle = getCarTitle(car);
          return (
            <div
              key={car.id}
              className="group relative flex flex-col overflow-hidden rounded-lg border theme-border bg-[#11161d] shadow-md transition duration-300 hover:border-[#e31837]/35"
            >
              {/* Car Image Thumbnail */}
              <div className="relative aspect-video w-full overflow-hidden bg-[#1a1f28] border-b theme-border">
                {car.thumbnail ? (
                  <img
                    src={car.thumbnail}
                    alt={localizedTitle}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[#e31837]">
                    <CarFront size={48} />
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center rounded bg-black/60 px-2.5 py-1 text-xs font-bold uppercase text-white backdrop-blur-sm border border-white/10">
                    {car.car_condition === "new" 
                      ? (locale === "vi" ? "Xe mới" : "New") 
                      : (locale === "vi" ? "Xe cũ" : "Used")}
                  </span>
                </div>
              </div>

              {/* Car Content */}
              <div className="flex flex-1 flex-col justify-between p-5">
                <div>
                  <h3 className="font-display text-lg font-bold tracking-tight text-[var(--foreground)] group-hover:text-[#e31837] transition">
                    {localizedTitle}
                  </h3>
                  <p className="mt-2 text-xl font-extrabold text-[#e31837]">
                    {formatPrice(car.price)}
                  </p>
                </div>

                {/* Actions */}
                <div className="mt-5 flex gap-3 border-t theme-border pt-4">
                  <Link
                    href={`/cars/${slug}`}
                    className="flex-1 inline-flex h-9 items-center justify-center gap-1.5 rounded bg-[#1a1f28] border theme-border text-xs font-bold uppercase tracking-wider hover:bg-[var(--foreground)] hover:text-[var(--background)] transition"
                  >
                    <Eye size={14} />
                    {t("quickView")}
                  </Link>
                  <button
                    onClick={() => handleRemoveFavorite(car.id)}
                    disabled={isPending}
                    className="inline-flex h-9 w-9 items-center justify-center rounded border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 hover:text-red-500 transition"
                    title={t("remove")}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
