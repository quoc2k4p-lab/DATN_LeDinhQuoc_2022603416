"use client";

import { useState } from "react";
import { CalendarDays, Quote, PhoneCall, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AppointmentForm } from "../public/AppointmentForm";
import { CarSpecsExtended } from "@/lib/compare/compare-engine";
import { UiCar } from "@/lib/dbAdapter";

interface CompareCTAProps {
  cars: CarSpecsExtended[];
  allCars: UiCar[];
}

export function CompareCTA({ cars, allCars }: CompareCTAProps) {
  const [selectedCarForBooking, setSelectedCarForBooking] = useState<string | null>(null);
  
  const activeCar = cars.find((c) => c.id === selectedCarForBooking);

  return (
    <>
      <div className="grid grid-cols-1 border-t border-[var(--line)] bg-[var(--surface-strong)]/30 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-[200px_repeat(3,1fr)] lg:divide-x lg:divide-[var(--line)]">
        {/* Sidebar Label Column */}
        <div className="hidden lg:flex flex-col justify-center p-6 py-8">
          <h4 className="font-display text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">Hành động tiếp theo</h4>
          <p className="text-xs text-[var(--subtle)] mt-1 font-medium leading-relaxed">Đội ngũ TQ Auto luôn sẵn sàng hỗ trợ bạn 24/7</p>
        </div>

        {/* Cars Columns */}
        {cars.map((car) => (
          <div key={car.id} className="flex flex-col gap-3 p-5 sm:p-6 lg:p-7">
            <h4 className="font-display text-sm font-bold text-[var(--foreground)] opacity-80 truncate hidden lg:block mb-2">
              {car.name}
            </h4>

            {car.status !== "sold" && (
              <Button
                onClick={() => setSelectedCarForBooking(car.id)}
                className="w-full flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-wider"
              >
                <CalendarDays size={16} /> Đặt lịch lái thử
              </Button>
            )}

            <Button
              href={`/contact?subject=Báo giá xe ${encodeURIComponent(car.name)}`}
              variant="secondary"
              className="w-full flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-wider border-[var(--line)] text-[var(--subtle)] hover:bg-[var(--surface-strong)] hover:text-[var(--foreground)]"
            >
              <Quote size={16} /> Nhận báo giá lăn bánh
            </Button>

            <Button
              href={`/contact?subject=Tư vấn xe ${encodeURIComponent(car.name)}`}
              variant="secondary"
              className="w-full flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-wider border-[var(--line)] text-[var(--subtle)] hover:bg-[var(--surface-strong)] hover:text-[var(--foreground)]"
            >
              <PhoneCall size={16} /> Yêu cầu gọi lại tư vấn
            </Button>
          </div>
        ))}

        {/* Empty slots */}
        {cars.length < 3 &&
          Array.from({ length: 3 - cars.length }).map((_, i) => (
            <div key={`empty-cta-${i}`} className="hidden lg:block bg-[var(--background)]/20" />
          ))}
      </div>

      {/* Booking Appointment Modal */}
      {selectedCarForBooking && activeCar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md transition-opacity"
            onClick={() => setSelectedCarForBooking(null)}
          />

          <div className="relative w-full max-w-2xl transform overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--foreground)] p-4 sm:p-6 md:p-8 shadow-2xl transition-all backdrop-blur-md">
            <button
              onClick={() => setSelectedCarForBooking(null)}
              className="absolute right-4 top-4 p-1 rounded-md text-[var(--subtle)] hover:text-[var(--foreground)] hover:bg-[var(--foreground)]/5 transition"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>

            <div className="mb-4 sm:mb-6 pr-8">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#e31837]">
                Đặt lịch hẹn xem xe
              </span>
              <h3 className="font-display text-xl sm:text-2xl font-extrabold mt-1 text-[var(--foreground)]">
                {activeCar.name}
              </h3>
              <p className="text-xs sm:text-sm text-[var(--subtle)] mt-1">
                Đăng ký thông tin lịch hẹn để showroom TQ Auto chuẩn bị xe sẵn sàng đón tiếp.
              </p>
            </div>

            <div className="max-h-[78vh] sm:max-h-[70vh] overflow-y-auto pr-1">
              <AppointmentForm cars={allCars} initialCarId={activeCar.id} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
