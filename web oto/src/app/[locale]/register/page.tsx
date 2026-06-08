"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { UserPlus, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/public/FormField";
import { PublicHeader } from "@/components/public/PublicHeader";
import { registerUserAction } from "@/lib/actions/auth";

export default function RegisterPage() {
  const router = useRouter();
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear validation error on type
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleClientValidation = () => {
    const clientErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      clientErrors.fullName = "Họ tên là bắt buộc";
    } else if (formData.fullName.trim().length < 2) {
      clientErrors.fullName = "Họ tên phải có ít nhất 2 ký tự";
    }

    if (!formData.email.trim()) {
      clientErrors.email = "Email là bắt buộc";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        clientErrors.email = "Email không đúng định dạng";
      }
    }

    const cleanedPhone = formData.phone.replace(/[\s.-]/g, "");
    if (!formData.phone.trim()) {
      clientErrors.phone = "Số điện thoại là bắt buộc";
    } else {
      const phoneRegex = /^(0|\+84)[35789][0-9]{8}$/;
      if (!phoneRegex.test(cleanedPhone)) {
        clientErrors.phone = "Số điện thoại không đúng định dạng (ví dụ: 0909888668)";
      }
    }

    if (!formData.password) {
      clientErrors.password = "Mật khẩu là bắt buộc";
    } else if (formData.password.length < 6) {
      clientErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    if (!formData.confirmPassword) {
      clientErrors.confirmPassword = "Xác nhận mật khẩu là bắt buộc";
    } else if (formData.password !== formData.confirmPassword) {
      clientErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    return clientErrors;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus({ type: null, message: "" });

    // Validate client-side first
    const clientErrors = handleClientValidation();
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      setStatus({
        type: "error",
        message: "Thông tin đăng ký không hợp lệ. Vui lòng kiểm tra lại.",
      });
      return;
    }

    setErrors({});

    startTransition(async () => {
      const submissionData = new FormData();
      submissionData.append("fullName", formData.fullName);
      submissionData.append("email", formData.email);
      submissionData.append("phone", formData.phone);
      submissionData.append("password", formData.password);
      submissionData.append("confirmPassword", formData.confirmPassword);

      const result = await registerUserAction(submissionData);

      if (result.success) {
        setStatus({
          type: "success",
          message: result.message || "Đăng ký thành công!",
        });
        
        // Save compatibility user details
        const mappedUser = {
          name: formData.fullName,
          email: formData.email,
          phone: formData.phone.replace(/[\s.-]/g, ""),
          role: "Khách hàng",
        };
        window.localStorage.setItem("tq-auto-user", JSON.stringify(mappedUser));

        // Clear password fields
        setFormData((prev) => ({
          ...prev,
          password: "",
          confirmPassword: "",
        }));
        
        // Redirect to homepage after 2 seconds
        setTimeout(() => {
          router.push(`/${locale}`);
          window.location.href = `/${locale}`;
        }, 2000);
      } else {
        setStatus({
          type: "error",
          message: result.message || "Đăng ký thất bại",
        });
        if (result.errors) {
          setErrors(result.errors);
        }
      }
    });
  };

  return (
    <>
      <PublicHeader />
      <main className="theme-page flex min-h-[calc(100vh-64px)] items-center justify-center px-5 py-12">
        <form onSubmit={handleSubmit} className="w-full max-w-2xl rounded-md border theme-surface p-7 shadow-sm">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#e31837]">New account</p>
          <h1 className="font-display text-3xl font-extrabold">Đăng ký tài khoản</h1>
          <p className="mt-2 text-sm theme-subtle">Tạo tài khoản khách hàng để cá nhân hóa lịch hẹn và yêu cầu tư vấn.</p>
          
          {status.type === "success" && (
            <div className="mt-6 flex items-start gap-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 p-4 text-emerald-500">
              <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Thành công</p>
                <p className="text-sm mt-1 text-emerald-500/90">{status.message}</p>
              </div>
            </div>
          )}

          {status.type === "error" && (
            <div className="mt-6 flex items-start gap-3 rounded-md bg-red-500/10 border border-red-500/20 p-4 text-red-500">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Đăng ký thất bại</p>
                <p className="text-sm mt-1 text-red-500/90">{status.message}</p>
              </div>
            </div>
          )}

          <div className="mt-7 grid gap-5 md:grid-cols-2">
            <FormField 
              label="Họ tên" 
              name="fullName"
              placeholder="Nguyễn Văn A" 
              value={formData.fullName}
              onChange={handleChange}
              error={errors.fullName}
              required
            />
            <FormField 
              label="Số điện thoại" 
              name="phone"
              placeholder="0909 888 668" 
              value={formData.phone}
              onChange={handleChange}
              error={errors.phone}
              required
            />
            <FormField 
              label="Email" 
              name="email"
              type="email" 
              placeholder="email@example.com" 
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              required
            />
            <div className="hidden md:block"></div>
            <FormField 
              label="Mật khẩu" 
              name="password"
              type="password" 
              placeholder="Tối thiểu 6 ký tự" 
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              required
            />
            <FormField 
              label="Xác nhận mật khẩu" 
              name="confirmPassword"
              type="password" 
              placeholder="Nhập lại mật khẩu" 
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              required
            />
          </div>
          
          <Button 
            type="submit" 
            className="mt-8 w-full"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Đang xử lý...
              </>
            ) : (
              <>
                <UserPlus size={18} /> Tạo tài khoản
              </>
            )}
          </Button>
          <p className="mt-5 text-center text-sm theme-subtle">
            Đã có tài khoản? <Link href="/login" className="font-semibold text-[#e31837]">Đăng nhập</Link>
          </p>
        </form>
      </main>
    </>
  );
}
