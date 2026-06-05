import Link from "next/link";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/public/FormField";
import { PublicHeader } from "@/components/public/PublicHeader";

export default function RegisterPage() {
  return (
    <>
      <PublicHeader />
      <main className="theme-page flex min-h-[calc(100vh-64px)] items-center justify-center px-5 py-12">
        <form className="w-full max-w-2xl rounded-md border theme-surface p-7">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#e31837]">New account</p>
          <h1 className="font-display text-3xl font-extrabold">Đăng ký tài khoản</h1>
          <p className="mt-2 text-sm theme-subtle">Tạo tài khoản khách hàng để cá nhân hóa lịch hẹn và yêu cầu tư vấn.</p>
          <div className="mt-7 grid gap-5 md:grid-cols-2">
            <FormField label="Họ tên" placeholder="Nguyễn Văn A" />
            <FormField label="Số điện thoại" placeholder="0909 888 668" />
            <FormField label="Email" type="email" placeholder="email@example.com" />
            <FormField label="Mật khẩu" type="password" placeholder="Tối thiểu 8 ký tự" />
          </div>
          <Button type="submit" className="mt-6 w-full"><UserPlus size={18} /> Tạo tài khoản</Button>
          <p className="mt-5 text-center text-sm theme-subtle">
            Đã có tài khoản? <Link href="/login" className="font-semibold text-[#e31837]">Đăng nhập</Link>
          </p>
        </form>
      </main>
    </>
  );
}
