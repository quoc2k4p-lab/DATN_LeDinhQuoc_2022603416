import { Phone, Plus, Search } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { DataTable } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/Button";
import { customers } from "@/data/mock";

export default function CustomersPage() {
  return (
    <AdminShell
      title="Quản lý khách hàng"
      subtitle="Danh sách lead và khách đang tư vấn, tái tạo screen quản lý khách hàng trong Stitch bằng data mock."
    >
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex h-11 max-w-md flex-1 items-center gap-3 rounded-md border border-white/10 bg-white/5 px-4 text-sm text-zinc-500">
          <Search size={18} />
          Tìm theo tên, số điện thoại, dòng xe
        </div>
        <Button><Plus size={18} /> Thêm khách</Button>
      </div>
      <DataTable
        columns={[
          { key: "name", label: "Khách hàng" },
          { key: "phone", label: "Điện thoại" },
          { key: "interest", label: "Quan tâm" },
          { key: "stage", label: "Giai đoạn", badge: true },
          { key: "budget", label: "Ngân sách" },
        ]}
        rows={customers}
      />
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {customers.slice(0, 3).map((customer) => (
          <div key={customer.phone} className="rounded-md border border-white/10 bg-[#151a22] p-6">
            <p className="font-display text-xl font-bold">{customer.name}</p>
            <p className="mt-2 flex items-center gap-2 text-sm text-zinc-400"><Phone size={16} /> {customer.phone}</p>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.12em] text-zinc-500">Xe quan tâm</p>
            <p className="mt-1 font-semibold">{customer.interest}</p>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
