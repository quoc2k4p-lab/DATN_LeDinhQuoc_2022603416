"use client";

import { useState } from "react";
import { CalendarDays, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AppointmentForm } from "./AppointmentForm";
import { UiCar } from "@/lib/dbAdapter";

interface CarDetailsActionsProps {
  car: UiCar;
  allCars: UiCar[];
}

export function CarDetailsActions({ car, allCars }: CarDetailsActionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button className="flex-1" onClick={() => setIsOpen(true)}>
          <CalendarDays size={18} /> Đặt lịch xem
        </Button>
        <Button href="/contact" variant="secondary" className="flex-1">
          Liên hệ tư vấn
        </Button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-[var(--background)]/85 backdrop-blur-md transition-opacity" 
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-2xl transform overflow-hidden rounded-lg border theme-border bg-[var(--surface)] text-[var(--foreground)] p-6 shadow-2xl transition-all sm:p-8">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 text-[var(--subtle)] hover:text-[var(--foreground)] transition"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>

            <div className="mb-6 pr-8">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#e31837]">
                Đặt lịch hẹn xem xe
              </span>
              <h3 className="font-display text-2xl font-extrabold mt-1">
                {car.name}
              </h3>
              <p className="text-sm theme-subtle mt-1">
                Vui lòng điền thông tin bên dưới để đăng ký xem xe trực tiếp tại showroom.
              </p>
            </div>

            <div className="max-h-[70vh] overflow-y-auto pr-1">
              <AppointmentForm cars={allCars} initialCarId={car.id} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
