"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/Button";

const fields = [
  {
    label: "Thương hiệu",
    options: ["Tất cả", "Toyota", "Mercedes", "BMW", "Lexus", "Porsche", "Audi"],
  },
  {
    label: "Mức giá",
    options: ["Tất cả", "Dưới 1.5 tỷ", "1.5 - 2 tỷ", "Trên 2 tỷ"],
  },
  {
    label: "Năm sản xuất",
    options: ["Tất cả", "2022", "2021", "2020", "2019"],
  },
];

export function HomeSearchBar() {
  return (
    <div className="grid gap-3 rounded-md border theme-surface p-4 shadow-2xl shadow-black/20 md:grid-cols-[1fr_1fr_1fr_auto]">
      {fields.map((field) => (
        <label key={field.label} className="block">
          <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] theme-subtle">
            {field.label}
          </span>
          <select className="h-11 w-full appearance-none rounded-md border theme-border bg-[var(--background)] px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[#e31837]">
            {field.options.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
      ))}
      <Button href="/cars" className="self-end">
        <Search size={18} />
        Tìm kiếm
      </Button>
    </div>
  );
}
