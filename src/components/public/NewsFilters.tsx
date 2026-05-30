"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useState, useTransition } from "react";

const categories = ["Tất cả", "Đánh giá", "Kinh nghiệm", "Tư vấn mua xe"];

export function NewsFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentCategory = searchParams.get("category") || "Tất cả";
  const currentSearch = searchParams.get("q") || "";
  const [search, setSearch] = useState(currentSearch);

  function handleFilter(category: string, queryStr: string) {
    const params = new URLSearchParams(searchParams);
    
    if (category && category !== "Tất cả") {
      params.set("category", category);
    } else {
      params.delete("category");
    }

    if (queryStr) {
      params.set("q", queryStr);
    } else {
      params.delete("q");
    }

    // Reset page to 1 on new filter
    params.delete("page");

    startTransition(() => {
      router.push(`/news?${params.toString()}`);
    });
  }

  return (
    <div className="mb-10 space-y-6">
      {/* Search and Category Container */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 order-2 md:order-1">
          {categories.map((cat) => {
            const isActive = currentCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleFilter(cat, search)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition duration-200 border ${
                  isActive
                    ? "bg-[#e31837] text-white border-[#e31837]"
                    : "bg-[var(--surface)] text-[var(--subtle)] border-[var(--line)] hover:border-[var(--foreground)]/20 hover:text-[var(--foreground)]"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleFilter(currentCategory, search);
          }}
          className="relative w-full max-w-md order-1 md:order-2"
        >
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm bài viết..."
            className="h-10 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] pl-4 pr-10 text-sm text-[var(--foreground)] outline-none transition focus:border-[#e31837] focus:ring-1 focus:ring-[#e31837]/30 placeholder:text-[var(--subtle)]"
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 theme-subtle hover:text-[#e31837]"
          >
            <Search size={18} />
          </button>
        </form>
      </div>

      {isPending && (
        <div className="text-xs text-[#e31837] animate-pulse font-medium">
          Đang lọc bài viết...
        </div>
      )}
    </div>
  );
}
