"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { 
  CarFront, Menu, Search, LogOut, X, 
  Home, ArrowRightLeft, CreditCard, FileText, CalendarDays, Mail, ShieldCheck 
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { getCompareList } from "@/components/compare/CompareBar";

export function PublicHeader() {
  const t = useTranslations("Navbar");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; role: string; avatar?: string } | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [compareCount, setCompareCount] = useState(0);

  useEffect(() => {
    setMounted(true);
    setCompareCount(getCompareList().length);
    
    const handleUpdate = () => {
      setCompareCount(getCompareList().length);
    };

    window.addEventListener("compare-store-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    const stored = window.localStorage.getItem("tq-auto-user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (err) {
        console.error("Error parsing user:", err);
      }
    }

    return () => {
      window.removeEventListener("compare-store-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
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

  const compareLabel = locale === "en" ? "Compare" : "So sánh";
  const loanLabel = locale === "en" ? "Finance" : "Trả góp";

  const nav = [
    { href: `/${locale}`, label: t("home"), icon: Home },
    { href: `/${locale}/cars`, label: t("inventory"), icon: CarFront },
    { href: `/${locale}/compare`, label: compareLabel, icon: ArrowRightLeft, isCompare: true },
    { href: `/${locale}/loan-calculator`, label: loanLabel, icon: CreditCard },
    { href: `/${locale}/news`, label: t("news"), icon: FileText },
    { href: `/${locale}/appointments`, label: t("book"), icon: CalendarDays },
    { href: `/${locale}/contact`, label: t("contact"), icon: Mail },
  ];

  return (
    <>
      <header className="theme-header sticky top-0 z-50 border-b text-[var(--foreground)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href={`/${locale}`} className="flex items-center gap-3">
          <span className="flex h-16 w-16 items-center justify-center overflow-hidden">
            <img src="/logo_tqauto.png" alt="TQ Auto Logo" className="h-full w-full object-contain drop-shadow" />
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
          {nav.map((item) => {
            const isCompare = item.href.includes("/compare");
            return (
              <Link
                key={item.href}
                href={item.href}
                className="theme-subtle border-b-2 border-transparent py-5 text-xs font-semibold uppercase tracking-[0.05em] transition hover:border-[#e31837] hover:text-[var(--foreground)] flex items-center gap-1.5"
              >
                <span>{item.label}</span>
                {isCompare && compareCount > 0 && (
                  <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#e31837] text-[9px] font-extrabold text-white animate-pulse">
                    {compareCount}
                  </span>
                )}
              </Link>
            );
          })}
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
                href={`/${locale}/profile`} 
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
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            className="flex h-10 w-10 items-center justify-center rounded-md border theme-border bg-[var(--surface)] hover:bg-[var(--muted)] text-[var(--foreground)] transition"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </header>

      {/* Mobile Nav Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[10000] lg:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Drawer content */}
          <aside className="fixed inset-y-0 right-0 flex w-72 flex-col bg-[#080c11] text-white shadow-2xl border-l border-white/10 transition-transform duration-300">
            <div className="flex h-20 items-center justify-between border-b border-white/10 px-6 bg-[#0d1016]">
              <Link href={`/${locale}`} className="flex items-center gap-3" onClick={() => setIsMobileMenuOpen(false)}>
                <span className="flex h-11 w-11 items-center justify-center overflow-hidden shrink-0">
                  <img src="/logo_tqauto.png" alt="TQ Auto Logo" className="h-full w-full object-contain drop-shadow" />
                </span>
                <div>
                  <span className="block font-display text-sm font-extrabold uppercase leading-tight">
                    TQ Auto
                  </span>
                  <span className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-zinc-400 mt-0.5 block">
                    Showroom
                  </span>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/5 text-zinc-400 hover:text-white cursor-pointer"
                aria-label="Close sidebar"
              >
                <X size={18} />
              </button>
            </div>
            
            <nav className="flex-1 overflow-y-auto space-y-1.5 px-4 py-6">
              {nav.map((item) => {
                const unlocalizedPath = item.href.replace(`/${locale}`, "") || "/";
                const isActive = pathname === unlocalizedPath || (unlocalizedPath !== "/" && pathname?.startsWith(unlocalizedPath));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-md px-4 py-3 text-sm font-semibold transition ${
                      isActive 
                        ? "bg-[#e31837] text-white" 
                        : "text-zinc-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <item.icon size={18} />
                    <span>{item.label}</span>
                    {item.isCompare && compareCount > 0 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#e31837] text-[10px] font-extrabold text-white ml-auto">
                        {compareCount}
                      </span>
                    )}
                  </Link>
                );
              })}
              {mounted && user && (user.role === "Quản trị viên" || user.role === "Nhân viên") && (
                <Link
                  href="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-md px-4 py-3 text-sm font-bold text-[#e31837] hover:bg-white/5 transition"
                >
                  <ShieldCheck size={18} />
                  <span>Trang quản trị</span>
                </Link>
              )}
            </nav>
            
            {/* Drawer Footer */}
            <div className="border-t border-white/10 p-4 space-y-4 bg-[#0d1016]">
              {/* Theme Toggle Row */}
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-zinc-400">
                <span>Chế độ giao diện</span>
                <ThemeToggle />
              </div>

              {mounted && user ? (
                <div className="space-y-3 pt-2">
                  {/* User Info Row */}
                  <Link 
                    href={`/${locale}/profile`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 hover:opacity-85 transition group text-left"
                  >
                    {user.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={user.name} 
                        className="h-9 w-9 rounded-full object-cover border border-[#e31837]/30 group-hover:border-[#e31837]" 
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e31837]/15 border border-[#e31837]/30 text-xs font-bold text-[#e31837] group-hover:bg-[#e31837] group-hover:text-white transition">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="block text-xs font-bold text-white group-hover:text-[#e31837] transition truncate">{user.name}</span>
                      <span className="block text-[10px] uppercase font-extrabold tracking-wider text-zinc-400 mt-0.5">{user.role}</span>
                    </div>
                  </Link>

                  {/* Action Buttons Row */}
                  <div className="flex gap-2">
                    <Link 
                      href={`/${locale}/profile`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex-1 text-center text-xs font-bold uppercase tracking-wider bg-zinc-800/60 border border-white/10 rounded-md py-2.5 hover:bg-zinc-700 transition text-white"
                    >
                      Hồ sơ cá nhân
                    </Link>
                    <button 
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleLogout();
                      }} 
                      className="flex items-center justify-center gap-1.5 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-red-400 hover:bg-red-500 hover:text-white transition cursor-pointer"
                      title="Đăng xuất"
                    >
                      <LogOut size={14} />
                      Đăng xuất
                    </button>
                  </div>
                </div>
              ) : (
                <Button 
                  href={`/${locale}/login`} 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className="w-full justify-center h-10 text-xs font-bold uppercase tracking-wider"
                >
                  Đăng nhập
                </Button>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
