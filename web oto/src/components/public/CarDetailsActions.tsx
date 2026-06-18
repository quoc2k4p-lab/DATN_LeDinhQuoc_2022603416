"use client";

import { useState, useEffect } from "react";
import { CalendarDays, X, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AppointmentForm } from "./AppointmentForm";
import { UiCar } from "@/lib/dbAdapter";
import { isInCompare, addToCompare, removeFromCompare } from "@/components/compare/CompareBar";

interface CompareCarItem {
  id: string;
  name: string;
  thumbnail: string;
  brand: string;
}

interface CarDetailsActionsProps {
  car: UiCar;
  allCars: UiCar[];
}

export function CarDetailsActions({ car, allCars }: CarDetailsActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(false);

  useEffect(() => {
    setSelected(isInCompare(car.id));
    const handleUpdate = () => {
      setSelected(isInCompare(car.id));
    };
    window.addEventListener("compare-store-updated", handleUpdate);
    return () => window.removeEventListener("compare-store-updated", handleUpdate);
  }, [car.id]);

  const handleCompareToggle = () => {
    if (selected) {
      removeFromCompare(car.id);
      setSelected(false);
    } else {
      const added = addToCompare({
        id: car.id,
        name: car.name,
        thumbnail: car.image,
        brand: car.brand,
      });
      if (added) {
        setSelected(true);
      }
    }
  };

  return (
    <>
      <div className="mt-8 flex flex-col gap-3">
        <div className="flex gap-3">
          {car.status !== "sold" && (
            <Button className="flex-1" onClick={() => setIsOpen(true)}>
              <CalendarDays size={18} /> Đặt lịch xem
            </Button>
          )}
          <Button href="/contact" variant="secondary" className="flex-1">
            Liên hệ tư vấn
          </Button>
        </div>
        <Button
          onClick={handleCompareToggle}
          variant={selected ? "primary" : "secondary"}
          className={`w-full flex items-center justify-center gap-1.5 ${
            selected ? "bg-[#e31837] text-white hover:bg-[#c2142d] border-none" : ""
          }`}
        >
          <ArrowRightLeft size={18} />
          {selected ? "Đã thêm so sánh" : "Thêm vào so sánh"}
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
          <div className="relative w-full max-w-2xl transform overflow-hidden rounded-lg border theme-border bg-[var(--surface)] text-[var(--foreground)] p-4 sm:p-6 md:p-8 shadow-2xl transition-all">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 p-1 rounded-md text-[var(--subtle)] hover:text-[var(--foreground)] hover:bg-[var(--foreground)]/5 transition"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>

            <div className="mb-4 sm:mb-6 pr-8">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#e31837]">
                Đặt lịch hẹn xem xe
              </span>
              <h3 className="font-display text-xl sm:text-2xl font-extrabold mt-1">
                {car.name}
              </h3>
              <p className="text-xs sm:text-sm theme-subtle mt-1">
                Vui lòng điền thông tin bên dưới để đăng ký xem xe trực tiếp tại showroom.
              </p>
            </div>

            <div className="max-h-[78vh] sm:max-h-[70vh] overflow-y-auto pr-1">
              <AppointmentForm cars={allCars} initialCarId={car.id} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
