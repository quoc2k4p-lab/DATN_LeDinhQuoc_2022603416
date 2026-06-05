import { Edit3, FolderPlus } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { DataTable } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/Button";
import { categories } from "@/data/mock";

export default function CategoriesPage() {
  return (
    <AdminShell
      title="Danh mục xe"
      subtitle="Quản trị các loại xe như Sedan, SUV, Hatchback, Pickup theo yêu cầu F08."
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <DataTable
          columns={[
            { key: "id", label: "Mã" },
            { key: "name", label: "Danh mục" },
            { key: "count", label: "Số xe" },
            { key: "status", label: "Trạng thái", badge: true },
          ]}
          rows={categories.map((item) => ({ ...item, count: String(item.count) }))}
        />
        <form className="h-fit rounded-md border border-white/10 bg-[#151a22] p-6">
          <FolderPlus className="mb-6 text-[#e31837]" size={28} />
          <h2 className="font-display text-xl font-bold">Thêm danh mục</h2>
          <label className="mt-5 block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-zinc-500">Tên danh mục</span>
            <input className="h-12 w-full rounded-md border border-white/10 bg-[#080c11] px-4 outline-none focus:border-[#e31837]" placeholder="Ví dụ: Coupe" />
          </label>
          <Button className="mt-5 w-full"><Edit3 size={18} /> Lưu danh mục</Button>
        </form>
      </div>
    </AdminShell>
  );
}
