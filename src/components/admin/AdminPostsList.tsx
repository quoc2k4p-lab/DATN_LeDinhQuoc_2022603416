"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Edit3, Trash2, Loader2, AlertCircle, CheckCircle2, Star, Eye } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { deletePostAction } from "@/lib/actions/postActions";
import { DbPost } from "@/lib/db";

interface AdminPostsListProps {
  initialPosts: DbPost[];
}

export function AdminPostsList({ initialPosts }: AdminPostsListProps) {
  const pathname = usePathname();
  const basePath = pathname?.startsWith("/staff") ? "/staff" : "/dashboard";
  const [posts, setPosts] = useState<DbPost[]>(initialPosts);
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const [status, setStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const handleDelete = (id: string, title: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa bài viết "${title}"? Thao tác này không thể hoàn tác.`)) {
      setDeletingId(id);
      setStatus({ type: null, message: "" });
      
      startTransition(async () => {
        const result = await deletePostAction(id);
        if (result.success) {
          setPosts((prev) => prev.filter((p) => p.id !== id));
          setStatus({
            type: "success",
            message: result.message || "Xóa bài viết thành công!",
          });
        } else {
          setStatus({
            type: "error",
            message: result.message || "Xóa bài viết thất bại.",
          });
        }
        setDeletingId(null);
      });
    }
  };

  return (
    <div className="space-y-4">
      {status.type === "success" && (
        <div className="flex items-start gap-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 p-4 text-emerald-500 max-w-md ml-auto">
          <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
          <p className="text-sm font-semibold">{status.message}</p>
        </div>
      )}

      {status.type === "error" && (
        <div className="flex items-start gap-3 rounded-md bg-red-500/10 border border-red-500/20 p-4 text-red-500 max-w-md ml-auto">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <p className="text-sm font-semibold">{status.message}</p>
        </div>
      )}

      <div className="overflow-hidden rounded-md border border-white/10 bg-[#151a22]">
        <table className="w-full min-w-[980px] text-left">
          <thead className="bg-white/5">
            <tr>
              {["Bài viết", "Danh mục", "Tác giả", "Lượt xem", "Trạng thái", "Thao tác"].map((item) => (
                <th key={item} className="px-5 py-4 text-xs font-bold uppercase tracking-[0.12em] text-zinc-500">
                  {item}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {posts.length > 0 ? (
              posts.map((post) => {
                const dateStr = new Date(post.created_at).toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                });
                
                return (
                  <tr key={post.id} className="border-t border-white/8 hover:bg-white/1 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded bg-zinc-900 border border-white/5">
                          <Image
                            src={post.thumbnail}
                            alt={post.title}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-white line-clamp-1 max-w-md">{post.title}</p>
                          <p className="text-xs font-semibold text-zinc-500">{dateStr} • {post.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone={post.category === "Đánh giá" ? "info" : post.category === "Tư vấn mua xe" ? "reserved" : "neutral"}>
                        {post.category}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-zinc-300 font-medium text-sm">{post.author}</td>
                    <td className="px-5 py-4 text-zinc-300 font-medium text-sm">
                      <div className="flex items-center gap-1.5">
                        <Eye size={14} className="text-zinc-500" />
                        <span>{post.views}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {post.featured === 1 && (
                          <Badge tone="reserved" className="flex items-center gap-1">
                            <Star size={10} className="fill-current" /> NỔI BẬT
                          </Badge>
                        )}
                        <Badge tone={post.published === 1 ? "available" : "neutral"}>
                          {post.published === 1 ? "ĐÃ XUẤT BẢN" : "BẢN NHÁP"}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <Link 
                          href={`${basePath}/posts/${post.id}/edit`} 
                          className="rounded-md border border-white/10 p-2 text-zinc-300 hover:bg-[#e31837] hover:text-white transition"
                          title="Sửa bài viết"
                        >
                          <Edit3 size={16} />
                        </Link>
                        <button 
                          onClick={() => handleDelete(post.id, post.title)}
                          disabled={deletingId === post.id}
                          className="rounded-md border border-white/10 p-2 text-red-300 hover:bg-red-500/10 hover:text-red-400 transition disabled:opacity-50"
                          title="Xóa bài viết"
                        >
                          {deletingId === post.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-zinc-500 text-sm">
                  Chưa có bài viết nào trong hệ thống.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
