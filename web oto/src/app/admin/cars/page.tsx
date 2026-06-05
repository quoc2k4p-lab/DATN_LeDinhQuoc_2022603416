import Link from "next/link";
import { Edit3, EyeOff, Plus, Trash2 } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cars } from "@/data/mock";

const statusMap = {
  available: "Đang bán",
  reserved: "Giữ chỗ",
  sold: "Đã bán",
};

export default function AdminCarsPage() {
  return (
    <AdminShell
      title="Quản lý xe"
      subtitle="Thêm, sửa, xóa, cập nhật trạng thái và ẩn xe không còn kinh doanh theo yêu cầu F07."
    >
      <div className="mb-6 flex justify-end">
        <Button href="/admin/cars/new"><Plus size={18} /> Thêm xe mới</Button>
      </div>
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
              <tr key={car.id} className="border-t border-white/8">
                <td className="px-5 py-4 text-sm font-semibold text-zinc-400">{car.id}</td>
                <td className="px-5 py-4">
                  <p className="font-semibold text-white">{car.name}</p>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">{car.brand} / {car.year}</p>
                </td>
                <td className="px-5 py-4 text-zinc-300">{car.category}</td>
                <td className="px-5 py-4 font-semibold text-white">{car.price}</td>
                <td className="px-5 py-4"><Badge tone={car.status}>{statusMap[car.status]}</Badge></td>
                <td className="px-5 py-4">
                  <div className="flex gap-2">
                    <Link href="/admin/cars/new" className="rounded-md border border-white/10 p-2 text-zinc-300"><Edit3 size={16} /></Link>
                    <button className="rounded-md border border-white/10 p-2 text-zinc-300"><EyeOff size={16} /></button>
                    <button className="rounded-md border border-white/10 p-2 text-red-300"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
