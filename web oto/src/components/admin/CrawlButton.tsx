"use client";

import { useState, useTransition } from "react";
import { Globe, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { crawlCarsAction } from "@/lib/actions/carActions";

export function CrawlButton() {
  const [isPending, startTransition] = useTransition();
  const [source, setSource] = useState<"bonbanh" | "oto" | "chotot">("bonbanh");
  const [brand, setBrand] = useState<string>("");
  const [condition, setCondition] = useState<"new" | "used">("new"); // Default to new as requested
  const [status, setStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const handleCrawl = () => {
    setStatus({ type: null, message: "" });

    startTransition(async () => {
      const result = await crawlCarsAction(source, brand || undefined, condition);
      if (result.success) {
        setStatus({
          type: "success",
          message: result.message || "Cào dữ liệu xe thành công!",
        });
        // Clear message after 4 seconds
        setTimeout(() => {
          setStatus({ type: null, message: "" });
        }, 4000);
      } else {
        setStatus({
          type: "error",
          message: result.message || "Cào dữ liệu thất bại.",
        });
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-3 sm:flex-row sm:items-center sm:gap-4 w-full sm:w-auto">
      {status.type === "success" && (
        <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-xs font-semibold text-emerald-400 w-full sm:w-auto">
          <CheckCircle2 size={14} className="shrink-0" />
          <span>{status.message}</span>
        </div>
      )}

      {status.type === "error" && (
        <div className="flex items-center gap-2 rounded-md bg-red-500/10 border border-red-500/20 px-4 py-2 text-xs font-semibold text-red-400 w-full sm:w-auto">
          <AlertCircle size={14} className="shrink-0" />
          <span>{status.message}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
        {/* Source selector */}
        <select
          value={source}
          onChange={(e) => setSource(e.target.value as "bonbanh" | "oto" | "chotot")}
          disabled={isPending}
          className="rounded-md border border-white/10 bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-300 outline-none focus:border-white/20 transition-all cursor-pointer h-[38px]"
        >
          <option value="bonbanh">Bonbanh.com</option>
          <option value="oto">Oto.com.vn</option>
          <option value="chotot">Chợ Tốt (xe.chotot.com)</option>
        </select>

        {/* Brand selector */}
        <select
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          disabled={isPending}
          className="rounded-md border border-white/10 bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-300 outline-none focus:border-white/20 transition-all cursor-pointer h-[38px]"
        >
          <option value="">Tất cả hãng xe</option>
          <option value="vinfast">VinFast</option>
          <option value="bmw">BMW</option>
          <option value="toyota">Toyota</option>
          <option value="mercedes-benz">Mercedes-Benz</option>
          <option value="hyundai">Hyundai</option>
          <option value="kia">Kia</option>
          <option value="honda">Honda</option>
          <option value="mazda">Mazda</option>
          <option value="ford">Ford</option>
        </select>

        {/* Condition selector */}
        <select
          value={condition}
          onChange={(e) => setCondition(e.target.value as "new" | "used")}
          disabled={isPending}
          className="rounded-md border border-white/10 bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-300 outline-none focus:border-white/20 transition-all cursor-pointer h-[38px]"
        >
          <option value="new">Xe mới hoàn toàn</option>
          <option value="used">Xe đã qua sử dụng</option>
        </select>

        <Button
          onClick={handleCrawl}
          disabled={isPending}
          variant="secondary"
          className="border-white/10 hover:bg-white/5 text-zinc-300 h-[38px]"
        >
          {isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Đang cào dữ liệu...
            </>
          ) : (
            <>
              <Globe size={16} />
              Cào dữ liệu
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
