"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { CarFront, Menu, Search, LogOut } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function PublicHeader() {
  const t = useTranslations("Navbar");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; role: string; avatar?: string } | null>(null);

  useEffect(() => {
    setMounted(true);
    const stored = window.localStorage.getItem("tq-auto-user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (err) {
        console.error("Error parsing user:", err);
      }
    }
  }, []);

  const handleLogout = () => {
    window.localStorage.removeItem("tq-auto-user");
    window.localStorage.removeItem("tq-auto-admin-auth");
    setUser(null);
    window.location.href = `/${locale}`;
  };

  const handleLocaleChange = (newLocale: "vi" | "en") => {
    router.replace(pathname, { locale: newLocale });
  };

  const nav = [
    { href: `/${locale}`, label: t("home") },
    { href: `/${locale}/cars`, label: t("inventory") },
    { href: `/${locale}/cars/camry-2022`, label: t("featured") },
    { href: `/${locale}/news`, label: t("news") },
    { href: `/${locale}/appointments`, label: t("book") },
    { href: `/${locale}/contact`, label: t("contact") },
  ];

  return (
    <header className="theme-header sticky top-0 z-50 border-b text-[var(--foreground)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href={`/${locale}`} className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded bg-[#e31837] text-white">
            <CarFront size={22} />
          </span>
          <span>
            <span className="block font-display text-lg font-extrabold uppercase leading-5 tracking-normal">
              TQ Auto
            </span>
            <span className="theme-subtle text-[10px] font-semibold uppercase tracking-[0.12em]">
              Premium showroom
            </span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-8 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="theme-subtle border-b-2 border-transparent py-5 text-xs font-semibold uppercase tracking-[0.05em] transition hover:border-[#e31837] hover:text-[var(--foreground)]"
            >
              {item.label}
            </Link>
          ))}
          {mounted && user && (user.role === "Quản trị viên" || user.role === "Nhân viên") && (
            <Link
              href="/admin"
              className="text-[#e31837] border-b-2 border-transparent py-5 text-xs font-bold uppercase tracking-[0.05em] transition hover:border-[#e31837]"
            >
              {t("admin")}
            </Link>
          )}
        </nav>

        {/* Toolbar */}
        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />



          {mounted && user ? (
            <div className="flex items-center gap-3 border-l theme-border pl-3">
              <Link 
                href={user.role === "Khách hàng" ? `/${locale}/profile` : "/admin"} 
                className="flex items-center gap-2 hover:opacity-85 transition group text-left"
              >
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name} 
                    className="h-8 w-8 rounded-full object-cover border border-[#e31837]/30 group-hover:border-[#e31837]" 
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e31837]/15 border border-[#e31837]/30 text-xs font-bold text-[#e31837] group-hover:bg-[#e31837] group-hover:text-white transition">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="text-left hidden xl:block leading-tight">
                  <span className="block text-xs font-bold text-[var(--foreground)] group-hover:text-[#e31837] transition truncate max-w-[120px]">{user.name}</span>
                  <span className="block text-[10px] uppercase font-extrabold tracking-wider text-theme-subtle group-hover:text-white/80 transition">{user.role}</span>
                </div>
              </Link>
              {(user.role === "Quản trị viên" || user.role === "Nhân viên") && (
                <Link href="/admin" className="text-xs font-bold uppercase tracking-wider text-[#e31837] border border-[#e31837]/35 rounded px-2.5 py-1.5 hover:bg-[#e31837] hover:text-white transition xl:hidden">
                  Admin
                </Link>
              )}
              <button 
                onClick={handleLogout} 
                className="flex h-10 w-10 items-center justify-center rounded-md border theme-border bg-[var(--surface)] text-[var(--foreground)] transition hover:bg-red-500/10 hover:text-red-500"
                title="Đăng xuất"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Button href={`/${locale}/login`} className="h-10">{t("login")}</Button>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="flex items-center gap-2 lg:hidden">
          {mounted && user && (
            <Link 
              href={user.role === "Khách hàng" ? `/${locale}/profile` : "/admin"} 
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e31837]/30 overflow-hidden bg-[var(--surface)] hover:border-[#e31837]"
            >
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-[#e31837]">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              )}
            </Link>
          )}
          <button className="flex h-10 w-10 items-center justify-center rounded-md border theme-border bg-[var(--surface)]">
            <Menu size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
