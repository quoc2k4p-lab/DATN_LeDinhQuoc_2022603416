import { AdminShell } from "@/components/admin/AdminShell";
import { CarForm } from "@/components/admin/CarForm";
import { getUsers, getCustomers } from "@/lib/db";

export default async function NewCarPage() {
  const users = await getUsers();
  const customers = await getCustomers();
  const staff = users.filter((u) => u.role === "admin" || u.role === "staff");

  return (
    <AdminShell
      title="Thêm xe mới"
      subtitle="Nhập đầy đủ thông tin kỹ thuật, mô tả, tải ảnh đại diện và bộ sưu tập ảnh phụ để đăng tải lên hệ thống."
    >
      <CarForm staffList={staff} customerList={customers} />
    </AdminShell>
  );
}
