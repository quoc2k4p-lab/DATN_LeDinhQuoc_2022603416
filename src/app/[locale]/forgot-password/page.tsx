"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useLocale } from "next-intl";
import { KeyRound, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/public/FormField";
import { PublicHeader } from "@/components/public/PublicHeader";
import { Footer } from "@/components/public/Footer";
import { forgotPasswordAction } from "@/lib/actions/auth";

export default function ForgotPasswordPage() {
  const locale = useLocale();
  const isVi = locale === "vi";

  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");
  const [status, setStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");
    setStatus({ type: null, message: "" });

    if (!email.trim()) {
      setErrorMsg(isVi ? "Email là bắt buộc" : "Email is required");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("email", email.trim());

      const result = await forgotPasswordAction(formData);
      if (result.success) {
        setStatus({
          type: "success",
          message: result.message || (isVi ? "Yêu cầu khôi phục thành công." : "Reset request successful."),
        });
        setEmail("");
      } else {
        setStatus({
          type: "error",
          message: result.message || (isVi ? "Yêu cầu khôi phục thất bại." : "Reset request failed."),
        });
      }
    });
  };

  return (
    <>
      <PublicHeader />
      <main className="theme-page flex min-h-[calc(100vh-64px-180px)] items-center justify-center px-5 py-12">
        <form onSubmit={handleSubmit} className="w-full max-w-md rounded-md border theme-surface p-7 shadow-sm">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#e31837]">
            {isVi ? "Khôi phục" : "Recovery"}
          </p>
          <h1 className="font-display text-3xl font-extrabold flex items-center gap-2">
            <KeyRound className="text-[#e31837]" size={28} />
            {isVi ? "Quên mật khẩu" : "Forgot Password"}
          </h1>
          <p className="mt-2 text-sm theme-subtle">
            {isVi 
              ? "Nhập email đã đăng ký tài khoản của bạn để nhận liên kết đặt lại mật khẩu mới." 
              : "Enter your registered email below to receive a password reset link."}
          </p>

          {status.type === "success" && (
            <div className="mt-6 flex items-start gap-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 p-4 text-emerald-500">
              <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">{isVi ? "Gửi yêu cầu thành công" : "Request sent successfully"}</p>
                <p className="text-sm mt-1 text-emerald-500/90">{status.message}</p>
              </div>
            </div>
          )}

          {status.type === "error" && (
            <div className="mt-6 flex items-start gap-3 rounded-md bg-red-500/10 border border-red-500/20 p-4 text-red-500">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">{isVi ? "Lỗi yêu cầu" : "Request error"}</p>
                <p className="text-sm mt-1 text-red-500/90">{status.message}</p>
              </div>
            </div>
          )}

          <div className="mt-7 space-y-5">
            <FormField
              label="Email"
              name="email"
              type="email"
              placeholder={isVi ? "Nhập email của bạn" : "Enter your email"}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrorMsg("");
              }}
              error={errorMsg}
              required
            />
          </div>

          <Button type="submit" className="mt-6 w-full font-bold" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                {isVi ? "Đang xử lý..." : "Processing..."}
              </>
            ) : (
              isVi ? "Gửi liên kết đặt lại" : "Send reset link"
            )}
          </Button>

          <p className="mt-5 text-center text-sm theme-subtle">
            <Link href={`/${locale}/login`} className="inline-flex items-center gap-1.5 font-semibold text-[#e31837] hover:underline">
              <ArrowLeft size={14} />
              {isVi ? "Quay lại đăng nhập" : "Back to login"}
            </Link>
          </p>
        </form>
      </main>
      <Footer />
    </>
  );
}
