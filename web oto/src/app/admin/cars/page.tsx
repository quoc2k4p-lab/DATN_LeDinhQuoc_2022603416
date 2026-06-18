export const dynamic = "force-dynamic";

import { AdminShell } from "@/components/admin/AdminShell";
import { getUiCars } from "@/lib/dbAdapter";
import { AdminCarsList } from "@/components/admin/AdminCarsList";

export default async function AdminCarsPage() {
  const cars = await getUiCars(undefined, true);

  return (
    <AdminShell
      title="Quản lý xe"
      subtitle="Thêm, sửa, xóa, cập nhật trạng thái và ẩn xe kinh doanh thực tế."
    >
      <AdminCarsList initialCars={cars} />
    </AdminShell>
  );
}
