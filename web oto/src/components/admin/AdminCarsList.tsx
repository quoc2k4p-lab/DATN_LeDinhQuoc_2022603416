"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Edit3, EyeOff, Eye, Trash2, Loader2, AlertCircle, CheckCircle2, Search, Plus } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CrawlButton } from "./CrawlButton";
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
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  
  const [status, setStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const filteredCars = cars.filter((car) => {
    const term = search.toLowerCase().trim();
    if (!term) return true;
    return (
      car.name.toLowerCase().includes(term) ||
      car.brand.toLowerCase().includes(term) ||
      car.category.toLowerCase().includes(term) ||
      car.price.toLowerCase().includes(term) ||
      car.id.toLowerCase().includes(term) ||
      car.year.toString().includes(term)
    );
  });

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

      {/* Controls Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute top-3.5 left-4 text-zinc-500" size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên xe, hãng xe, danh mục, giá bán..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-md border border-white/10 bg-[#11151c] pl-11 pr-4 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-[#e31837]"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <CrawlButton />
          <Button href={`${basePath}/cars/new`}>
            <Plus size={18} /> Thêm xe mới
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-white/10 bg-[#151a22]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
          <thead className="bg-white/5">
            <tr>
              {["Hình ảnh", "Xe", "Danh mục", "Giá", "Trạng thái", "Thao tác"].map((item) => (
                <th key={item} className="px-5 py-4 text-xs font-bold uppercase tracking-[0.12em] text-zinc-500">
                  {item}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredCars.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-sm text-zinc-500 bg-white/[0.01]">
                  Không tìm thấy xe nào khớp với từ khóa tìm kiếm.
                </td>
              </tr>
            )}
            {filteredCars.map((car) => (
              <tr key={car.id} className="border-t border-white/8 hover:bg-white/1 transition-colors">
                <td className="px-5 py-4">
                  <div className="relative h-10 w-16 overflow-hidden rounded border border-white/10 bg-zinc-800">
                    {car.image ? (
                      <img
                        src={car.image}
                        alt={car.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[9px] text-zinc-500 font-bold uppercase">
                        No Img
                      </div>
                    )}
                  </div>
                </td>
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
    </div>
  );
}
