"use client";

import { useState, useTransition } from "react";
import { CalendarDays, CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { updateAppointmentStatusAction } from "@/lib/actions/auth";

export interface AppointmentUiItem {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  carName: string;
  date: string;
  time: string;
  note: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
}

interface AdminAppointmentListProps {
  initialAppointments: AppointmentUiItem[];
}

const statusLabels = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  completed: "Đã hoàn thành",
  cancelled: "Đã hủy",
};

const statusTones: Record<string, "available" | "reserved" | "sold" | "neutral"> = {
  pending: "reserved",
  confirmed: "available",
  completed: "neutral",
  cancelled: "sold",
};

export function AdminAppointmentList({ initialAppointments }: AdminAppointmentListProps) {
  const [appointments, setAppointments] = useState<AppointmentUiItem[]>(initialAppointments);
  const [isPending, startTransition] = useTransition();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleUpdateStatus = (id: string, newStatus: AppointmentUiItem["status"]) => {
    setLoadingId(id + "-" + newStatus);
    
    if (newStatus === "confirmed") {
      (async () => {
        try {
          const response = await fetch(`/api/appointments/${id}/confirm`, {
            method: "POST",
          });
          const result = await response.json();
          
          if (response.ok && result.success) {
            setAppointments((prev) =>
              prev.map((app) => (app.id === id ? { ...app, status: "confirmed" } : app))
            );
            // If email failed to send (e.g. sandbox constraint), alert admin but keep the confirmed status
            if (!result.emailSent && result.emailError) {
              console.warn("Lịch hẹn đã xác nhận nhưng không thể gửi email:", result.emailError);
            }
          } else {
            alert(result.error || "Không thể xác nhận lịch hẹn");
          }
        } catch (error) {
          console.error("Error confirming appointment via API:", error);
          alert("Có lỗi xảy ra khi kết nối tới máy chủ.");
        } finally {
          setLoadingId(null);
        }
      })();
      return;
    }

    startTransition(async () => {
      const result = await updateAppointmentStatusAction(id, newStatus);
      if (result.success) {
        setAppointments((prev) =>
          prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
        );
      } else {
        alert(result.message || "Không thể cập nhật trạng thái lịch hẹn");
      }
      setLoadingId(null);
    });
  };

  // Filter today's appointments or show recent ones in the sidebar
  const todayStr = new Date().toISOString().split("T")[0];
  const todayAppointments = appointments.filter((app) => app.date === todayStr || app.status === "pending");

  return (
    <div className="grid gap-8 xl:grid-cols-[360px_1fr]">
      {/* Sidebar: Hôm nay / Cần xử lý */}
      <div className="rounded-md border border-white/10 bg-[#151a22] p-6 h-fit">
        <CalendarDays className="mb-6 text-[#e31837]" size={28} />
        <h2 className="font-display text-2xl font-bold text-white">Cần xử lý</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-400">Các lịch hẹn hôm nay hoặc đang chờ xác nhận.</p>
        <div className="mt-6 space-y-3">
          {todayAppointments.length === 0 ? (
            <p className="text-sm text-zinc-500 italic">Không có lịch hẹn cần xử lý.</p>
          ) : (
            todayAppointments.map((item) => (
              <div key={item.id} className="flex items-start gap-3 rounded-md border border-white/10 bg-white/5 p-3 text-sm font-semibold text-zinc-300">
                <Clock size={16} className="text-[#e31837] mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-white">{item.customerName}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{item.time} - {item.carName}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main List */}
      <div className="space-y-4">
        {appointments.length === 0 ? (
          <div className="rounded-md border border-white/10 bg-[#151a22] p-10 text-center text-zinc-400">
            Không tìm thấy lịch hẹn nào trong hệ thống.
          </div>
        ) : (
          appointments.map((item) => (
            <article key={item.id} className="rounded-md border border-white/10 bg-[#151a22] p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="mb-3 flex items-center gap-3">
                    <h3 className="font-display text-xl font-bold text-white">{item.customerName}</h3>
                    <Badge tone={statusTones[item.status]}>{statusLabels[item.status]}</Badge>
                  </div>
                  <div className="grid gap-2 text-sm text-zinc-400 sm:grid-cols-2">
                    <p>Xe quan tâm: <span className="font-semibold text-zinc-200">{item.carName}</span></p>
                    <p>Thời gian hẹn: <span className="font-semibold text-zinc-200">{item.date} lúc {item.time}</span></p>
                    <p>Số điện thoại: <span className="text-zinc-300 font-mono">{item.phone}</span></p>
                    <p>Email: <span className="text-zinc-300">{item.email}</span></p>
                  </div>
                  {item.note && (
                    <p className="mt-3 rounded border border-white/5 bg-white/2 p-3 text-sm text-zinc-400 italic">
                      &ldquo;{item.note}&rdquo;
                    </p>
                  )}
                </div>

                {/* Status Update Buttons */}
                <div className="flex flex-wrap gap-2">
                  {item.status === "pending" && (
                    <button
                      onClick={() => handleUpdateStatus(item.id, "confirmed")}
                      disabled={isPending || loadingId !== null}
                      className="inline-flex h-10 items-center gap-2 rounded-md border border-emerald-500/30 px-3 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/10 transition disabled:opacity-50"
                    >
                      {loadingId === `${item.id}-confirmed` ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={16} />
                      )}
                      Xác nhận
                    </button>
                  )}

                  {(item.status === "pending" || item.status === "confirmed") && (
                    <button
                      onClick={() => handleUpdateStatus(item.id, "completed")}
                      disabled={isPending || loadingId !== null}
                      className="inline-flex h-10 items-center gap-2 rounded-md border border-white/10 px-3 text-sm font-semibold text-zinc-300 hover:bg-white/5 transition disabled:opacity-50"
                    >
                      {loadingId === `${item.id}-completed` ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={16} />
                      )}
                      Hoàn thành
                    </button>
                  )}

                  {item.status !== "cancelled" && item.status !== "completed" && (
                    <button
                      onClick={() => handleUpdateStatus(item.id, "cancelled")}
                      disabled={isPending || loadingId !== null}
                      className="inline-flex h-10 items-center gap-2 rounded-md border border-red-500/30 px-3 text-sm font-semibold text-red-300 hover:bg-red-500/10 transition disabled:opacity-50"
                    >
                      {loadingId === `${item.id}-cancelled` ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <XCircle size={16} />
                      )}
                      Hủy lịch
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
