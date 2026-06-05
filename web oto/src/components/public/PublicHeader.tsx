import Link from "next/link";
import { CarFront, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const nav = [
  { href: "/", label: "Trang chủ" },
  { href: "/cars", label: "Kho xe" },
  { href: "/cars/camry-2022", label: "Xe nổi bật" },
  { href: "/appointments", label: "Đặt lịch" },
  { href: "/contact", label: "Liên hệ" },
  { href: "/admin", label: "Admin", hidden: true },
];

export function PublicHeader() {
  return (
    <header className="theme-header sticky top-0 z-50 border-b text-[var(--foreground)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded bg-[#e31837] text-white">
            <CarFront size={22} />
          </span>
          <span>
            <span className="block font-display text-lg font-extrabold uppercase leading-5 tracking-normal">
              TQ Auto
            </span>
            <span className="theme-subtle text-xs font-semibold uppercase tracking-[0.12em]">
              Premium showroom
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {nav
            .filter((item) => !item.hidden)
            .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="theme-subtle border-b-2 border-transparent py-5 text-xs font-semibold uppercase tracking-[0.05em] transition hover:border-[#e31837] hover:text-[var(--foreground)]"
              >
                {item.label}
              </Link>
            ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/cars"
            className="flex h-10 w-10 items-center justify-center rounded-md border theme-border bg-[var(--surface)] theme-subtle transition hover:bg-[var(--muted)]"
            aria-label="Tìm kiếm xe"
          >
            <Search size={18} />
          </Link>
          <ThemeToggle />
          <Button href="/login" className="h-10">Đăng nhập</Button>
        </div>

        <button className="flex h-10 w-10 items-center justify-center rounded-md border theme-border bg-[var(--surface)] lg:hidden">
          <Menu size={20} />
        </button>
      </div>
    </header>
  );
}
