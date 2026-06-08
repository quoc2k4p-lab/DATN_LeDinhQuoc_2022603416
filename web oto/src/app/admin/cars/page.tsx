export const dynamic = "force-dynamic";

import { Plus } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { getUiCars } from "@/lib/dbAdapter";
import { AdminCarsList } from "@/components/admin/AdminCarsList";
import { CrawlButton } from "@/components/admin/CrawlButton";

export default async function AdminCarsPage() {
  const cars = await getUiCars(undefined, true);

  return (
    <AdminShell
      title="Quản lý xe"
      subtitle="Thêm, sửa, xóa, cập nhật trạng thái và ẩn xe kinh doanh thực tế."
    >
      <div className="mb-6 flex justify-end gap-3 items-center">
        <CrawlButton />
        <Button href="/admin/cars/new"><Plus size={18} /> Thêm xe mới</Button>
      </div>
      
      <AdminCarsList initialCars={cars} />
    </AdminShell>
  );
}
