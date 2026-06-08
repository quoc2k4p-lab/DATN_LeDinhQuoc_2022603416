"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Edit3, EyeOff, Eye, Trash2, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { deleteCarAction, toggleCarVisibilityAction } from "@/lib/actions/carActions";
import { UiCar } from "@/lib/dbAdapter";

interface AdminCarsListProps {
  initialCars: UiCar[];
}

const statusMap = {
  available: "Đang bán",
  reserved: "Giữ chỗ",
  sold: "Đã bán",
};

export function AdminCarsList({ initialCars }: AdminCarsListProps) {
  const pathname = usePathname();
  const basePath = pathname?.startsWith("/staff") ? "/staff" : "/admin";
  const [cars, setCars] = useState<UiCar[]>(initialCars);
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  
  const [status, setStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa xe "${name}"? Thao tác này không thể hoàn tác.`)) {
      setDeletingId(id);
      setStatus({ type: null, message: "" });
      
      startTransition(async () => {
        const result = await deleteCarAction(id);
        if (result.success) {
          setCars((prev) => prev.filter((c) => c.id !== id));
          setStatus({
            type: "success",
            message: result.message || "Xóa xe thành công!",
          });
        } else {
          setStatus({
            type: "error",
            message: result.message || "Xóa xe thất bại.",
          });
        }
        setDeletingId(null);
      });
    }
  };

  const handleToggleVisibility = (id: string, currentStatus: string) => {
    setTogglingId(id);
    setStatus({ type: null, message: "" });

    startTransition(async () => {
      const result = await toggleCarVisibilityAction(id, currentStatus);
      if (result.success && result.newStatus) {
        setCars((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status: result.newStatus as any } : c))
        );
        setStatus({
          type: "success",
          message: result.message || "Thay đổi trạng thái hiển thị thành công!",
        });
      } else {
        setStatus({
          type: "error",
          message: result.message || "Thay đổi trạng thái hiển thị thất bại.",
        });
      }
      setTogglingId(null);
    });
  };

  return (
    <div className="space-y-4">
      {status.type === "success" && (
        <div className="flex items-start gap-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 p-4 text-emerald-500 max-w-md ml-auto">
          <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
          <p className="text-sm font-semibold">{status.message}</p>
        </div>
      )}

      {status.type === "error" && (
        <div className="flex items-start gap-3 rounded-md bg-red-500/10 border border-red-500/20 p-4 text-red-500 max-w-md ml-auto">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <p className="text-sm font-semibold">{status.message}</p>
        </div>
      )}

      <div className="overflow-hidden rounded-md border border-white/10 bg-[#151a22]">
        <table className="w-full min-w-[980px] text-left">
          <thead className="bg-white/5">
            <tr>
              {["Mã xe", "Xe", "Danh mục", "Giá", "Trạng thái", "Thao tác"].map((item) => (
                <th key={item} className="px-5 py-4 text-xs font-bold uppercase tracking-[0.12em] text-zinc-500">
                  {item}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cars.map((car) => (
              <tr key={car.id} className="border-t border-white/8 hover:bg-white/1 transition-colors">
                <td className="px-5 py-4 text-sm font-semibold text-zinc-400">{car.id.substring(0, 8)}...</td>
                <td className="px-5 py-4">
                  <p className="font-semibold text-white">{car.name}</p>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">{car.brand} / {car.year}</p>
                </td>
                <td className="px-5 py-4 text-zinc-300">{car.category}</td>
                <td className="px-5 py-4 font-semibold text-white">{car.price}</td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <Badge tone={car.condition === "new" ? "info" : "reserved"}>
                      {car.condition === "new" ? "XE MỚI" : "XE CŨ"}
                    </Badge>
                    <Badge tone={car.status === "hidden" ? "neutral" : car.status as any}>
                      {car.status === "available" ? "CÒN XE" : car.status === "reserved" ? "ĐANG GIỮ CHỖ" : car.status === "hidden" ? "TẠM ẨN" : "ĐÃ BÁN"}
                    </Badge>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex gap-2">
                    <Link 
                      href={`${basePath}/cars/edit/${car.id}`} 
                      className="rounded-md border border-white/10 p-2 text-zinc-300 hover:bg-[#e31837] hover:text-white transition"
                      title="Sửa xe"
                    >
                      <Edit3 size={16} />
                    </Link>
                    <button 
                      onClick={() => handleToggleVisibility(car.id, car.status)}
                      disabled={togglingId === car.id}
                      className="rounded-md border border-white/10 p-2 text-zinc-300 hover:bg-white/5 transition disabled:opacity-50"
                      title={car.status === "hidden" ? "Hiển thị xe" : "Tạm ẩn xe"}
                    >
                      {togglingId === car.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : car.status === "hidden" ? (
                        <Eye size={16} />
                      ) : (
                        <EyeOff size={16} />
                      )}
                    </button>
                    <button 
                      onClick={() => handleDelete(car.id, car.name)}
                      disabled={deletingId === car.id}
                      className="rounded-md border border-white/10 p-2 text-red-300 hover:bg-red-500/10 hover:text-red-400 transition disabled:opacity-50"
                      title="Xóa xe"
                    >
                      {deletingId === car.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
