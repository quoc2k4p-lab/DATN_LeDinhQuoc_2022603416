"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { LogIn, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/public/FormField";
import { PublicHeader } from "@/components/public/PublicHeader";
import { loginUserAction } from "@/lib/actions/auth";

export default function LoginPage() {
  const router = useRouter();
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus({ type: null, message: "" });
    setErrors({});

    const clientErrors: Record<string, string> = {};
    if (!formData.email.trim()) {
      clientErrors.email = "Email là bắt buộc";
    }
    if (!formData.password) {
      clientErrors.password = "Mật khẩu là bắt buộc";
    }

    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      setStatus({
        type: "error",
        message: "Vui lòng nhập đầy đủ thông tin",
      });
      return;
    }

    startTransition(async () => {
      const submissionData = new FormData();
      submissionData.append("email", formData.email);
      submissionData.append("password", formData.password);

      const result = await loginUserAction(submissionData);

      if (result.success && result.user) {
        setStatus({
          type: "success",
          message: result.message || "Đăng nhập thành công!",
        });

        // Store auth details with compatibility mapping
        const mappedUser = {
          ...result.user,
          role: result.user.role === "admin" 
            ? "Quản trị viên" 
            : result.user.role === "staff" 
              ? "Nhân viên" 
              : "Khách hàng",
        };
        window.localStorage.setItem("tq-auto-user", JSON.stringify(mappedUser));

        if (result.user.role === "admin" || result.user.role === "staff") {
          window.localStorage.setItem("tq-auto-admin-auth", "true");
        }

        // Redirect based on role
        setTimeout(() => {
          let target = `/${locale}`;
          if (result.user?.role === "admin") {
            target = "/admin/dashboard";
          } else if (result.user?.role === "staff") {
            target = "/staff/dashboard";
          } else {
            target = `/${locale}`;
          }
          router.push(target);
          // Force page refresh to update auth state across components
          window.location.href = target;
        }, 1500);
      } else {
        setStatus({
          type: "error",
          message: result.message || "Đăng nhập thất bại",
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
        <form onSubmit={handleSubmit} className="w-full max-w-md rounded-md border theme-surface p-7 shadow-sm">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#e31837]">Account</p>
          <h1 className="font-display text-3xl font-extrabold">Đăng nhập</h1>
          <p className="mt-2 text-sm theme-subtle">Truy cập tài khoản khách hàng, nhân viên và quản trị viên.</p>

          {status.type === "success" && (
            <div className="mt-6 flex items-start gap-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 p-4 text-emerald-500">
              <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Đăng nhập thành công</p>
                <p className="text-sm mt-1 text-emerald-500/90">{status.message}</p>
              </div>
            </div>
          )}

          {status.type === "error" && (
            <div className="mt-6 flex items-start gap-3 rounded-md bg-red-500/10 border border-red-500/20 p-4 text-red-500">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Đăng nhập thất bại</p>
                <p className="text-sm mt-1 text-red-500/90">{status.message}</p>
              </div>
            </div>
          )}

          <div className="mt-7 space-y-5">
            <FormField 
              label="Email" 
              name="email"
              type="email" 
              placeholder="admin@tqauto.vn hoặc email của bạn" 
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              required
            />
            <FormField 
              label="Mật khẩu" 
              name="password"
              type="password" 
              placeholder="Nhập mật khẩu" 
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              required
            />
          </div>
          <Button 
            type="submit" 
            className="mt-6 w-full"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Đang kiểm tra...
              </>
            ) : (
              <>
                <LogIn size={18} /> Đăng nhập
              </>
            )}
          </Button>
          <p className="mt-5 text-center text-sm theme-subtle">
            Chưa có tài khoản? <Link href="/register" className="font-semibold text-[#e31837]">Đăng ký</Link>
          </p>
        </form>
      </main>
    </>
  );
}
