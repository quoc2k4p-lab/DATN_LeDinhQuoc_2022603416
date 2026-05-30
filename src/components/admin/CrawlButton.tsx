"use client";

import { useState, useTransition } from "react";
import { Globe, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { crawlCarsAction } from "@/lib/actions/carActions";

export function CrawlButton() {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const handleCrawl = () => {
    setStatus({ type: null, message: "" });

    startTransition(async () => {
      const result = await crawlCarsAction();
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
    <div className="flex flex-col items-end gap-3 sm:flex-row sm:items-center sm:gap-4">
      {status.type === "success" && (
        <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-xs font-semibold text-emerald-400">
          <CheckCircle2 size={14} className="shrink-0" />
          <span>{status.message}</span>
        </div>
      )}

      {status.type === "error" && (
        <div className="flex items-center gap-2 rounded-md bg-red-500/10 border border-red-500/20 px-4 py-2 text-xs font-semibold text-red-400">
          <AlertCircle size={14} className="shrink-0" />
          <span>{status.message}</span>
        </div>
      )}

      <Button
        onClick={handleCrawl}
        disabled={isPending}
        variant="secondary"
        className="border-white/10 hover:bg-white/5 text-zinc-300"
      >
        {isPending ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Đang cào dữ liệu...
          </>
        ) : (
          <>
            <Globe size={16} />
            Cào dữ liệu xe (Bonbanh)
          </>
        )}
      </Button>
    </div>
  );
}
