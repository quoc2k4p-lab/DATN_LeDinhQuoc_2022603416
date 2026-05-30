import { AdminShell } from "@/components/admin/AdminShell";
import { CarForm } from "@/components/admin/CarForm";

export default function NewCarPage() {
  return (
    <AdminShell
      title="Thêm xe mới"
      subtitle="Nhập đầy đủ thông tin kỹ thuật, mô tả, tải ảnh đại diện và bộ sưu tập ảnh phụ để đăng tải lên hệ thống."
    >
      <CarForm />
    </AdminShell>
  );
}
