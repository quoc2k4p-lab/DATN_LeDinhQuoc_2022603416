import { ShieldCheck, UserPlus } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { DataTable } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/Button";
import { users } from "@/data/mock";

export default function AccountsPage() {
  return (
    <AdminShell
      title="Quản lý tài khoản"
      subtitle="Mock UI cho bảng users: khách hàng, nhân viên và quản trị viên; phục vụ phân quyền hệ thống."
    >
      <div className="mb-6 flex justify-end">
        <Button><UserPlus size={18} /> Thêm tài khoản</Button>
      </div>
      <DataTable
        columns={[
          { key: "name", label: "Họ tên" },
          { key: "email", label: "Email" },
          { key: "phone", label: "Điện thoại" },
          { key: "role", label: "Vai trò", badge: true },
          { key: "status", label: "Trạng thái", badge: true },
        ]}
        rows={users}
      />
      <div className="mt-8 rounded-md border border-white/10 bg-[#151a22] p-6">
        <ShieldCheck className="mb-5 text-[#e31837]" size={28} />
        <h2 className="font-display text-xl font-bold">Ghi chú bảo mật</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
          Khi nối backend, tài khoản quản trị cần xác thực, phân quyền theo role và không hiển thị dữ liệu khách hàng công khai.
        </p>
      </div>
    </AdminShell>
  );
}
