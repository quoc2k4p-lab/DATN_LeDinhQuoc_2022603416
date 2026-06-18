"use client";

import { ChevronDown, ChevronUp, Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { CarCard } from "@/components/public/CarCard";
import type { UiCar } from "@/lib/dbAdapter";

const filterGroups = [
  { key: "brand", label: "Hãng xe", options: ["Tất cả", "Toyota", "Mercedes", "BMW", "Lexus", "Porsche", "Audi", "Mazda", "Honda"] },
  { key: "price", label: "Khoảng giá", options: ["Tất cả", "Dưới 1.5 tỷ", "1.5 - 2 tỷ", "Trên 2 tỷ"] },
  { key: "year", label: "Năm sản xuất", options: ["Tất cả", "2023", "2022", "2021", "2020", "2019"] },
  { key: "condition", label: "Tình trạng xe", options: ["Tất cả", "Xe mới", "Xe cũ"] },
  { key: "bodyType", label: "Kiểu dáng", options: ["Tất cả", "Sedan", "SUV", "Hatchback", "Pickup", "Coupe"] },
  { key: "transmission", label: "Hộp số", options: ["Tất cả", "Tự động", "Số sàn"] },
  { key: "fuel", label: "Nhiên liệu", options: ["Tất cả", "Xăng", "Dầu", "Hybrid", "Điện"] },
  { key: "drivetrain", label: "Hệ dẫn động", options: ["Tất cả", "FWD", "RWD", "AWD", "4WD"] },
  { key: "origin", label: "Xuất xứ", options: ["Tất cả", "Nhập khẩu", "Trong nước"] },
  { key: "status", label: "Trạng thái xe", options: ["Tất cả", "Còn xe", "Đang giữ chỗ", "Đã bán"] },
] as const;

type FilterKey = (typeof filterGroups)[number]["key"];

const defaultFilters = filterGroups.reduce(
  (acc, group) => ({ ...acc, [group.key]: "Tất cả" }),
  {} as Record<FilterKey, string>,
);

function priceValue(price: string) {
  return Number(price.replace(/\D/g, ""));
}

function statusLabel(status: UiCar["status"]) {
  return status === "available" ? "Còn xe" : status === "reserved" ? "Đang giữ chỗ" : "Đã bán";
}

function FilterDropdown({
  label,
  value,
  options,
  open,
  onOpenChange,
  onSelect,
}: {
  label: string;
  value: string;
  options: readonly string[];
  open: boolean;
  onOpenChange: () => void;
  onSelect: (value: string) => void;
}) {
  const [optionQuery, setOptionQuery] = useState("");
  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(optionQuery.trim().toLowerCase()),
  );

  return (
    <div className="relative border-t theme-border py-4">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] theme-subtle">{label}</p>
      <button
        type="button"
        onClick={onOpenChange}
        className="flex h-11 w-full items-center justify-between rounded-md border theme-border bg-[var(--background)] px-3 text-left text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--muted)]"
      >
        <span>{value === "Tất cả" ? label : value}</span>
        {open ? <ChevronUp size={17} className="theme-subtle" /> : <SlidersHorizontal size={17} className="theme-subtle" />}
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%-10px)] z-30 overflow-hidden rounded-md border theme-border bg-[var(--surface)] shadow-2xl shadow-black/30">
          <div className="flex h-11 items-center gap-2 border-b theme-border px-3">
            <Search size={16} className="theme-subtle" />
            <input
              value={optionQuery}
              onChange={(event) => setOptionQuery(event.target.value)}
              placeholder={`Tìm kiếm ${label.toLowerCase()}...`}
              className="w-full bg-transparent text-base sm:text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--subtle)]"
            />
          </div>
          <div className="max-h-52 overflow-y-auto p-1">
            {filteredOptions.map((option) => {
              const active = value === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    onSelect(option);
                    setOptionQuery("");
                  }}
                  className={
                    active
                      ? "w-full rounded px-3 py-2 text-left text-sm font-semibold text-white bg-[#e31837]"
                      : "w-full rounded px-3 py-2 text-left text-sm theme-subtle transition hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                  }
                >
                  {option}
                </button>
              );
            })}
            {filteredOptions.length === 0 ? (
              <p className="px-3 py-4 text-sm theme-subtle">Không có lựa chọn phù hợp.</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function CarsExplorer({ cars }: { cars: UiCar[] }) {
  const searchParams = useSearchParams();
  const searchVal = searchParams ? searchParams.get("search") || "" : "";
  const [query, setQuery] = useState(searchVal);
  const [filters, setFilters] = useState(defaultFilters);
  const [openFilter, setOpenFilter] = useState<FilterKey | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [sortBy, setSortBy] = useState<string>("gallery-desc");

  // Sync with search param changes
  useEffect(() => {
    setQuery(searchVal);
  }, [searchVal]);

  const filteredCars = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const result = cars.filter((car) => {
      const matchesQuery =
        !normalizedQuery ||
        [car.name, car.brand, String(car.year), car.price, car.fuel, car.transmission]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      const matchesBrand = filters.brand === "Tất cả" || car.brand === filters.brand;
      const matchesYear = filters.year === "Tất cả" || String(car.year) === filters.year;
      const matchesStatus = filters.status === "Tất cả" || statusLabel(car.status) === filters.status;
      const matchesCondition =
        filters.condition === "Tất cả" ||
        (filters.condition === "Xe mới" && car.conditionType === "new") ||
        (filters.condition === "Xe cũ" && car.conditionType === "used");
      const matchesFuel = filters.fuel === "Tất cả" || car.fuel === filters.fuel;

      const price = priceValue(car.price);
      const matchesPrice =
        filters.price === "Tất cả" ||
        (filters.price === "Dưới 1.5 tỷ" && price < 1500000000) ||
        (filters.price === "1.5 - 2 tỷ" && price >= 1500000000 && price <= 2000000000) ||
        (filters.price === "Trên 2 tỷ" && price > 2000000000);

      const matchesBodyType = filters.bodyType === "Tất cả" || car.category === filters.bodyType;
      const matchesTransmission =
        filters.transmission === "Tất cả" ||
        (filters.transmission === "Tự động" && car.transmission.includes("Tự động")) ||
        (filters.transmission === "Số sàn" && car.transmission.includes("Số sàn"));
      const matchesDrivetrain = filters.drivetrain === "Tất cả" || car.drivetrain === filters.drivetrain;
      const matchesOrigin =
        filters.origin === "Tất cả" ||
        (filters.origin === "Nhập khẩu" && car.origin === "imported") ||
        (filters.origin === "Trong nước" && car.origin === "domestic");

      return (
        matchesQuery &&
        matchesBrand &&
        matchesYear &&
        matchesStatus &&
        matchesCondition &&
        matchesFuel &&
        matchesPrice &&
        matchesBodyType &&
        matchesTransmission &&
        matchesDrivetrain &&
        matchesOrigin
      );
    });

    return [...result].sort((a, b) => {
      if (sortBy === "gallery-desc") {
        if (b.sortOrder !== a.sortOrder) {
          return b.sortOrder - a.sortOrder;
        }
        if (b.gallery.length !== a.gallery.length) {
          return b.gallery.length - a.gallery.length;
        }
        return b.year - a.year; // Fallback to year desc
      }
      if (sortBy === "price-asc") {
        return priceValue(a.price) - priceValue(b.price);
      }
      if (sortBy === "price-desc") {
        return priceValue(b.price) - priceValue(a.price);
      }
      if (sortBy === "year-desc") {
        return b.year - a.year;
      }
      if (sortBy === "year-asc") {
        return a.year - b.year;
      }
      return b.year - a.year;
    });
  }, [cars, filters, query, sortBy]);

  function resetFilters() {
    setQuery("");
    setFilters(defaultFilters);
    setOpenFilter(null);
    setSortBy("gallery-desc");
  }

  return (
    <section className="theme-page">
      {/* Mobile Filter Toggle Bar */}
      <div className="lg:hidden flex items-center justify-between border-b theme-border px-5 py-4 bg-[var(--surface)]">
        <button
          type="button"
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="flex items-center gap-2 rounded border theme-border px-4 py-2.5 text-xs font-bold uppercase tracking-[0.05em] bg-[var(--background)] text-[var(--foreground)] transition hover:bg-[var(--muted)] cursor-pointer"
        >
          <SlidersHorizontal size={16} />
          {showMobileFilters ? "Đóng bộ lọc" : "Bộ lọc tìm kiếm"}
        </button>
        <span className="text-xs font-bold uppercase tracking-wider theme-subtle">
          {filteredCars.length} xe phù hợp
        </span>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[260px_1fr]">
        <aside className={`h-fit rounded-md border theme-surface p-5 lg:block ${showMobileFilters ? "block" : "hidden"}`}>
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2 font-display text-lg font-bold">
              <SlidersHorizontal size={20} />
              Bộ lọc
            </div>
            <button
              type="button"
              onClick={() => setOpenFilter((current) => (current ? null : "brand"))}
              className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--muted)] theme-subtle"
              aria-label="Thu gọn bộ lọc"
            >
              {openFilter ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          <label className="block border-t theme-border py-4">
            <span className="mb-3 block text-xs font-bold uppercase tracking-[0.12em] theme-subtle">
              Tìm kiếm
            </span>
            <span className="flex h-11 items-center gap-3 rounded-md border theme-border bg-[var(--background)] px-3">
              <Search size={17} className="theme-subtle" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm kiếm xe"
                className="w-full bg-transparent text-base sm:text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--subtle)]"
              />
              {query ? (
                <button type="button" onClick={() => setQuery("")} aria-label="Xóa tìm kiếm">
                  <X size={16} className="theme-subtle" />
                </button>
              ) : null}
            </span>
          </label>

          {filterGroups.map((group) => (
            <FilterDropdown
              key={group.key}
              label={group.label}
              value={filters[group.key]}
              options={group.options}
              open={openFilter === group.key}
              onOpenChange={() => setOpenFilter((current) => (current === group.key ? null : group.key))}
              onSelect={(value) => {
                setFilters((current) => ({ ...current, [group.key]: value }));
                setOpenFilter(null);
              }}
            />
          ))}

          <div className="mt-3 flex gap-2">
            <Button className="flex-1" onClick={() => setShowMobileFilters(false)}>Áp dụng</Button>
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-md border theme-border px-4 text-sm font-bold uppercase tracking-[0.05em] theme-subtle transition hover:text-[var(--foreground)]"
            >
              Xóa
            </button>
          </div>
        </aside>

        <div>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold theme-subtle">{filteredCars.length} xe phù hợp</p>
            <div className="relative flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider theme-subtle">Sắp xếp:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-9 rounded-md border theme-border bg-[var(--surface)] px-3 text-base sm:text-xs font-semibold text-[var(--foreground)] outline-none cursor-pointer hover:bg-[var(--muted)] transition"
              >
                <option value="gallery-desc" className="bg-[var(--surface)] text-[var(--foreground)]">Nhiều ảnh phụ nhất</option>
                <option value="newest" className="bg-[var(--surface)] text-[var(--foreground)]">Mới nhất</option>
                <option value="price-asc" className="bg-[var(--surface)] text-[var(--foreground)]">Giá: Thấp đến cao</option>
                <option value="price-desc" className="bg-[var(--surface)] text-[var(--foreground)]">Giá: Cao đến thấp</option>
                <option value="year-desc" className="bg-[var(--surface)] text-[var(--foreground)]">Đời xe: Mới nhất</option>
                <option value="year-asc" className="bg-[var(--surface)] text-[var(--foreground)]">Đời xe: Cũ nhất</option>
              </select>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredCars.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
          {filteredCars.length === 0 ? (
            <div className="mt-8 rounded-md border theme-surface p-8 text-center">
              <p className="font-display text-xl font-bold">Không tìm thấy xe phù hợp</p>
              <p className="mt-2 theme-subtle">Thử đổi từ khóa hoặc bỏ bớt bộ lọc.</p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
