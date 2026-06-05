import Link from "next/link";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/public/FormField";
import { PublicHeader } from "@/components/public/PublicHeader";

export default function LoginPage() {
  return (
    <>
      <PublicHeader />
      <main className="theme-page flex min-h-[calc(100vh-64px)] items-center justify-center px-5 py-12">
        <form className="w-full max-w-md rounded-md border theme-surface p-7">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#e31837]">Account</p>
          <h1 className="font-display text-3xl font-extrabold">Đăng nhập</h1>
          <p className="mt-2 text-sm theme-subtle">Mock UI cho khách hàng, nhân viên và quản trị viên.</p>
          <div className="mt-7 space-y-5">
            <FormField label="Email" type="email" placeholder="admin@tqauto.vn" />
            <FormField label="Mật khẩu" type="password" placeholder="Nhập mật khẩu" />
          </div>
          <Button type="submit" className="mt-6 w-full"><LogIn size={18} /> Đăng nhập</Button>
          <p className="mt-5 text-center text-sm theme-subtle">
            Chưa có tài khoản? <Link href="/register" className="font-semibold text-[#e31837]">Đăng ký</Link>
          </p>
        </form>
      </main>
    </>
  );
}
