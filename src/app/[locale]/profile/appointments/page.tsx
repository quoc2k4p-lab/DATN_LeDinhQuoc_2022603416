"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CalendarDays, MapPin, Clock, AlertCircle, Loader2, FileText, CarFront } from "lucide-react";
import { getMeAppointmentsAction } from "@/lib/actions/auth";
import { Badge } from "@/components/ui/Badge";
import { Link } from "@/i18n/routing";

interface AppointmentItem {
  id: string;
  car_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  appointment_date: string;
  note: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  created_at: string;
  car: {
    title: string;
    brand: string;
    model: string;
    year: number;
    thumbnail: string;
    city: string;
    address: string;
  } | null;
}

export default function AppointmentsPage() {
  const t = useTranslations("Profile");
  const locale = useLocale();
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAppointments() {
      const res = await getMeAppointmentsAction();
      if (res.success && res.appointments) {
        setAppointments(res.appointments);
      }
      setLoading(false);
    }
    loadAppointments();
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (locale === "vi") {
        return date.toLocaleDateString("vi-VN", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      }
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (e) {
      return dateStr;
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return "";
    }
  };

  const getStatusBadge = (status: AppointmentItem["status"]) => {
    switch (status) {
      case "pending":
        return <Badge tone="reserved">{locale === "vi" ? "Chờ xác nhận" : "Pending"}</Badge>;
      case "confirmed":
        return <Badge tone="available">{locale === "vi" ? "Đã xác nhận" : "Confirmed"}</Badge>;
      case "completed":
        return <Badge tone="neutral">{locale === "vi" ? "Hoàn thành" : "Completed"}</Badge>;
      case "cancelled":
        return <Badge tone="sold">{locale === "vi" ? "Đã hủy" : "Cancelled"}</Badge>;
      default:
        return <Badge tone="neutral">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#e31837]" />
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="rounded-lg border theme-border bg-[#11161d] p-12 text-center shadow-md">
        <CalendarDays className="mx-auto h-12 w-12 text-[#a1a1aa] theme-subtle mb-4" />
        <h3 className="font-display text-lg font-bold text-[var(--foreground)]">{t("noAppointments")}</h3>
        <p className="mt-2 text-sm text-[#a1a1aa] theme-subtle max-w-sm mx-auto">
          {locale === "vi"
            ? "Hãy chọn một mẫu xe yêu thích và đặt lịch hẹn xem xe lái thử để trải nghiệm dịch vụ của chúng tôi."
            : "Select a vehicle from our inventory and schedule a test drive session to experience TQ Auto premium services."}
        </p>
        <div className="mt-6">
          <Link
            href="/cars"
            className="inline-flex h-10 items-center justify-center rounded-md bg-[#e31837] px-5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#c2142d] transition"
          >
            {locale === "vi" ? "Khám phá kho xe" : "Browse Cars"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b theme-border pb-4 mb-4">
        <CalendarDays className="text-[#e31837]" size={20} />
        <h2 className="font-display text-lg font-bold uppercase tracking-wider">{t("appointments")}</h2>
      </div>

      <div className="grid gap-6">
        {appointments.map((apt) => (
          <div
            key={apt.id}
            className="group relative overflow-hidden rounded-lg border theme-border bg-[#11161d] p-5 shadow-md transition duration-300 hover:border-[#e31837]/35"
          >
            {/* Top decorative accent on hover */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#e31837] opacity-0 transition duration-300 group-hover:opacity-100" />

            <div className="flex flex-col md:flex-row gap-5">
              
              {/* Car Image */}
              <div className="relative h-32 w-full md:w-48 shrink-0 overflow-hidden rounded-md bg-[#1a1f28] border theme-border">
                {apt.car?.thumbnail ? (
                  <img
                    src={apt.car.thumbnail}
                    alt={apt.car.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[#e31837]">
                    <CarFront size={32} />
                  </div>
                )}
              </div>

              {/* Appointment details */}
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <h3 className="font-display text-lg font-bold tracking-tight text-[var(--foreground)] group-hover:text-[#e31837] transition">
                      {apt.car ? `${apt.car.brand} ${apt.car.model} ${apt.car.year}` : "Xe quan tâm"}
                    </h3>
                    {getStatusBadge(apt.status)}
                  </div>
                  
                  {/* Stats list */}
                  <div className="grid gap-x-6 gap-y-2 text-sm text-[#a1a1aa] theme-subtle mt-3 md:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-[#e31837]/80" />
                      <span>
                        {formatTime(apt.appointment_date)} - {formatDate(apt.appointment_date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-[#e31837]/80" />
                      <span className="truncate">
                        {apt.car?.address || "Showroom TQ Auto"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Note section */}
                {apt.note && (
                  <div className="mt-4 rounded border border-white/5 bg-[#1a1f28] p-3 text-xs text-[#a1a1aa] theme-subtle">
                    <div className="flex items-start gap-2">
                      <FileText size={14} className="text-[#e31837] shrink-0 mt-0.5" />
                      <p className="italic">
                        <strong>{locale === "vi" ? "Ghi chú:" : "Note:"}</strong> &ldquo;{apt.note}&rdquo;
                      </p>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
