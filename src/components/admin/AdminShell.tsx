"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  CarFront,
  FolderTree,
  Gauge,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  Search,
  ShieldCheck,
  Users,
  MessageSquare,
  FileText,
  Loader2,
  Inbox,
} from "lucide-react";
import { getMeAction, logoutUserAction, UiUser } from "@/lib/actions/auth";
import { NotificationCenter } from "@/components/admin/NotificationCenter";

export function AdminShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<UiUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    checkSession();
  }, []);

  async function checkSession() {
    try {
      const res = await getMeAction();
      if (res.success && res.user) {
        if (res.user.role === "admin" || res.user.role === "staff") {
          setUser(res.user);
          
          // Also set local storage for compatibility with older parts of the app
          window.localStorage.setItem("tq-auto-user", JSON.stringify({
            id: res.user.id,
            name: res.user.name,
            email: res.user.email,
            phone: res.user.phone,
            role: res.user.role === "admin" ? "Quản trị viên" : "Nhân viên",
          }));
          window.localStorage.setItem("tq-auto-admin-auth", "true");
        } else {
          router.push("/");
        }
      } else {
        router.push("/login?callbackUrl=" + encodeURIComponent(pathname || "/admin"));
      }
    } catch (err) {
      console.error("Session check error:", err);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await logoutUserAction();
      window.localStorage.removeItem("tq-auto-user");
      window.localStorage.removeItem("tq-auto-admin-auth");
      router.push("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  }

  if (!mounted || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b1016] text-zinc-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#e31837]" />
          <p className="text-sm font-semibold text-zinc-400">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Filter links dynamically based on user role
  const links = user.role === "staff"
    ? [
        { href: "/staff/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/staff/cars", label: "Quản lý xe", icon: CarFront },
        { href: "/staff/customers", label: "Khách hàng", icon: Users },
        { href: "/staff/leads", label: "Yêu cầu tư vấn", icon: Inbox },
        { href: "/staff/appointments", label: "Lịch hẹn", icon: CalendarDays },
        { href: "/staff/posts", label: "Quản lý bài viết", icon: FileText },
        { href: "/staff/chat", label: "Realtime Chat", icon: MessageSquare },
        { href: "/staff/analytics", label: "Thống kê", icon: BarChart3 },
      ]
    : [
        { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
        { href: "/admin/cars", label: "Quản lý xe", icon: CarFront },
        { href: "/admin/customers", label: "Khách hàng", icon: Users },
        { href: "/admin/leads", label: "Yêu cầu tư vấn", icon: Inbox },
        { href: "/admin/appointments", label: "Lịch hẹn", icon: CalendarDays },
        { href: "/dashboard/posts", label: "Quản lý bài viết", icon: FileText },
        { href: "/admin/cars/new", label: "Thêm xe", icon: PlusCircle },
        { href: "/admin/analytics", label: "Thống kê", icon: BarChart3 },
        { href: "/admin/chat", label: "Realtime Chat", icon: MessageSquare },
        { href: "/admin/users", label: "Tài khoản", icon: ShieldCheck },
      ];

  return (
    <div className="min-h-screen bg-[#0b1016] text-zinc-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-white/10 bg-[#080c11] text-white lg:block">
        <div className="flex h-28 flex-col justify-center border-b border-white/10 px-7">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/5">
            <CarFront size={22} />
          </span>
          <div>
            <p className="font-display text-lg font-extrabold uppercase">TQ Auto</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {user.role === "admin" ? (
                <span className="inline-flex items-center rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-bold text-red-500 border border-red-500/30">
                  ADMIN
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-bold text-blue-500 border border-blue-500/30">
                  STAFF
                </span>
              )}
            </div>
          </div>
        </div>
        <nav className="space-y-2 px-4 py-6">
          {links.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-md px-4 py-3 text-sm font-semibold transition ${
                  isActive 
                    ? "bg-[#e31837] text-white" 
                    : "text-zinc-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#11141a]/95 backdrop-blur-xl">
          <div className="flex h-20 items-center justify-between px-5 sm:px-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#e31837]">
                {user.role === "admin" ? "Admin Control Center" : "Staff Control Center"}
              </p>
              <h1 className="font-display text-2xl font-bold text-white">{title}</h1>
            </div>
            
            {/* Header Toolbar */}
            <div className="flex items-center gap-4">
              <NotificationCenter />
              {/* User display */}
              <div className="hidden items-center gap-2 md:flex">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-300">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <div className="text-left">
                  <span className="block text-xs font-bold text-white leading-none">{user.name}</span>
                  <span className="block text-[9px] text-zinc-400 font-medium mt-0.5">{user.email}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
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
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-500 select-none">
              <Gauge size={18} />
              Bảng điều khiển trực tuyến
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
