import { cn } from "@/lib/utils";

const styles = {
  available: "bg-emerald-500/12 text-emerald-300 ring-emerald-500/30",
  reserved: "bg-amber-500/12 text-amber-300 ring-amber-500/30",
  sold: "bg-red-500/12 text-red-300 ring-red-500/30",
  neutral: "bg-white/8 text-zinc-300 ring-white/10",
  info: "bg-blue-500/12 text-blue-300 ring-blue-500/30",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof styles;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.05em] ring-1",
        styles[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
