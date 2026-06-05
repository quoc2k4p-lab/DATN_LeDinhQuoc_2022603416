"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  CarFront,
  FolderTree,
  Gauge,
  LayoutDashboard,
  LogIn,
  LogOut,
  PlusCircle,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

const ADMIN_EMAIL = "admin@tqauto.vn";
const ADMIN_PASSWORD = "admin123";
const ADMIN_AUTH_KEY = "tq-auto-admin-auth";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/cars", label: "Quản lý xe", icon: CarFront },
  { href: "/admin/categories", label: "Danh mục xe", icon: FolderTree },
  { href: "/admin/customers", label: "Khách hàng", icon: Users },
  { href: "/admin/appointments", label: "Lịch hẹn", icon: CalendarDays },
  { href: "/admin/cars/new", label: "Thêm xe", icon: PlusCircle },
  { href: "/admin/analytics", label: "Thống kê", icon: BarChart3 },
  { href: "/admin/accounts", label: "Tài khoản", icon: ShieldCheck },
];

function AdminLoginScreen({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState(ADMIN_PASSWORD);
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (email.trim() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      window.localStorage.setItem(ADMIN_AUTH_KEY, "true");
      setError("");
      onLogin();
      return;
    }

    setError("Email hoặc mật khẩu admin không đúng.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b1016] px-5 text-zinc-50">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-md border border-white/10 bg-[#151a22] p-7">
        <div className="mb-7 flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded bg-[#e31837] text-white">
            <ShieldCheck size={24} />
          </span>
          <div>
            <p className="font-display text-2xl font-extrabold">Đăng nhập Admin</p>
            <p className="text-sm text-zinc-400">Truy cập khu vực quản trị TQ Auto</p>
          </div>
        </div>

        <div className="rounded-md border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
          <p className="font-semibold">Tài khoản fake:</p>
          <p>Email: <span className="font-mono">{ADMIN_EMAIL}</span></p>
          <p>Mật khẩu: <span className="font-mono">{ADMIN_PASSWORD}</span></p>
        </div>

        <label className="mt-5 block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-zinc-500">Email</span>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-12 w-full rounded-md border border-white/10 bg-[#080c11] px-4 text-sm outline-none transition focus:border-[#e31837]"
          />
        </label>

        <label className="mt-5 block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-zinc-500">Mật khẩu</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-12 w-full rounded-md border border-white/10 bg-[#080c11] px-4 text-sm outline-none transition focus:border-[#e31837]"
          />
        </label>

        {error ? <p className="mt-4 text-sm font-semibold text-red-300">{error}</p> : null}

        <Button type="submit" className="mt-6 w-full">
          <LogIn size={18} />
          Đăng nhập
        </Button>
      </form>
    </div>
  );
}

export function AdminShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const [isAuthed, setIsAuthed] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.localStorage.getItem(ADMIN_AUTH_KEY) === "true";
  });

  function logout() {
    window.localStorage.removeItem(ADMIN_AUTH_KEY);
    setIsAuthed(false);
  }

  if (!isAuthed) {
    return <AdminLoginScreen onLogin={() => setIsAuthed(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#0b1016] text-zinc-50">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-white/10 bg-[#080c11] text-white lg:block">
        <div className="flex h-28 flex-col justify-center border-b border-white/10 px-7">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/5">
            <CarFront size={22} />
          </span>
          <div>
            <p className="font-display text-lg font-extrabold uppercase">TQ Auto</p>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">Admin</p>
          </div>
        </div>
        <nav className="space-y-2 px-4 py-6">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-4 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-[#e31837] hover:text-white"
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#11141a]/95 backdrop-blur-xl">
          <div className="flex h-20 items-center justify-between px-5 sm:px-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#e31837]">Control center</p>
              <h1 className="font-display text-2xl font-bold text-white">{title}</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden h-11 min-w-80 items-center gap-3 rounded-md border border-white/10 bg-white/5 px-4 text-sm text-zinc-500 md:flex">
                <Search size={18} />
                Tìm xe, khách hàng, lịch hẹn
              </div>
              <button
                type="button"
                onClick={logout}
                className="inline-flex h-11 items-center gap-2 rounded-md border border-white/10 px-4 text-sm font-semibold text-zinc-300 transition hover:border-red-500/40 hover:text-red-300"
              >
                <LogOut size={17} />
                Đăng xuất
              </button>
            </div>
          </div>
        </header>
        <main className="px-5 py-8 sm:px-8">
          <div className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="max-w-2xl text-sm leading-6 text-zinc-400">{subtitle}</p>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-500">
              <Gauge size={18} />
              Cập nhật mock data
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
