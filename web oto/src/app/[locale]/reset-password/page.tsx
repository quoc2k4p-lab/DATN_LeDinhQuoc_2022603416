"use client";

import Link from "next/link";
import { Suspense, useState, useTransition } from "react";
import { useLocale } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import { Lock, Loader2, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/public/FormField";
import { PublicHeader } from "@/components/public/PublicHeader";
import { Footer } from "@/components/public/Footer";
import { resetPasswordAction } from "@/lib/actions/auth";

function ResetPasswordForm() {
  const locale = useLocale();
  const isVi = locale === "vi";
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [status, setStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setStatus({ type: null, message: "" });

    const clientErrors: Record<string, string> = {};
    if (!password) {
      clientErrors.password = isVi ? "Mật khẩu là bắt buộc" : "Password is required";
    } else if (password.length < 6) {
      clientErrors.password = isVi ? "Mật khẩu phải có ít nhất 6 ký tự" : "Password must be at least 6 characters";
    }

    if (!confirmPassword) {
      clientErrors.confirmPassword = isVi ? "Xác nhận mật khẩu là bắt buộc" : "Confirm password is required";
    } else if (password !== confirmPassword) {
      clientErrors.confirmPassword = isVi ? "Mật khẩu xác nhận không khớp" : "Passwords do not match";
    }

    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("token", token);
      formData.append("password", password);
      formData.append("confirmPassword", confirmPassword);

      const result = await resetPasswordAction(formData);
      if (result.success) {
        setStatus({
          type: "success",
          message: result.message || (isVi ? "Đặt lại mật khẩu thành công!" : "Password reset successful!"),
        });
        setTimeout(() => {
          router.push(`/${locale}/login`);
        }, 2000);
      } else {
        setStatus({
          type: "error",
          message: result.message || (isVi ? "Đặt lại mật khẩu thất bại." : "Password reset failed."),
        });
      }
    });
  };

  if (!token) {
    return (
      <div className="text-center py-6">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">
          {isVi ? "Yêu cầu không hợp lệ" : "Invalid Request"}
        </h2>
        <p className="text-sm theme-subtle mb-5">
          {isVi 
            ? "Mã token đặt lại mật khẩu bị thiếu hoặc không đúng cấu trúc." 
            : "The password reset token is missing or malformed."}
        </p>
        <Button href={`/${locale}/forgot-password`}>
          {isVi ? "Yêu cầu khôi phục mới" : "Request new recovery"}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md rounded-md border theme-surface p-7 shadow-sm">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#e31837]">
        {isVi ? "Đặt lại" : "Reset"}
      </p>
      <h1 className="font-display text-3xl font-extrabold flex items-center gap-2">
        <Lock className="text-[#e31837]" size={28} />
        {isVi ? "Mật khẩu mới" : "New Password"}
      </h1>
      <p className="mt-2 text-sm theme-subtle">
        {isVi 
          ? "Thiết lập mật khẩu mới cho tài khoản của bạn để hoàn tất việc khôi phục." 
          : "Setup a new password for your account to complete recovery."}
      </p>

      {status.type === "success" && (
        <div className="mt-6 flex items-start gap-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 p-4 text-emerald-500">
          <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold">{isVi ? "Đặt lại thành công" : "Reset successful"}</p>
            <p className="text-sm mt-1 text-emerald-500/90">{status.message}</p>
          </div>
        </div>
      )}

      {status.type === "error" && (
        <div className="mt-6 flex items-start gap-3 rounded-md bg-red-500/10 border border-red-500/20 p-4 text-red-500">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold">{isVi ? "Lỗi thực hiện" : "Execution error"}</p>
            <p className="text-sm mt-1 text-red-500/90">{status.message}</p>
          </div>
        </div>
      )}

      <div className="mt-7 space-y-5">
        <FormField
          label={isVi ? "Mật khẩu mới" : "New Password"}
          name="password"
          type="password"
          placeholder={isVi ? "Tối thiểu 6 ký tự" : "At least 6 characters"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          required
        />
        
        <FormField
          label={isVi ? "Xác nhận mật khẩu mới" : "Confirm New Password"}
          name="confirmPassword"
          type="password"
          placeholder={isVi ? "Nhập lại mật khẩu mới" : "Re-enter new password"}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
          required
        />
      </div>

      <Button type="submit" className="mt-6 w-full font-bold" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            {isVi ? "Đang cập nhật..." : "Updating..."}
          </>
        ) : (
          isVi ? "Đặt lại mật khẩu" : "Reset password"
        )}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <>
      <PublicHeader />
      <main className="theme-page flex min-h-[calc(100vh-64px-180px)] items-center justify-center px-5 py-12">
        <Suspense fallback={
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#e31837]" />
            <p className="text-sm font-semibold text-zinc-400">Loading token details...</p>
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
