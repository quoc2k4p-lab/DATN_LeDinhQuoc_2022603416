"use client";

import { useState, useTransition, useEffect } from "react";
import { CalendarDays, CheckCircle2, Clock, XCircle, Loader2, AlertCircle, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { updateAppointmentStatusAction, createAppointmentAction } from "@/lib/actions/auth";
import { DateTimePicker } from "@/components/public/DateTimePicker";
import { useRouter } from "next/navigation";
import { useSocket } from "@/lib/socket/socket-client";
import { SOCKET_EVENTS } from "@/lib/socket/socket-events";

export interface AppointmentUiItem {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  carName: string;
  carAddress: string;
  date: string;
  time: string;
  note: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  customerType: "Khách vãng lai" | "Tài khoản";
  assignedStaffName: string | null;
  created_at?: string;
}

interface AdminCarItem {
  id: string;
  name: string;
  status: string;
}

interface AdminAppointmentListProps {
  initialAppointments: AppointmentUiItem[];
  cars: AdminCarItem[];
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

export function AdminAppointmentList({ initialAppointments, cars }: AdminAppointmentListProps) {
  const [appointments, setAppointments] = useState<AppointmentUiItem[]>(initialAppointments);
  const [prevInitialAppointments, setPrevInitialAppointments] = useState(initialAppointments);

  if (initialAppointments !== prevInitialAppointments) {
    setAppointments(initialAppointments);
    setPrevInitialAppointments(initialAppointments);
  }

  const [isPending, startTransition] = useTransition();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const router = useRouter();

  // Socket state
  const [socketToken, setSocketToken] = useState<string | null>(null);
  
  useEffect(() => {
    async function loadSocketToken() {
      try {
        const { getSocketTokenAction } = await import("@/lib/actions/chatActions");
        const res = await getSocketTokenAction();
        if (res.success && res.token) {
          setSocketToken(res.token);
        }
      } catch (err) {
        console.error("Failed to load socket token in AdminAppointmentList:", err);
      }
    }
    loadSocketToken();
  }, []);

  const { socket, isConnected } = useSocket(
    socketToken ? { token: socketToken } : undefined
  );

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewAppointment = (newAppt: any) => {
      setAppointments((prev) => {
        // Avoid duplicate items
        if (prev.some((a) => a.id === newAppt.id)) return prev;
        return [newAppt, ...prev];
      });
      // Refresh page state to ensure any server actions or page sync is fresh
      router.refresh();
    };

    socket.on(SOCKET_EVENTS.NEW_APPOINTMENT, handleNewAppointment);

    return () => {
      socket.off(SOCKET_EVENTS.NEW_APPOINTMENT, handleNewAppointment);
    };
  }, [socket, isConnected, router]);

  // Sidebar Toggle State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newApp, setNewApp] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    carId: "",
    date: "",
    time: "",
    note: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [actionStatus, setActionStatus] = useState<{ type: "success" | "error" | null; message: string }>({ type: null, message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeCars = cars.filter((car) => car.status !== "sold");

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionStatus({ type: null, message: "" });
    setFormErrors({});

    const errors: Record<string, string> = {};
    if (!newApp.customerName.trim()) errors.customerName = "Họ tên là bắt buộc";
    if (!newApp.customerPhone.trim()) errors.customerPhone = "Số điện thoại là bắt buộc";
    if (!newApp.customerEmail.trim()) errors.customerEmail = "Email là bắt buộc";
    if (!newApp.carId) errors.carId = "Vui lòng chọn xe";
    if (!newApp.date) errors.date = "Vui lòng chọn ngày hẹn";
    if (!newApp.time) errors.time = "Vui lòng chọn giờ hẹn";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setActionStatus({
        type: "error",
        message: "Vui lòng điền đầy đủ các thông tin bắt buộc.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("customerName", newApp.customerName.trim());
      formData.append("customerPhone", newApp.customerPhone.trim());
      formData.append("customerEmail", newApp.customerEmail.trim());
      formData.append("carId", newApp.carId);
      formData.append("date", newApp.date);
      formData.append("time", newApp.time);
      formData.append("note", newApp.note.trim());

      const result = await createAppointmentAction(formData);

      if (result.success) {
        setActionStatus({
          type: "success",
          message: "Thêm lịch hẹn mới thành công!",
        });
        setNewApp({
          customerName: "",
          customerPhone: "",
          customerEmail: "",
          carId: "",
          date: "",
          time: "",
          note: "",
        });
        
        router.refresh();
        setTimeout(() => {
          setIsAddModalOpen(false);
          setActionStatus({ type: null, message: "" });
        }, 1500);
      } else {
        setActionStatus({
          type: "error",
          message: result.message || "Không thể tạo lịch hẹn.",
        });
        if (result.errors) {
          setFormErrors(result.errors);
        }
      }
    } catch (err) {
      console.error("Error creating appointment:", err);
      setActionStatus({
        type: "error",
        message: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
    <div className={`grid gap-8 transition-all duration-300 ${isSidebarOpen ? "xl:grid-cols-[360px_1fr]" : "grid-cols-1"}`}>
      {/* Sidebar: Hôm nay / Cần xử lý */}
      {isSidebarOpen && (
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
      )}

      {/* Main List */}
      <div className="space-y-4">
        {/* Header Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-md border border-white/10 bg-[#151a22] p-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-white/5 text-zinc-300 hover:bg-[#e31837] hover:text-white transition cursor-pointer"
              title={isSidebarOpen ? "Ẩn danh sách cần xử lý" : "Hiện danh sách cần xử lý"}
            >
              {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Tổng số: <span className="font-bold text-white">{appointments.length}</span> lịch hẹn
            </div>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex h-10 items-center justify-center gap-2 rounded-md bg-[#e31837] px-4 text-xs font-bold text-white hover:bg-[#c2142d] transition-colors shadow-md shadow-[#e31837]/15 cursor-pointer"
          >
            <Plus size={14} />
            Thêm lịch hẹn mới
          </button>
        </div>

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
                    <p>Khách hàng: <span className="font-semibold text-zinc-200">{item.customerName}</span></p>
                    <p>Loại khách: <span className={`font-semibold ${item.customerType === "Tài khoản" ? "text-blue-400" : "text-amber-400"}`}>{item.customerType}</span></p>
                    <p>Xe quan tâm: <span className="font-semibold text-zinc-200">{item.carName}</span></p>
                    <p>Lịch hẹn: <span className="font-semibold text-zinc-200">{item.date} lúc {item.time}</span></p>
                    <p>Số điện thoại: <span className="text-zinc-300 font-mono">{item.phone}</span></p>
                    <p>Email: <span className="text-zinc-300">{item.email}</span></p>
                    <p className="sm:col-span-2">Địa điểm xem xe: <span className="font-semibold text-zinc-200">{item.carAddress || "Showroom TQ Auto"}</span></p>
                    <p className="sm:col-span-2">Nhân viên phụ trách: <span className="font-semibold text-zinc-200">{item.assignedStaffName || "Chưa phân công"}</span></p>
                  </div>
                  {item.note && (
                    <p className="mt-3 rounded border border-white/5 bg-white/2 p-3 text-sm text-zinc-400 italic">
                      &ldquo;{item.note}&rdquo;
                    </p>
                  )}
                </div>

                {/* Status Update Buttons */}
                <div className="flex flex-wrap gap-1.5">
                  {item.status === "pending" && (
                    <button
                      onClick={() => handleUpdateStatus(item.id, "confirmed")}
                      disabled={isPending || loadingId !== null}
                      className="inline-flex h-8 sm:h-10 items-center gap-1 sm:gap-2 rounded-md border border-emerald-500/30 px-2 sm:px-3 text-xs sm:text-sm font-semibold text-emerald-300 hover:bg-emerald-500/10 transition disabled:opacity-50"
                    >
                      {loadingId === `${item.id}-confirmed` ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={14} />
                      )}
                      Xác nhận
                    </button>
                  )}

                  {(item.status === "pending" || item.status === "confirmed") && (
                    <button
                      onClick={() => handleUpdateStatus(item.id, "completed")}
                      disabled={isPending || loadingId !== null}
                      className="inline-flex h-8 sm:h-10 items-center gap-1 sm:gap-2 rounded-md border border-white/10 px-2 sm:px-3 text-xs sm:text-sm font-semibold text-zinc-300 hover:bg-white/5 transition disabled:opacity-50"
                    >
                      {loadingId === `${item.id}-completed` ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={14} />
                      )}
                      Hoàn thành
                    </button>
                  )}

                  {item.status !== "cancelled" && item.status !== "completed" && (
                    <button
                      onClick={() => handleUpdateStatus(item.id, "cancelled")}
                      disabled={isPending || loadingId !== null}
                      className="inline-flex h-8 sm:h-10 items-center gap-1 sm:gap-2 rounded-md border border-red-500/30 px-2 sm:px-3 text-xs sm:text-sm font-semibold text-red-300 hover:bg-red-500/10 transition disabled:opacity-50"
                    >
                      {loadingId === `${item.id}-cancelled` ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <XCircle size={14} />
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

      {/* Modal: Thêm lịch hẹn mới */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => {
              setIsAddModalOpen(false);
              setActionStatus({ type: null, message: "" });
            }}
          />

          {/* Dialog content */}
          <div className="relative max-w-2xl w-full bg-[#151a22] border border-white/10 p-6 rounded-xl shadow-2xl z-10 max-h-[90vh] overflow-y-auto flex flex-col gap-5 forced-dark">
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                setActionStatus({ type: null, message: "" });
              }}
              className="absolute right-4 top-4 text-zinc-400 hover:text-white transition-colors cursor-pointer text-sm font-bold"
            >
              ✕
            </button>

            <h3 className="font-display text-lg font-bold text-white border-b border-white/10 pb-3 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-[#e31837]" />
              Thêm lịch hẹn mới
            </h3>

            {actionStatus.type === "success" && (
              <div className="flex items-start gap-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 p-4 text-emerald-400">
                <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">Thành công</p>
                  <p className="text-sm mt-1 text-emerald-400/95">{actionStatus.message}</p>
                </div>
              </div>
            )}

            {actionStatus.type === "error" && (
              <div className="flex items-start gap-3 rounded-md bg-red-500/10 border border-red-500/20 p-4 text-red-400">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">Lỗi</p>
                  <p className="text-sm mt-1 text-red-400/95">{actionStatus.message}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Họ tên khách hàng <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={newApp.customerName}
                    onChange={(e) => {
                      setNewApp(prev => ({ ...prev, customerName: e.target.value }));
                      if (formErrors.customerName) setFormErrors(prev => ({ ...prev, customerName: "" }));
                    }}
                    placeholder="Nguyễn Văn A"
                    className="bg-[#0b1016] border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e31837] w-full"
                    required
                  />
                  {formErrors.customerName && <p className="text-xs text-red-400 mt-1">{formErrors.customerName}</p>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Số điện thoại <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={newApp.customerPhone}
                    onChange={(e) => {
                      setNewApp(prev => ({ ...prev, customerPhone: e.target.value }));
                      if (formErrors.customerPhone) setFormErrors(prev => ({ ...prev, customerPhone: "" }));
                    }}
                    placeholder="0909888668"
                    className="bg-[#0b1016] border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e31837] w-full"
                    required
                  />
                  {formErrors.customerPhone && <p className="text-xs text-red-400 mt-1">{formErrors.customerPhone}</p>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Email <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    value={newApp.customerEmail}
                    onChange={(e) => {
                      setNewApp(prev => ({ ...prev, customerEmail: e.target.value }));
                      if (formErrors.customerEmail) setFormErrors(prev => ({ ...prev, customerEmail: "" }));
                    }}
                    placeholder="email@example.com"
                    className="bg-[#0b1016] border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e31837] w-full"
                    required
                  />
                  {formErrors.customerEmail && <p className="text-xs text-red-400 mt-1">{formErrors.customerEmail}</p>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Xe quan tâm <span className="text-red-500">*</span></label>
                  <select
                    value={newApp.carId}
                    onChange={(e) => {
                      setNewApp(prev => ({ ...prev, carId: e.target.value }));
                      if (formErrors.carId) setFormErrors(prev => ({ ...prev, carId: "" }));
                    }}
                    className="bg-[#0b1016] border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e31837] w-full"
                    required
                  >
                    <option value="">-- Chọn xe quan tâm --</option>
                    {activeCars.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {formErrors.carId && <p className="text-xs text-red-400 mt-1">{formErrors.carId}</p>}
                </div>

                <div className="md:col-span-2 border-t border-white/5 pt-4 mt-2">
                  <DateTimePicker
                    selectedDate={newApp.date}
                    selectedTime={newApp.time}
                    onDateChange={(date) => {
                      setNewApp(prev => ({ ...prev, date }));
                      if (formErrors.date) setFormErrors(prev => ({ ...prev, date: "" }));
                    }}
                    onTimeChange={(time) => {
                      setNewApp(prev => ({ ...prev, time }));
                      if (formErrors.time) setFormErrors(prev => ({ ...prev, time: "" }));
                    }}
                    dateError={formErrors.date}
                    timeError={formErrors.time}
                  />
                </div>

                <div className="md:col-span-2 flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Ghi chú (Tùy chọn)</label>
                  <textarea
                    value={newApp.note}
                    onChange={(e) => setNewApp(prev => ({ ...prev, note: e.target.value }))}
                    placeholder="Yêu cầu cụ thể của khách hàng..."
                    rows={3}
                    className="bg-[#0b1016] border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e31837] w-full resize-none"
                  />
                </div>
              </div>

              <div className="mt-6 border-t border-white/10 pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setActionStatus({ type: null, message: "" });
                  }}
                  className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#e31837] hover:bg-[#c2142d] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang tạo...
                    </>
                  ) : (
                    <>
                      <CalendarDays className="w-3.5 h-3.5" /> Thêm lịch hẹn
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
