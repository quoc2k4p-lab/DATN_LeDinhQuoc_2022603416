export const dynamic = "force-dynamic";

import { Plus } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { getPosts } from "@/lib/db";
import { AdminPostsList } from "@/components/admin/AdminPostsList";

export default async function AdminPostsPage() {
  const posts = await getPosts();

  return (
    <AdminShell
      title="Quản lý bài viết"
      subtitle="Thêm, sửa, xóa, ghim tin nổi bật và quản lý trạng thái xuất bản bài viết, đánh giá xe."
    >
      <div className="mb-6 flex justify-end gap-3 items-center">
        <Button href="/dashboard/posts/create">
          <Plus size={18} /> Thêm bài viết mới
        </Button>
      </div>
      
      <AdminPostsList initialPosts={posts} />
    </AdminShell>
  );
}
