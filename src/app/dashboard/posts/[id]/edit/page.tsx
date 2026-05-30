export const dynamic = "force-dynamic";

import { getPostById } from "@/lib/db";
import { AdminShell } from "@/components/admin/AdminShell";
import { PostForm } from "@/components/admin/PostForm";
import { notFound } from "next/navigation";

interface EditPostPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params;
  const post = await getPostById(id);

  if (!post) {
    notFound();
  }

  return (
    <AdminShell
      title="Chỉnh sửa bài viết"
      subtitle={`Chỉnh sửa nội dung, danh mục, tóm tắt và ảnh đại diện cho bài viết: ${post.title}.`}
    >
      <PostForm initialPost={post} />
    </AdminShell>
  );
}
