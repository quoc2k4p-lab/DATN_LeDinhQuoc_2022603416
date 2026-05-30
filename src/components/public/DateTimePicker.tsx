"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, Clock, Loader2, AlertCircle } from "lucide-react";

const TIME_SLOTS = [
  { label: "08:00", hour: 8 },
  { label: "09:00", hour: 9 },
  { label: "10:00", hour: 10 },
  { label: "11:00", hour: 11 },
  { label: "14:00", hour: 14 },
  { label: "15:00", hour: 15 },
  { label: "16:00", hour: 16 },
  { label: "17:00", hour: 17 },
];

const MAX_BOOKINGS_PER_SLOT = 3;

const WEEKDAYS_VI = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const MONTHS_VI = [
  "Th.1", "Th.2", "Th.3", "Th.4", "Th.5", "Th.6",
  "Th.7", "Th.8", "Th.9", "Th.10", "Th.11", "Th.12",
];

interface DateTimePickerProps {
  selectedDate: string;
  selectedTime: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  dateError?: string;
  timeError?: string;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatDate(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function DateTimePicker({
  selectedDate,
  selectedTime,
  onDateChange,
  onTimeChange,
  dateError,
  timeError,
}: DateTimePickerProps) {
  const today = new Date();
  const todayStr = toDateStr(today);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [slotCounts, setSlotCounts] = useState<Record<string, number>>({});
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const fetchSlots = useCallback(async (dateStr: string) => {
    if (!dateStr) return;
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoadingSlots(true);
    setSlotError("");
    try {
      const res = await fetch(`/api/appointments/slots?date=${dateStr}`, { signal: controller.signal });
      const data = await res.json();
      if (data.success) setSlotCounts(data.slots || {});
      else setSlotError(data.message || "Lỗi tải slot");
    } catch (err: any) {
      if (err.name !== "AbortError") setSlotError("Không thể kết nối server.");
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    if (selectedDate) fetchSlots(selectedDate);
  }, [selectedDate, fetchSlots]);

  const goToPrevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const goToNextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const canGoPrev = viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth > today.getMonth());

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const calendarCells: { day: number; dateStr: string; isPast: boolean; isToday: boolean; isSelected: boolean }[] = [];
  for (let i = 0; i < firstDay; i++) {
    calendarCells.push({ day: 0, dateStr: "", isPast: true, isToday: false, isSelected: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = formatDate(viewYear, viewMonth, d);
    calendarCells.push({ day: d, dateStr: ds, isPast: ds < todayStr, isToday: ds === todayStr, isSelected: ds === selectedDate });
  }

  const isSlotDisabled = (hour: number): boolean => {
    if (selectedDate === todayStr && hour <= today.getHours()) return true;
    return (slotCounts[String(hour)] || 0) >= MAX_BOOKINGS_PER_SLOT;
  };

  const getSlotStatus = (hour: number): "available" | "limited" | "full" | "past" => {
    if (selectedDate === todayStr && hour <= today.getHours()) return "past";
    const count = slotCounts[String(hour)] || 0;
    if (count >= MAX_BOOKINGS_PER_SLOT) return "full";
    if (count >= 2) return "limited";
    return "available";
  };

  const handleDateClick = (dateStr: string) => { onDateChange(dateStr); onTimeChange(""); };
  const handleTimeClick = (label: string) => { onTimeChange(label); };

  return (
    <div className="md:col-span-2">
      <div className="grid md:grid-cols-[1fr_180px] gap-3">
        {/* ====== COMPACT CALENDAR ====== */}
        <div>
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] theme-subtle">
            <CalendarDays className="inline-block w-3 h-3 mr-1 -mt-0.5" />
            Ngày hẹn <span className="text-red-500">*</span>
          </span>
          <div className="rounded-lg border theme-border bg-[var(--background)] overflow-hidden">
            {/* Month header */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b theme-border bg-gradient-to-r from-[#e31837]/5 to-transparent">
              <button type="button" onClick={goToPrevMonth} disabled={!canGoPrev}
                className="p-1 rounded hover:bg-[var(--foreground)]/5 transition disabled:opacity-20 disabled:cursor-not-allowed" aria-label="Tháng trước">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold tracking-wide">
                {MONTHS_VI[viewMonth]} {viewYear}
              </span>
              <button type="button" onClick={goToNextMonth}
                className="p-1 rounded hover:bg-[var(--foreground)]/5 transition" aria-label="Tháng sau">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7">
              {WEEKDAYS_VI.map((wd) => (
                <div key={wd} className="py-1 text-center text-[9px] font-bold uppercase tracking-wider theme-subtle">
                  {wd}
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 px-1 pb-1 gap-0.5">
              {calendarCells.map((cell, idx) => {
                if (cell.day === 0) return <div key={`b-${idx}`} className="w-full h-7" />;
                const disabled = cell.isPast;
                const selected = cell.isSelected;
                const isTd = cell.isToday;
                return (
                  <button key={cell.dateStr} type="button" disabled={disabled} onClick={() => handleDateClick(cell.dateStr)}
                    className={`
                      h-7 flex items-center justify-center rounded text-xs font-medium transition-all duration-150
                      ${disabled ? "opacity-20 cursor-not-allowed"
                        : selected ? "bg-[#e31837] text-white shadow-md shadow-[#e31837]/30 scale-105"
                        : isTd ? "border border-[#e31837]/50 text-[#e31837] hover:bg-[#e31837]/10"
                        : "hover:bg-[var(--foreground)]/5 cursor-pointer"
                      }
                    `}>
                    {cell.day}
                  </button>
                );
              })}
            </div>
          </div>
          {dateError && (
            <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-red-500">
              <AlertCircle className="w-3 h-3" /> {dateError}
            </p>
          )}
        </div>

        {/* ====== COMPACT TIME SLOTS ====== */}
        <div>
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] theme-subtle">
            <Clock className="inline-block w-3 h-3 mr-1 -mt-0.5" />
            Giờ hẹn <span className="text-red-500">*</span>
          </span>

          {!selectedDate ? (
            <div className="rounded-lg border theme-border bg-[var(--background)] p-4 text-center h-[calc(100%-24px)] flex flex-col items-center justify-center">
              <CalendarDays className="w-5 h-5 mb-1 theme-subtle opacity-30" />
              <p className="text-[11px] theme-subtle">Chọn ngày trước</p>
            </div>
          ) : loadingSlots ? (
            <div className="rounded-lg border theme-border bg-[var(--background)] p-4 flex items-center justify-center gap-1.5 h-[calc(100%-24px)]">
              <Loader2 className="w-4 h-4 animate-spin text-[#e31837]" />
              <span className="text-[11px] theme-subtle">Đang tải...</span>
            </div>
          ) : slotError ? (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-center">
              <AlertCircle className="w-4 h-4 mx-auto mb-1 text-red-500" />
              <p className="text-[11px] text-red-500">{slotError}</p>
            </div>
          ) : (
            <div className="rounded-lg border theme-border bg-[var(--background)] p-2">
              {/* Legend - inline compact */}
              <div className="flex gap-2 mb-1.5 pb-1.5 border-b theme-border">
                <div className="flex items-center gap-1 text-[8px] font-medium theme-subtle">
                  <span className="w-1.5 h-1.5 rounded-sm bg-emerald-500/30" /> Còn
                </div>
                <div className="flex items-center gap-1 text-[8px] font-medium theme-subtle">
                  <span className="w-1.5 h-1.5 rounded-sm bg-amber-500/30" /> Ít
                </div>
                <div className="flex items-center gap-1 text-[8px] font-medium theme-subtle">
                  <span className="w-1.5 h-1.5 rounded-sm bg-red-500/20" /> Hết
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {TIME_SLOTS.map(({ label, hour }) => {
                  const disabled = isSlotDisabled(hour);
                  const selected = selectedTime === label;
                  const status = getSlotStatus(hour);
                  const count = slotCounts[String(hour)] || 0;
                  const remaining = MAX_BOOKINGS_PER_SLOT - count;

                  return (
                    <button key={label} type="button" disabled={disabled} onClick={() => handleTimeClick(label)}
                      className={`
                        rounded-md py-2 px-1 text-center transition-all duration-150 border
                        ${disabled
                          ? status === "full"
                            ? "bg-red-500/5 border-red-500/10 text-red-400/30 cursor-not-allowed line-through"
                            : "opacity-20 cursor-not-allowed border-transparent"
                          : selected
                            ? "bg-[#e31837] border-[#e31837] text-white shadow-md shadow-[#e31837]/25"
                            : status === "limited"
                              ? "bg-amber-500/5 border-amber-500/15 hover:bg-amber-500/10"
                              : "bg-emerald-500/5 border-emerald-500/10 hover:bg-emerald-500/10"
                        }
                      `}>
                      <span className={`text-xs font-semibold ${selected ? "text-white" : ""}`}>{label}</span>
                      {!disabled && !selected && (
                        <span className={`block text-[9px] leading-none mt-0.5 ${status === "limited" ? "text-amber-500/70" : "text-emerald-500/50"}`}>
                          {remaining}/{MAX_BOOKINGS_PER_SLOT}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <p className="mt-1.5 text-[8px] theme-subtle text-center opacity-60">
                08–12h &amp; 14–18h
              </p>
            </div>
          )}

          {timeError && (
            <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-red-500">
              <AlertCircle className="w-3 h-3" /> {timeError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
