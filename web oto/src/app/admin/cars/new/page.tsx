import { ImagePlus, Save } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";

const fields = [
  "Tên xe",
  "Hãng xe",
  "Năm sản xuất",
  "Giá bán",
  "Số km",
  "Nhiên liệu",
  "Hộp số",
  "Màu xe",
];

export default function NewCarPage() {
  return (
    <AdminShell
      title="Thêm/Sửa xe mới"
      subtitle="Form nhập xe mock theo screen thêm/sửa xe trong Stitch, chia nhóm rõ để sau này nối backend."
    >
      <div className="grid gap-8 xl:grid-cols-[1fr_360px]">
        <form className="rounded-md border border-white/10 bg-[#151a22] p-6">
          <div className="grid gap-5 md:grid-cols-2">
            {fields.map((field) => (
              <label key={field} className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-zinc-500">{field}</span>
                <input className="h-12 w-full rounded-md border border-white/10 bg-[#080c11] px-4 text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-[#e31837]" placeholder={field} />
              </label>
            ))}
            <label className="block md:col-span-2">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-zinc-500">Mô tả</span>
              <textarea className="min-h-36 w-full rounded-md border border-white/10 bg-[#080c11] p-4 text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-[#e31837]" placeholder="Thông tin nổi bật, lịch sử bảo dưỡng, pháp lý..." />
            </label>
          </div>
          <div className="mt-6 flex justify-end">
            <Button><Save size={18} /> Lưu xe</Button>
          </div>
        </form>
        <aside className="rounded-md border border-white/10 bg-[#151a22] p-6">
          <div className="flex aspect-[4/3] items-center justify-center rounded-md border border-dashed border-white/20 bg-[#080c11] text-zinc-500">
            <div className="text-center">
              <ImagePlus className="mx-auto mb-3" size={32} />
              <p className="text-sm font-semibold">Ảnh xe</p>
            </div>
          </div>
          <p className="mt-5 text-sm leading-6 text-zinc-400">
            Placeholder upload ảnh cho UI trước. Khi có backend có thể nối storage hoặc CMS.
          </p>
        </aside>
      </div>
    </AdminShell>
  );
}
