"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { saveLoanSimulationLeadAction } from "@/lib/actions/loanActions";

const leadSchema = z.object({
  fullName: z.string().min(2, "Họ tên phải từ 2 ký tự trở lên"),
  phone: z
    .string()
    .min(9, "Số điện thoại phải từ 9 số")
    .max(12, "Số điện thoại không quá 12 số")
    .regex(/^[0-9]+$/, "Số điện thoại chỉ được chứa các chữ số"),
  email: z.string().email("Địa chỉ email không đúng định dạng"),
});

type LeadFormData = z.infer<typeof leadSchema>;

interface LoanLeadFormProps {
  isOpen: boolean;
  onClose: () => void;
  carId: string | null;
  carPrice: number;
  downPaymentPercent: number;
  downPaymentAmount: number;
  loanAmount: number;
  interestRate: number;
  termMonths: number;
  monthlyPayment: number;
  totalInterest: number;
  totalPayment: number;
  carName: string;
  onSuccess: () => void;
}

export function LoanLeadForm({
  isOpen,
  onClose,
  carId,
  carPrice,
  downPaymentPercent,
  downPaymentAmount,
  loanAmount,
  interestRate,
  termMonths,
  monthlyPayment,
  totalInterest,
  totalPayment,
  carName,
  onSuccess,
}: LoanLeadFormProps) {
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
    },
  });

  const onSubmit = (data: LeadFormData) => {
    setSubmitError(null);
    startTransition(async () => {
      const res = await saveLoanSimulationLeadAction({
        carId,
        customerName: data.fullName,
        phone: data.phone,
        email: data.email,
        carPrice,
        downPaymentPercent,
        downPaymentAmount,
        loanAmount,
        interestRate,
        termMonths,
        monthlyPayment,
        totalInterest,
        totalPayment,
      });

      if (res.success) {
        setSubmitSuccess(true);
        setTimeout(() => {
          onSuccess();
          reset();
          setSubmitSuccess(false);
          onClose();
        }, 2500);
      } else {
        setSubmitError(res.message || "Đã xảy ra lỗi khi gửi yêu cầu.");
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      {/* Modal Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-line bg-surface p-6 shadow-2xl backdrop-blur-md"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-subtle hover:text-foreground transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {submitSuccess ? (
          <div className="py-8 text-center space-y-4">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400"
            >
              <CheckCircle2 size={36} />
            </motion.div>
            <h4 className="font-display text-xl font-bold text-foreground">Gửi thông tin thành công!</h4>
            <p className="text-sm text-subtle px-4">
              Yêu cầu tính trả góp xe <strong>{carName}</strong> đã được gửi tới bộ phận tư vấn. Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất!
            </p>
          </div>
        ) : (
          <div>
            <h4 className="font-display text-lg font-bold text-foreground mb-2">
              Nhận bảng trả góp chi tiết
            </h4>
            <p className="text-xs text-subtle mb-6">
              Vui lòng để lại thông tin để showroom gửi bảng kê chi tiết lịch thanh toán, lãi suất ưu đãi và thủ tục hỗ trợ ngân hàng cho xe <strong>{carName}</strong>.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-subtle uppercase tracking-wider mb-1.5">
                  Họ và tên
                </label>
                <input
                  type="text"
                  placeholder="Nguyễn Văn A"
                  {...register("fullName")}
                  className={`w-full rounded-lg border bg-background px-4 py-2.5 text-sm text-foreground placeholder-subtle/50 focus:outline-none transition-colors ${
                    errors.fullName ? "border-rose-500" : "border-line focus:border-[#e31837]"
                  }`}
                />
                {errors.fullName && (
                  <p className="mt-1 text-xs text-rose-500 flex items-center gap-1 font-medium">
                    <AlertCircle size={12} />
                    {errors.fullName.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-subtle uppercase tracking-wider mb-1.5">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  placeholder="0901234567"
                  {...register("phone")}
                  className={`w-full rounded-lg border bg-background px-4 py-2.5 text-sm text-foreground placeholder-subtle/50 focus:outline-none transition-colors ${
                    errors.phone ? "border-rose-500" : "border-line focus:border-[#e31837]"
                  }`}
                />
                {errors.phone && (
                  <p className="mt-1 text-xs text-rose-500 flex items-center gap-1 font-medium">
                    <AlertCircle size={12} />
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-subtle uppercase tracking-wider mb-1.5">
                  Địa chỉ Email
                </label>
                <input
                  type="email"
                  placeholder="nguyenvana@gmail.com"
                  {...register("email")}
                  className={`w-full rounded-lg border bg-background px-4 py-2.5 text-sm text-foreground placeholder-subtle/50 focus:outline-none transition-colors ${
                    errors.email ? "border-rose-500" : "border-line focus:border-[#e31837]"
                  }`}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-rose-500 flex items-center gap-1 font-medium">
                    <AlertCircle size={12} />
                    {errors.email.message}
                  </p>
                )}
              </div>

              {submitError && (
                <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400 flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{submitError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="w-full mt-6 flex items-center justify-center gap-2 bg-[#e31837] hover:bg-[#c1132a] text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Đang gửi thông tin...
                  </>
                ) : (
                  "Đăng ký nhận bảng tính"
                )}
              </button>
            </form>
          </div>
        )}
      </motion.div>
    </div>
  );
}
