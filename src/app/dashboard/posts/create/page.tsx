export const dynamic = "force-dynamic";

import { AdminShell } from "@/components/admin/AdminShell";
import { PostForm } from "@/components/admin/PostForm";

export default function CreatePostPage() {
  return (
    <AdminShell
      title="Thêm bài viết mới"
      subtitle="Nhập tiêu đề, nội dung, tải ảnh đại diện và tùy chọn xuất bản công khai lên website."
    >
      <PostForm />
    </AdminShell>
  );
}
