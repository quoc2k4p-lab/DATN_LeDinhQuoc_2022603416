import Link from "next/link";
import { cn } from "@/lib/utils";

const variants = {
  primary: "bg-[#e31837] text-white hover:bg-[#c2142d]",
  secondary: "border theme-border bg-transparent text-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)]",
  ghost: "bg-transparent text-[var(--foreground)] hover:bg-[var(--muted)]",
};

type ButtonProps = {
  children: React.ReactNode;
  href?: string;
  variant?: keyof typeof variants;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
};

export function Button({
  children,
  href,
  variant = "primary",
  className,
  type = "button",
  disabled = false,
  onClick,
}: ButtonProps) {
  const classes = cn(
    "inline-flex h-11 items-center justify-center gap-2 rounded-md px-5 text-sm font-bold uppercase tracking-[0.05em] transition",
    variants[variant],
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={cn(classes, disabled && "opacity-50 cursor-not-allowed")}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
