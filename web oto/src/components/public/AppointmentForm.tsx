"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import { CalendarDays, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/public/FormField";
import { DateTimePicker } from "@/components/public/DateTimePicker";
import { UiCar } from "@/lib/dbAdapter";
import { createAppointmentAction } from "@/lib/actions/auth";
import { io } from "socket.io-client";

interface AppointmentFormProps {
  cars: UiCar[];
  initialCarId?: string;
}

export function AppointmentForm({ cars, initialCarId }: AppointmentFormProps) {
  const [isPending, startTransition] = useTransition();
  
  // Filter out sold cars so they cannot be selected (memoized to keep reference stable)
  const activeCars = useMemo(() => cars.filter((car) => car.status !== "sold"), [cars]);

  // Find initial car slug or name if initialCarId is provided
  const defaultCarName = activeCars.find(c => c.id === initialCarId || c.slug === initialCarId)?.name || activeCars[0]?.name || "";

  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    carId: "",
    date: "",
    time: "",
    note: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const [userId, setUserId] = useState<string | null>(null);

  // Pre-fill user data if logged in
  useEffect(() => {
    const stored = window.localStorage.getItem("tq-auto-user");
    if (stored) {
      try {
        const user = JSON.parse(stored);
        setUserId(user.id || null);
        setFormData(prev => ({
          ...prev,
          customerName: user.name || "",
          customerPhone: user.phone || "",
          customerEmail: user.email || "",
        }));
      } catch (err) {
        console.error("Error parsing stored user:", err);
      }
    }
  }, []);

  // Update default selected car when cars list is loaded
  useEffect(() => {
    if (activeCars.length > 0) {
      const selected = activeCars.find(c => c.id === initialCarId || c.slug === initialCarId) || activeCars[0];
      setFormData(prev => ({
        ...prev,
        carId: selected.id,
      }));
    }
  }, [cars, initialCarId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    // If car selection changes, search for car ID matching selected car name
    if (name === "carName") {
      const matchedCar = activeCars.find(c => c.name === value);
      if (matchedCar) {
        setFormData(prev => ({ ...prev, carId: matchedCar.id }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleDateChange = (date: string) => {
    setFormData((prev) => ({ ...prev, date }));
    if (errors.date) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.date;
        return next;
      });
    }
  };

  const handleTimeChange = (time: string) => {
    setFormData((prev) => ({ ...prev, time }));
    if (errors.time) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.time;
        return next;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus({ type: null, message: "" });
    setErrors({});

    const clientErrors: Record<string, string> = {};
    if (!formData.customerName.trim()) clientErrors.customerName = "Họ tên là bắt buộc";
    if (!formData.customerPhone.trim()) clientErrors.customerPhone = "Số điện thoại là bắt buộc";
    if (!formData.customerEmail.trim()) clientErrors.customerEmail = "Email là bắt buộc";
    if (!formData.carId) clientErrors.carId = "Vui lòng chọn xe";
    if (!formData.date) clientErrors.date = "Vui lòng chọn ngày hẹn";
    if (!formData.time) clientErrors.time = "Vui lòng chọn giờ hẹn";

    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      setStatus({
        type: "error",
        message: "Vui lòng nhập đầy đủ và chính xác các thông tin.",
      });
      return;
    }

    startTransition(async () => {
      const submissionData = new FormData();
      submissionData.append("customerName", formData.customerName);
      submissionData.append("customerPhone", formData.customerPhone);
      submissionData.append("customerEmail", formData.customerEmail);
      submissionData.append("carId", formData.carId);
      submissionData.append("date", formData.date);
      submissionData.append("time", formData.time);
      submissionData.append("note", formData.note);
      if (userId) {
        submissionData.append("userId", userId);
      }

      const result = await createAppointmentAction(submissionData);

      if (result.success) {
        setStatus({
          type: "success",
          message: result.message || "Đặt lịch hẹn thành công!",
        });
        // Emit socket event to notify admin in real-time
        try {
          const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || (typeof window !== "undefined" ? `${window.location.protocol}//${window.location.hostname}:3001` : "http://localhost:3001");
          const tempSocket = io(socketUrl, {
            auth: {
              sessionId: userId || `temp_${Math.random().toString(36).substring(2, 11)}`,
              name: formData.customerName,
            }
          });
          tempSocket.on("connect", () => {
            tempSocket.emit("new_appointment", {
              id: result.appointmentId,
              customerName: formData.customerName,
              phone: formData.customerPhone,
              email: formData.customerEmail,
              carName: currentCarName,
              carAddress: currentCar ? currentCar.address : "Showroom TQ Auto",
              date: formData.date,
              time: formData.time,
              note: formData.note,
              status: "pending",
              customerType: userId ? "Tài khoản" : "Khách vãng lai",
              assignedStaffName: null,
            });
            setTimeout(() => tempSocket.disconnect(), 1000);
          });
        } catch (e) {
          console.error("Failed to emit socket notification:", e);
        }

        // Clear form fields that are not user info
        setFormData(prev => ({
          ...prev,
          date: "",
          time: "",
          note: "",
        }));
      } else {
        setStatus({
          type: "error",
          message: result.message || "Đặt lịch hẹn thất bại",
        });
        if (result.errors) {
          setErrors(result.errors);
        }
      }
    });
  };

  const currentCar = activeCars.find(c => c.id === formData.carId);
  const currentCarName = currentCar ? currentCar.name : defaultCarName;

  return (
    <form onSubmit={handleSubmit} className="rounded-md border theme-surface p-6">
      {status.type === "success" && (
        <div className="mb-6 flex items-start gap-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 p-4 text-emerald-500">
          <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold">Thành công</p>
            <p className="text-sm mt-1 text-emerald-500/90">{status.message}</p>
          </div>
        </div>
      )}

      {status.type === "error" && (
        <div className="mb-6 flex items-start gap-3 rounded-md bg-red-500/10 border border-red-500/20 p-4 text-red-500">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold">Lỗi</p>
            <p className="text-sm mt-1 text-red-500/90">{status.message}</p>
          </div>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <FormField 
          label="Họ tên" 
          name="customerName"
          placeholder="Nguyễn Văn A" 
          value={formData.customerName}
          onChange={handleChange}
          error={errors.customerName}
          required
        />
        <FormField 
          label="Số điện thoại" 
          name="customerPhone"
          placeholder="0909 888 668" 
          value={formData.customerPhone}
          onChange={handleChange}
          error={errors.customerPhone}
          required
        />
        <FormField 
          label="Email" 
          name="customerEmail"
          type="email" 
          placeholder="email@example.com" 
          value={formData.customerEmail}
          onChange={handleChange}
          error={errors.customerEmail}
          required
        />
        <FormField 
          label="Xe quan tâm" 
          name="carName"
          as="select" 
          options={activeCars.map((car) => car.name)} 
          value={currentCarName}
          onChange={handleChange}
          error={errors.carId}
          required
        />
        <DateTimePicker
          selectedDate={formData.date}
          selectedTime={formData.time}
          onDateChange={handleDateChange}
          onTimeChange={handleTimeChange}
          dateError={errors.date}
          timeError={errors.time}
        />
        <div className="md:col-span-2">
          <FormField 
            label="Ghi chú" 
            name="note"
            as="textarea" 
            placeholder="Nhu cầu tư vấn, trả góp, lái thử..." 
            value={formData.note}
            onChange={handleChange}
          />
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Đang gửi...
            </>
          ) : (
            <>
              <CalendarDays size={18} /> Gửi lịch hẹn
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
