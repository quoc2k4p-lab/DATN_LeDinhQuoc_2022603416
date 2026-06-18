"use client";

import { useEffect, useState } from "react";
import { X, ArrowRightLeft } from "lucide-react";
import { useParams, useRouter, usePathname } from "next/navigation";

export interface CompareCarItem {
  id: string;
  name: string;
  thumbnail: string;
  brand: string;
}

const STORAGE_KEY = "tqauto_compare_list";

export function getCompareList(): CompareCarItem[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function addToCompare(car: CompareCarItem): boolean {
  if (typeof window === "undefined") return false;
  const list = getCompareList();
  if (list.length >= 3) {
    window.dispatchEvent(new Event("compare-limit-reached"));
    return false;
  }
  if (list.some((item) => item.id === car.id)) return false;
  
  list.push(car);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("compare-store-updated"));
  return true;
}

export function removeFromCompare(id: string): void {
  if (typeof window === "undefined") return;
  const list = getCompareList();
  const filtered = list.filter((item) => item.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  window.dispatchEvent(new Event("compare-store-updated"));
}

export function clearCompareList(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("compare-store-updated"));
}

export function isInCompare(id: string): boolean {
  return getCompareList().some((item) => item.id === id);
}

export function CompareBar() {
  const [items, setItems] = useState<CompareCarItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState(false);
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const locale = params?.locale || "vi";

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    setItems(getCompareList());

    const handleUpdate = () => {
      setItems(getCompareList());
    };

    let errorTimer: NodeJS.Timeout;
    const handleLimitReached = () => {
      setError(true);
      clearTimeout(errorTimer);
      errorTimer = setTimeout(() => {
        setError(false);
      }, 3000);
    };

    window.addEventListener("compare-store-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate); // sync across tabs
    window.addEventListener("compare-limit-reached", handleLimitReached);

    return () => {
      window.removeEventListener("compare-store-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("compare-limit-reached", handleLimitReached);
      clearTimeout(errorTimer);
    };
  }, []);
  const isComparePage = pathname?.includes("/compare");
  if (!mounted || items.length === 0 || isComparePage) return null;

  const handleCompareClick = () => {
    const query = items.map((item) => `id=${item.id}`).join("&");
    router.push(`/${locale}/compare?${query}`);
  };

  const handleItemRemove = (id: string) => {
    removeFromCompare(id);
    
    // Nếu đang ở trang so sánh chi tiết, đồng bộ hóa URL bằng Next.js router.push
    if (typeof window !== "undefined" && window.location.pathname.includes("/compare")) {
      const url = new URL(window.location.href);
      const params = url.searchParams.getAll("id");
      const filtered = params.filter((carId) => carId !== id);
      url.searchParams.delete("id");
      filtered.forEach((carId) => url.searchParams.append("id", carId));
      router.push(url.pathname + url.search);
      router.refresh();
    }
  };

  const handleClearAll = () => {
    clearCompareList();
    
    // Nếu đang ở trang so sánh chi tiết, xóa hết và đưa về kho xe
    if (typeof window !== "undefined" && window.location.pathname.includes("/compare")) {
      router.push(`/${locale}/cars`);
      router.refresh();
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 z-50 w-[92%] max-w-4xl -translate-x-1/2 transform transition-all duration-300">
      <div className={`flex flex-col gap-4 rounded-xl border p-4 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.3)] backdrop-blur-md md:flex-row md:items-center md:justify-between md:py-3.5 transition-all duration-300 ${
        error
          ? "border-red-500 bg-red-500/10 shadow-[0_0_30px_rgba(239,68,68,0.25)]"
          : "border-[var(--accent)]/30 bg-[var(--surface)]/95 text-[var(--foreground)]"
      }`}>
        <div className="flex items-center gap-3">
          <div className={`relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
            error ? "bg-red-500/20 text-red-500" : "bg-[var(--accent)]/10 text-[var(--accent)]"
          }`}>
            <ArrowRightLeft size={18} />
            <span className={`absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-extrabold text-white transition-colors ${
              error ? "bg-red-500" : "bg-[var(--accent)]"
            }`}>
              {items.length}
            </span>
          </div>
          <div>
            <h4 className={`text-sm font-bold transition-colors ${error ? "text-red-500" : "text-[var(--foreground)]"}`}>
              {error ? "Đã đạt giới hạn!" : "So sánh xe"}
            </h4>
            <p className={`text-xs hidden sm:block transition-colors ${
              error ? "text-red-400 font-semibold animate-pulse" : "text-[var(--subtle)]"
            }`}>
              {error ? "Bạn chỉ được chọn tối đa 3 xe để so sánh." : "Chọn tối đa 3 xe để so sánh thông số chi tiết"}
            </p>
          </div>
        </div>

        {/* Selected Cars Row */}
        <div className="flex flex-wrap gap-2.5 md:flex-1 md:justify-center md:px-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="group flex items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--background)]/40 pl-2 pr-1.5 py-1 text-xs transition hover:border-[var(--accent)]/30 hover:bg-[var(--surface-strong)]/80"
            >
              <img
                src={item.thumbnail}
                alt={item.name}
                className="h-6 w-9 rounded object-cover"
              />
              <span className="max-w-[100px] truncate font-semibold text-[var(--foreground)] opacity-90 sm:max-w-[140px]">
                {item.name}
              </span>
              <button
                type="button"
                onClick={() => handleItemRemove(item.id)}
                className="rounded p-0.5 text-[var(--subtle)] hover:bg-[var(--foreground)]/5 hover:text-[#e31837] transition"
                aria-label={`Xóa ${item.name}`}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={handleCompareClick}
            disabled={items.length < 2}
            className="flex items-center gap-2 rounded-lg bg-[#e31837] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#c2142d] disabled:pointer-events-none disabled:opacity-40 cursor-pointer shadow-md shadow-[#e31837]/10"
          >
            So sánh ngay
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="rounded-lg border border-[var(--line)] bg-transparent px-3 py-2 text-xs font-bold uppercase tracking-wider text-[var(--subtle)] transition hover:bg-[var(--foreground)]/5 hover:text-[var(--foreground)] cursor-pointer"
          >
            Xóa hết
          </button>
        </div>
      </div>
    </div>
  );
}
