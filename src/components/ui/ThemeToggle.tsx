"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "dark" | "light";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    setMounted(true);
    const savedTheme = (window.localStorage.getItem("theme") as Theme | null) ?? "dark";
    setTheme(savedTheme);
  }, []);

  useEffect(() => {
    if (mounted) {
      document.documentElement.dataset.theme = theme;
      window.localStorage.setItem("theme", theme);
    }
  }, [theme, mounted]);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Đổi chế độ sáng tối"
      className="flex h-10 w-10 items-center justify-center rounded-md border theme-border bg-[var(--surface)] text-[var(--foreground)] transition hover:bg-[var(--muted)]"
    >
      {!mounted ? (
        <span className="h-[18px] w-[18px]" />
      ) : theme === "dark" ? (
        <Sun size={18} />
      ) : (
        <Moon size={18} />
      )}
    </button>
  );
}
