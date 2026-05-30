import Image from "next/image";
import Link from "next/link";
import { Edit3, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { UiCar } from "@/lib/dbAdapter";

const labels = {
  available: "CÒN XE",
  reserved: "ĐANG GIỮ CHỖ",
  sold: "ĐÃ BÁN",
};

export function InventoryTable({ cars, basePath = "/admin" }: { cars: UiCar[]; basePath?: string }) {
  return (
    <div className="overflow-hidden rounded-md border border-white/10 bg-[#151a22]">
      <div className="flex items-center justify-between border-b border-white/10 p-5">
        <div>
          <h2 className="font-display text-xl font-bold">Kho xe nổi bật</h2>
          <p className="mt-1 text-sm text-zinc-500">Danh sách xe nổi bật trong kho hàng thực tế của showroom.</p>
        </div>
        <button className="rounded-md border border-white/10 p-2 text-zinc-400">
          <MoreHorizontal size={18} />
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left">
          <thead className="bg-white/5">
            <tr>
              {["Xe", "Giá", "Odo", "Trạng thái", "Thao tác"].map((item) => (
                <th key={item} className="px-5 py-4 text-xs font-bold uppercase tracking-[0.12em] text-zinc-500">
                  {item}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cars.slice(0, 5).map((car) => (
              <tr key={car.id} className="border-t border-white/8">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Image src={car.image} alt={car.name} width={80} height={56} className="h-14 w-20 rounded object-cover" />
                    <div>
                      <p className="font-semibold text-white">{car.name}</p>
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">{car.id.substring(0, 8)}...</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 font-semibold">{car.price}</td>
                <td className="px-5 py-4 text-zinc-400">{car.mileage}</td>
                <td className="px-5 py-4"><Badge tone={car.status}>{labels[car.status]}</Badge></td>
                <td className="px-5 py-4">
                  <Link
                    href={`${basePath}/cars/edit/${car.id}`}
                    className="inline-flex h-10 items-center gap-2 rounded-md border border-white/10 px-3 text-sm font-semibold text-zinc-300 hover:bg-[#e31837] hover:text-white transition"
                  >
                    <Edit3 size={16} />
                    Sửa
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

