"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ImagePlus, Save, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createPostAction, updatePostAction } from "@/lib/actions/postActions";
import { slugify } from "@/lib/utils";
import { DbPost } from "@/lib/db";

interface PostFormProps {
  initialPost?: DbPost;
}

export function PostForm({ initialPost }: PostFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const basePath = pathname?.startsWith("/staff") ? "/staff" : "/dashboard";
  const [isPending, startTransition] = useTransition();
  const isEdit = !!initialPost;

  const [formData, setFormData] = useState({
    title_vi: initialPost?.title_vi || initialPost?.title || "",
    slug: initialPost?.slug || "",
    excerpt_vi: initialPost?.excerpt_vi || initialPost?.excerpt || "",
    content_vi: initialPost?.content_vi || initialPost?.content || "",
    category: initialPost?.category || "Đánh giá",
    author: initialPost?.author || "Quản trị viên",
    featured: initialPost?.featured === 1,
    published: initialPost?.published === 1,
  });

  const [isSlugManual, setIsSlugManual] = useState(isEdit);

  // Thumbnail state
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>(initialPost?.thumbnail || "");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  // Auto-generate slug from title_vi
  useEffect(() => {
    if (!isSlugManual && !isEdit) {
      setFormData((prev) => ({ ...prev, slug: slugify(formData.title_vi) }));
    }
  }, [formData.title_vi, isSlugManual, isEdit]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    
    setFormData((prev) => ({ ...prev, [name]: val }));
    
    if (name === "slug") {
      setIsSlugManual(value.trim() !== "");
    }

    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleCheckboxChange = (name: "featured" | "published", checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      if (errors.thumbnail) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next.thumbnail;
          return next;
        });
      }
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus({ type: null, message: "" });
    setErrors({});

    // Client side validation
    const clientErrors: Record<string, string> = {};
    if (!formData.title_vi.trim()) clientErrors.title_vi = "Tiêu đề bài viết là bắt buộc";
    if (!formData.slug.trim()) clientErrors.slug = "Đường dẫn slug là bắt buộc";
    if (!formData.excerpt_vi.trim()) clientErrors.excerpt_vi = "Tóm tắt là bắt buộc";
    if (!formData.content_vi.trim()) clientErrors.content_vi = "Nội dung là bắt buộc";
    if (!formData.category.trim()) clientErrors.category = "Danh mục là bắt buộc";
    if (!formData.author.trim()) clientErrors.author = "Tác giả là bắt buộc";
    if (!isEdit && !thumbnailFile) clientErrors.thumbnail = "Ảnh đại diện là bắt buộc";

    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      setStatus({
        type: "error",
        message: "Vui lòng nhập đầy đủ các trường thông tin bắt buộc.",
      });
      return;
    }

    startTransition(async () => {
      const submissionData = new FormData();
      submissionData.append("title", formData.title_vi);
      submissionData.append("title_vi", formData.title_vi);
      submissionData.append("slug", formData.slug);
      submissionData.append("excerpt", formData.excerpt_vi);
      submissionData.append("excerpt_vi", formData.excerpt_vi);
      submissionData.append("content", formData.content_vi);
      submissionData.append("content_vi", formData.content_vi);
      submissionData.append("category", formData.category);
      submissionData.append("author", formData.author);
      submissionData.append("featured", String(formData.featured));
      submissionData.append("published", String(formData.published));

      if (thumbnailFile) {
        submissionData.append("thumbnail", thumbnailFile);
      }

      const result = isEdit 
        ? await updatePostAction(initialPost.id, submissionData)
        : await createPostAction(submissionData);

      if (result.success) {
        setStatus({
          type: "success",
          message: result.message || "Lưu bài viết thành công!",
        });
        setTimeout(() => {
          router.push(`${basePath}/posts`);
        }, 1500);
      } else {
        setStatus({
          type: "error",
          message: result.message || "Lưu bài viết thất bại.",
        });
        if (result.errors) {
          setErrors(result.errors);
        }
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 xl:grid-cols-[1fr_360px]">
      {/* Left Column: Post fields */}
      <div className="rounded-md border border-white/10 bg-[#151a22] p-6 space-y-6">
        {status.type === "success" && (
          <div className="flex items-start gap-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 p-4 text-emerald-500">
            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">Thành công</p>
              <p className="text-sm mt-1 text-emerald-500/90">{status.message}</p>
            </div>
          </div>
        )}

        {status.type === "error" && (
          <div className="flex items-start gap-3 rounded-md bg-red-500/10 border border-red-500/20 p-4 text-red-500">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">Thất bại</p>
              <p className="text-sm mt-1 text-red-500/90">{status.message}</p>
            </div>
          </div>
        )}

        <div className="space-y-5">
          {/* Tiêu đề */}
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-zinc-400">Tiêu đề bài viết *</span>
            <input
              name="title_vi"
              value={formData.title_vi}
              onChange={handleChange}
              placeholder="Ví dụ: Đánh giá chi tiết Honda Civic RS 2025"
              className={`h-12 w-full rounded-md border bg-[#080c11] px-4 text-zinc-100 outline-none transition focus:border-[#e31837] ${
                errors.title_vi ? "border-red-500 bg-red-500/5" : "border-white/10"
              }`}
            />
            {errors.title_vi && <span className="mt-1 text-xs text-red-500">{errors.title_vi}</span>}
          </label>

          {/* Đường dẫn Slug */}
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-zinc-400">Đường dẫn tĩnh (Slug) *</span>
            <input
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              placeholder="honda-civic-rs-2025-review"
              className={`h-12 w-full rounded-md border bg-[#080c11] px-4 text-zinc-100 outline-none transition focus:border-[#e31837] ${
                errors.slug ? "border-red-500 bg-red-500/5" : "border-white/10"
              }`}
            />
            {errors.slug && <span className="mt-1 text-xs text-red-500">{errors.slug}</span>}
            <p className="mt-1 text-[11px] text-zinc-500">
              URL bài viết sẽ là: <code className="text-zinc-400">/news/{formData.slug || "slug-duong-dan"}</code>
            </p>
          </label>

          <div className="grid gap-5 md:grid-cols-2">
            {/* Danh mục */}
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-zinc-400">Danh mục *</span>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="h-12 w-full rounded-md border border-white/10 bg-[#080c11] px-4 text-zinc-100 outline-none transition focus:border-[#e31837]"
              >
                {["Đánh giá", "Kinh nghiệm", "Tư vấn mua xe", "Tin thị trường"].map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </label>

            {/* Tác giả */}
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-zinc-400">Tác giả *</span>
              <input
                name="author"
                value={formData.author}
                onChange={handleChange}
                placeholder="Ví dụ: Trần Quốc Huy"
                className={`h-12 w-full rounded-md border bg-[#080c11] px-4 text-zinc-100 outline-none transition focus:border-[#e31837] ${
                  errors.author ? "border-red-500 bg-red-500/5" : "border-white/10"
                }`}
              />
              {errors.author && <span className="mt-1 text-xs text-red-500">{errors.author}</span>}
            </label>
          </div>

          {/* Tóm tắt */}
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-zinc-400">Tóm tắt ngắn *</span>
            <textarea
              name="excerpt_vi"
              value={formData.excerpt_vi}
              onChange={handleChange}
              placeholder="Viết một đoạn tóm tắt ngắn..."
              className={`min-h-20 w-full rounded-md border bg-[#080c11] p-4 text-zinc-100 outline-none transition focus:border-[#e31837] ${
                errors.excerpt_vi ? "border-red-500 bg-red-500/5" : "border-white/10"
              }`}
            />
            {errors.excerpt_vi && <span className="mt-1 text-xs text-red-500">{errors.excerpt_vi}</span>}
          </label>

          {/* Nội dung chính */}
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-zinc-400">Nội dung bài viết *</span>
            <textarea
              name="content_vi"
              value={formData.content_vi}
              onChange={handleChange}
              placeholder="Nhập nội dung bài viết. Bạn có thể sử dụng cú pháp markdown..."
              className={`min-h-96 w-full rounded-md border bg-[#080c11] p-4 font-mono text-zinc-100 text-sm outline-none transition focus:border-[#e31837] ${
                errors.content_vi ? "border-red-500 bg-red-500/5" : "border-white/10"
              }`}
            />
            {errors.content_vi && <span className="mt-1 text-xs text-red-500">{errors.content_vi}</span>}
          </label>
        </div>

        {/* Submit */}
        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Đang xử lý...
              </>
            ) : (
              <>
                <Save size={18} /> Lưu bài viết
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Right Column: Settings & Thumbnail */}
      <aside className="space-y-6">
        
        {/* Cấu hình hiển thị */}
        <div className="rounded-md border border-white/10 bg-[#151a22] p-6 space-y-4">
          <span className="block text-xs font-bold uppercase tracking-[0.12em] text-zinc-400">Cấu hình bài viết</span>
          
          {/* Trạng thái xuất bản */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              name="published"
              checked={formData.published}
              onChange={(e) => handleCheckboxChange("published", e.target.checked)}
              className="h-4.5 w-4.5 rounded border-white/10 bg-[#080c11] text-[#e31837] focus:ring-0 focus:ring-offset-0"
            />
            <div>
              <span className="text-sm font-semibold text-zinc-200">Xuất bản bài viết</span>
              <p className="text-[10px] text-zinc-400">Cho phép người dùng xem công khai trên website.</p>
            </div>
          </label>

          {/* Tin nổi bật */}
          <label className="flex items-center gap-3 cursor-pointer select-none border-t border-white/5 pt-4">
            <input
              type="checkbox"
              name="featured"
              checked={formData.featured}
              onChange={(e) => handleCheckboxChange("featured", e.target.checked)}
              className="h-4.5 w-4.5 rounded border-white/10 bg-[#080c11] text-[#e31837] focus:ring-0 focus:ring-offset-0"
            />
            <div>
              <span className="text-sm font-semibold text-zinc-200">Đặt làm tin nổi bật</span>
              <p className="text-[10px] text-zinc-400">Ghim bài viết lên đầu trang tin tức.</p>
            </div>
          </label>
        </div>

        {/* Thumbnail Upload */}
        <div className="rounded-md border border-white/10 bg-[#151a22] p-6 text-center">
          <span className="mb-4 block text-left text-xs font-bold uppercase tracking-[0.12em] text-zinc-400">Ảnh đại diện bài viết *</span>
          <div className="relative aspect-[16/10] rounded-md border border-white/10 overflow-hidden bg-[#080c11] flex items-center justify-center">
            {thumbnailPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumbnailPreview} alt="Thumbnail Preview" className="h-full w-full object-cover" />
            ) : (
              <div className="text-zinc-600">
                <ImagePlus size={32} className="mx-auto" />
                <span className="text-xs font-semibold block mt-2">Chưa chọn ảnh</span>
              </div>
            )}
          </div>
          
          <label className="mt-4 flex h-10 cursor-pointer items-center justify-center rounded-md border border-white/10 bg-[#080c11] hover:bg-[#1f2631] transition text-sm font-semibold text-zinc-300">
            Chọn ảnh đại diện
            <input type="file" accept="image/*" className="hidden" onChange={handleThumbnailChange} />
          </label>
          {errors.thumbnail && <span className="mt-1 text-xs text-red-500 block">{errors.thumbnail}</span>}

          <p className="mt-5 text-left text-xs leading-5 text-zinc-500">
            Ảnh bìa bài viết hiển thị trên trang chủ và đầu bài viết chi tiết. Khuyên dùng tỉ lệ 16:10.
          </p>
        </div>
      </aside>
    </form>
  );
}
