"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

export function HomeSearchBar() {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const locale = useLocale();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = query.trim();
    router.push(`/${locale}/cars${normalized ? `?search=${encodeURIComponent(normalized)}` : ""}`);
  };

  return (
    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 rounded-md border theme-surface p-4 shadow-2xl shadow-black/20">
      <div className="relative flex-1">
        <span className="absolute inset-y-0 left-4 flex items-center theme-subtle">
          <Search size={20} />
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nhập tên xe, hãng xe hoặc dòng xe bạn muốn tìm kiếm..."
          className="h-12 w-full rounded-md border theme-border bg-[var(--background)] pl-12 pr-4 text-base sm:text-sm text-[var(--foreground)] outline-none transition focus:border-[#e31837]"
        />
      </div>
      <button
        type="submit"
        className="flex items-center justify-center gap-2 rounded-md bg-[#e31837] h-12 px-6 text-sm font-bold uppercase tracking-[0.05em] text-white hover:bg-[#c1122b] transition duration-200 w-full sm:w-auto shrink-0 cursor-pointer"
      >
        Tìm kiếm
      </button>
    </form>
  );
}
