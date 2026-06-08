"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { User, Calendar, Bell, KeyRound, LogOut, Loader2 } from "lucide-react";
import { PublicHeader } from "@/components/public/PublicHeader";
import { Footer } from "@/components/public/Footer";
import { logoutUserAction } from "@/lib/actions/auth";

interface ProfileLayoutProps {
  children: React.ReactNode;
}

export default function ProfileLayout({ children }: ProfileLayoutProps) {
  const t = useTranslations("Profile");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; role: string; avatar?: string } | null>(null);
  const [mounted, setMounted] = useState(false);

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
  }, [pathname]);

  const handleLogout = async () => {
    await logoutUserAction();
    window.localStorage.removeItem("tq-auto-user");
    window.localStorage.removeItem("tq-auto-admin-auth");
    window.location.href = `/${locale}`;
  };

  if (!mounted) {
    return (
      <>
        <PublicHeader />
        <div className="flex min-h-[60vh] items-center justify-center bg-[#070b10]">
          <Loader2 className="h-8 w-8 animate-spin text-[#e31837]" />
        </div>
        <Footer />
      </>
    );
  }

  const menuItems = [
    {
      label: t("title"),
      href: "/profile",
      icon: User,
      active: pathname === "/profile",
    },
    {
      label: t("appointments"),
      href: "/profile/appointments",
      icon: Calendar,
      active: pathname === "/profile/appointments",
    },
    {
      label: t("notifications"),
      href: "/profile/notifications",
      icon: Bell,
      active: pathname === "/profile/notifications",
    },
    {
      label: t("changePassword"),
      href: "/profile?focus=change-password",
      icon: KeyRound,
      active: false, // updates parameters only
    },
  ];

  return (
    <>
      <PublicHeader />
      <div className="min-h-screen bg-[#070b10] text-[#f7f7f7] theme-page">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          
          {/* Header Banner */}
          <div className="relative mb-8 overflow-hidden rounded-lg border theme-border bg-[radial-gradient(ellipse_at_top_right,rgba(227,24,55,0.15),transparent_60%),linear-gradient(to_bottom_right,#11161d,#0b0f14)] p-6 md:p-8 shadow-xl">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-16 w-16 md:h-20 md:w-20 rounded-full object-cover border-2 border-[#e31837] shadow-lg shadow-[#e31837]/20"
                  />
                ) : (
                  <div className="flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#e31837] to-[#8c0e20] text-2xl font-bold text-white shadow-lg">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
                <div>
                  <h1 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight">
                    {user?.name || "Customer"}
                  </h1>
                  <p className="mt-1 text-sm text-[#a1a1aa] theme-subtle font-medium">
                    {user?.email || "customer@example.com"}
                  </p>
                </div>
              </div>
              <div className="flex">
                <span className="inline-flex items-center rounded-md bg-[#e31837]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#e31837] border border-[#e31837]/20">
                  {user?.role || t("title")}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Left Sidebar (Desktop) */}
            <aside className="hidden lg:block lg:w-64 shrink-0">
              <div className="sticky top-24 rounded-lg border theme-border bg-[#11161d] p-4 shadow-md">
                <nav className="space-y-1">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 rounded-md px-4 py-3 text-sm font-semibold tracking-wide transition-all duration-200 ${
                          item.active
                            ? "bg-[#e31837] text-white shadow-md shadow-[#e31837]/20"
                            : "text-[#a1a1aa] hover:bg-[#1a1f28] hover:text-[#f7f7f7]"
                        }`}
                      >
                        <Icon size={18} className={item.active ? "text-white" : "text-[#a1a1aa]"} />
                        {item.label}
                      </Link>
                    );
                  })}
                  
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-md px-4 py-3 text-left text-sm font-semibold tracking-wide text-red-400 hover:bg-red-500/10 transition-all duration-200 mt-4 border-t theme-border pt-4"
                  >
                    <LogOut size={18} />
                    {t("logout")}
                  </button>
                </nav>
              </div>
            </aside>

            {/* Top Navigation Tabs (Mobile & Tablet) */}
            <nav className="flex lg:hidden overflow-x-auto pb-3 gap-2 border-b theme-border scrollbar-none">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 whitespace-nowrap rounded-md px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                      item.active
                        ? "bg-[#e31837] text-white"
                        : "border theme-border bg-[#11161d] text-[#a1a1aa] hover:text-[#f7f7f7]"
                    }`}
                  >
                    <Icon size={14} />
                    {item.label}
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 whitespace-nowrap rounded-md border border-red-500/30 bg-[#11161d] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-red-400"
              >
                <LogOut size={14} />
                {t("logout")}
              </button>
            </nav>

            {/* Right Content Area */}
            <main className="flex-1 min-w-0">
              {children}
            </main>

          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
