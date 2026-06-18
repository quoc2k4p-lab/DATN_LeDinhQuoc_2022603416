"use client";

import { useState } from "react";
import { X, Plus, Search, CalendarDays, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { CarSpecsExtended } from "@/lib/compare/compare-engine";
import { UiCar } from "@/lib/dbAdapter";
import { AppointmentForm } from "../public/AppointmentForm";

interface CompareHeaderProps {
  cars: CarSpecsExtended[];
  allCars: UiCar[];
  scrollRef: React.RefObject<HTMLDivElement | null>;
}

export function CompareHeader({ cars, allCars, scrollRef }: CompareHeaderProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCarForBooking, setSelectedCarForBooking] = useState<string | null>(null);

  // Filter cars not currently compared
  const availableCarsToSelect = allCars.filter(
    (c) => !cars.some((existing) => existing.id === c.id)
  );

  // Filter matching the search query
  const filteredAvailableCars = availableCarsToSelect.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.brand.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRemoveCar = async (carId: string) => {
    const { removeFromCompare } = await import("./CompareBar");
    removeFromCompare(carId);

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      const params = url.searchParams.getAll("id");
      const filtered = params.filter((id) => id !== carId);
      url.searchParams.delete("id");
      filtered.forEach((id) => url.searchParams.append("id", id));
      router.push(url.pathname + url.search);
      router.refresh();
    }
  };

  const handleAddCar = async (car: UiCar) => {
    const { addToCompare } = await import("./CompareBar");
    const added = addToCompare({
      id: car.id,
      name: car.name,
      thumbnail: car.image,
      brand: car.brand,
    });

    if (added && typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.append("id", car.id);
      router.push(url.pathname + url.search);
      router.refresh();
    }
    setIsModalOpen(false);
    setSearchQuery("");
  };

  const activeCarForBooking = cars.find((c) => c.id === selectedCarForBooking);

  return (
    <>
      {/* Mobile view: horizontal scroll of cards */}
      <div className="block md:hidden overflow-x-auto pb-4 scrollbar-none">
        <div className="flex gap-4 px-1 min-w-max">
          {Array.from({ length: 3 }).map((_, index) => {
            const car = cars[index];
            if (car) {
              return (
                <div
                  key={car.id}
                  className="w-[210px] bg-[var(--surface)] border border-[var(--line)] rounded-xl p-3.5 relative group shadow-lg flex flex-col justify-between"
                >
                  <div className="relative">
                    {/* Close/Remove Button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveCar(car.id)}
                      className="absolute right-0 top-0 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--subtle)] shadow-md transition hover:scale-110 hover:text-[#e31837] hover:border-[#e31837]/35 cursor-pointer"
                      aria-label={`Xóa ${car.name}`}
                    >
                      <X size={14} />
                    </button>
 
                    {/* Thumbnail */}
                    <div className="relative aspect-[16/10] w-[85%] overflow-hidden rounded-lg bg-[var(--muted)] shadow-inner">
                      <img
                        src={car.image}
                        alt={car.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-103"
                      />
                    </div>
 
                    {/* Info */}
                    <div className="mt-3">
                      <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#e31837]">
                        {car.brand} / {car.year}
                      </p>
                      <h4 className="mt-1 font-display text-xs font-bold text-[var(--foreground)] group-hover:text-[#e31837] transition duration-200 line-clamp-2 pr-6">
                        {car.name}
                      </h4>
                      <p className="mt-1 font-display text-sm font-black text-[var(--foreground)]">
                        {car.price}
                      </p>
                    </div>
                  </div>
 
                  {/* Quick Actions */}
                  <div className="mt-4 flex flex-col gap-2">
                    {car.status !== "sold" && (
                      <button
                        type="button"
                        onClick={() => setSelectedCarForBooking(car.id)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 text-[10px] font-bold uppercase tracking-wider bg-[#e31837] text-white hover:bg-[#c2142d] rounded-md transition shadow-md shadow-[#e31837]/10 cursor-pointer"
                      >
                        <CalendarDays size={12} /> Đặt lịch xem
                      </button>
                    )}
                    <a
                      href={`/contact?subject=Tư vấn xe ${encodeURIComponent(car.name)}`}
                      className="w-full flex items-center justify-center gap-1.5 py-2 text-[10px] font-bold uppercase tracking-wider border border-[var(--line)] bg-transparent text-[var(--subtle)] hover:bg-[var(--surface-strong)] hover:text-[var(--foreground)] rounded-md transition text-center"
                    >
                      <Mail size={12} /> Nhận tư vấn
                    </a>
                  </div>
                </div>
              );
            } else {
              return (
                <div
                  key={`empty-mobile-${index}`}
                  className="w-[210px] border border-dashed border-[var(--line)] bg-[var(--surface)]/50 rounded-xl p-4 flex flex-col items-center justify-center text-center min-h-[230px]"
                >
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e31837]/10 text-[#e31837] hover:bg-[#e31837] hover:text-white transition duration-300 shadow-md shadow-[#e31837]/10 cursor-pointer"
                  >
                    <Plus size={18} />
                  </button>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--subtle)] mt-3">Thêm xe so sánh</p>
                  <p className="text-[9px] text-[var(--subtle)] opacity-70 mt-1">Chọn từ kho xe showroom</p>
                </div>
              );
            }
          })}
        </div>
      </div>

      {/* Desktop/Tablet view: Aligned table header */}
      <div ref={scrollRef} className="hidden md:block overflow-x-auto scrollbar-none rounded-xl border border-[var(--line)] bg-[var(--surface)] shadow-xl">
        <table className="w-full min-w-[800px] border-collapse text-left table-fixed">
          <colgroup>
            <col className="w-[180px] sm:w-[200px]" />
            <col className="w-[calc((100%-180px)/3)] sm:w-[calc((100%-200px)/3)]" />
            <col className="w-[calc((100%-180px)/3)] sm:w-[calc((100%-200px)/3)]" />
            <col className="w-[calc((100%-180px)/3)] sm:w-[calc((100%-200px)/3)]" />
          </colgroup>
          <tbody>
            <tr>
              {/* Sidebar Header Column */}
              <td className="px-5 py-6 bg-[var(--background)]/[0.1] border-r border-[var(--line)] align-bottom select-none">
                <h4 className="font-display text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">Mẫu xe so sánh</h4>
                <p className="text-[10px] text-[var(--subtle)] mt-1 font-medium leading-relaxed">Thông số & Đặt lịch nhanh</p>
              </td>

              {/* Cars columns or empty placeholders */}
              {Array.from({ length: 3 }).map((_, index) => {
                const car = cars[index];
                if (car) {
                  return (
                    <td
                      key={car.id}
                      className="p-4 sm:p-5 lg:p-6 align-top border-l border-[var(--line)] bg-[var(--surface)]"
                    >
                      <div className="relative flex flex-col group h-[290px] justify-between">
                        {/* Close/Remove Button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveCar(car.id)}
                          className="absolute right-0 top-0 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--subtle)] shadow-md transition hover:scale-110 hover:text-[#e31837] hover:border-[#e31837]/35 cursor-pointer"
                          aria-label={`Xóa ${car.name}`}
                        >
                          <X size={14} />
                        </button>
                        
                        {/* Thumbnail */}
                        <div className="relative aspect-[16/10] w-[85%] overflow-hidden rounded-lg bg-[var(--muted)] shadow-inner">
                          <img
                            src={car.image}
                            alt={car.name}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-103"
                          />
                        </div>

                        {/* Info */}
                        <div className="mt-3 flex-1 flex flex-col justify-end">
                          <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#e31837]">
                            {car.brand} / {car.year}
                          </p>
                          <h4 className="mt-1 font-display text-xs sm:text-sm font-bold text-[var(--foreground)] group-hover:text-[#e31837] transition duration-200 line-clamp-2 pr-6">
                            {car.name}
                          </h4>
                          <p className="mt-1 font-display text-sm sm:text-base font-black text-[var(--foreground)]">
                            {car.price}
                          </p>
                        </div>

                        {/* Quick Actions */}
                        <div className="mt-4 flex flex-col gap-2">
                          {car.status !== "sold" && (
                            <button
                              type="button"
                              onClick={() => setSelectedCarForBooking(car.id)}
                              className="w-full flex items-center justify-center gap-1.5 py-2 text-[10px] font-bold uppercase tracking-wider bg-[#e31837] text-white hover:bg-[#c2142d] rounded-md transition shadow-md shadow-[#e31837]/10 cursor-pointer"
                            >
                              <CalendarDays size={12} /> Đặt lịch xem
                            </button>
                          )}
                          <a
                            href={`/contact?subject=Tư vấn xe ${encodeURIComponent(car.name)}`}
                            className="w-full flex items-center justify-center gap-1.5 py-2 text-[10px] font-bold uppercase tracking-wider border border-[var(--line)] bg-transparent text-[var(--subtle)] hover:bg-[var(--surface-strong)] hover:text-[var(--foreground)] rounded-md transition text-center"
                          >
                            <Mail size={12} /> Nhận tư vấn
                          </a>
                        </div>
                      </div>
                    </td>
                  );
                } else {
                  return (
                    <td
                      key={`empty-header-${index}`}
                      className="p-4 sm:p-5 lg:p-6 align-middle border-l border-[var(--line)] bg-[var(--surface)]"
                    >
                      {/* Empty placeholder card to Add Car */}
                      <div className="flex flex-col items-center justify-center border border-dashed border-[var(--line)] rounded-xl p-6 text-center h-[290px] bg-[var(--background)]/[0.03] hover:border-[#e31837]/40 hover:bg-[var(--background)]/[0.07] transition duration-200 group">
                        <button
                          type="button"
                          onClick={() => setIsModalOpen(true)}
                          className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e31837]/10 text-[#e31837] group-hover:bg-[#e31837] group-hover:text-white transition duration-300 shadow-md shadow-[#e31837]/10 cursor-pointer"
                        >
                          <Plus size={20} />
                        </button>
                        <p className="text-xs font-bold uppercase tracking-wider text-[var(--subtle)] mt-3">Thêm xe so sánh</p>
                        <p className="text-[10px] text-[var(--subtle)] opacity-70 mt-1">Chọn từ kho xe showroom</p>
                      </div>
                    </td>
                  );
                }
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Direct Add Vehicle Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 dark:bg-black/85 backdrop-blur-md transition-opacity"
            onClick={() => {
              setIsModalOpen(false);
              setSearchQuery("");
            }}
          />

          <div className="relative w-full max-w-xl transform overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--foreground)] p-5 sm:p-6 shadow-2xl transition-all backdrop-blur-md flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3 mb-4">
              <h3 className="font-display text-lg font-bold text-[var(--foreground)]">Chọn xe để so sánh</h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSearchQuery("");
                }}
                className="p-1 rounded-md text-[var(--subtle)] hover:text-[var(--foreground)] hover:bg-[var(--foreground)]/5 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative mb-4">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-[var(--subtle)]" />
              <input
                type="text"
                placeholder="Tìm hãng xe hoặc dòng xe..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-[var(--line)] bg-[var(--background)] py-2.5 pl-10 pr-4 text-base sm:text-sm font-semibold placeholder:text-[var(--subtle)] placeholder:font-medium focus:border-[#e31837] focus:outline-none focus:ring-1 focus:ring-[#e31837]"
              />
            </div>

            {/* Cars List (Scrollable) */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 max-h-[400px]">
              {filteredAvailableCars.length > 0 ? (
                filteredAvailableCars.map((car) => (
                  <div
                    key={car.id}
                    className="flex items-center gap-3.5 rounded-lg border border-[var(--line)] bg-[var(--surface-strong)]/30 p-2.5 hover:border-[var(--accent)]/30 hover:bg-[var(--surface-strong)]/60 transition duration-150 group"
                  >
                    <img
                      src={car.image}
                      alt={car.name}
                      className="h-12 w-20 rounded object-cover shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#e31837]">
                        {car.brand} / {car.year}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-[var(--foreground)] truncate">
                        {car.name}
                      </h4>
                      <p className="text-xs font-semibold text-[var(--subtle)] mt-0.5">
                        {car.price}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddCar(car)}
                      className="rounded bg-[#e31837] hover:bg-[#c2142d] text-white px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition shadow-sm cursor-pointer shrink-0"
                    >
                      Thêm xe
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-10">
                  <p className="text-sm text-[var(--subtle)]">
                    {searchQuery.trim()
                      ? "Không tìm thấy xe nào phù hợp."
                      : "Không có xe khả dụng khác để so sánh."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Booking Appointment Modal */}
      {selectedCarForBooking && activeCarForBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md transition-opacity"
            onClick={() => setSelectedCarForBooking(null)}
          />

          <div className="relative w-full max-w-2xl transform overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--foreground)] p-4 sm:p-6 md:p-8 shadow-2xl transition-all backdrop-blur-md">
            <button
              onClick={() => setSelectedCarForBooking(null)}
              className="absolute right-4 top-4 p-1 rounded-md text-[var(--subtle)] hover:text-[var(--foreground)] hover:bg-[var(--foreground)]/5 transition cursor-pointer"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>

            <div className="mb-4 sm:mb-6 pr-8">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#e31837]">
                Đặt lịch hẹn xem xe
              </span>
              <h3 className="font-display text-xl sm:text-2xl font-extrabold mt-1 text-[var(--foreground)]">
                {activeCarForBooking.name}
              </h3>
              <p className="text-xs sm:text-sm text-[var(--subtle)] mt-1">
                Đăng ký thông tin lịch hẹn để showroom TQ Auto chuẩn bị xe sẵn sàng đón tiếp.
              </p>
            </div>

            <div className="max-h-[78vh] sm:max-h-[70vh] overflow-y-auto pr-1">
              <AppointmentForm cars={allCars} initialCarId={activeCarForBooking.id} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
