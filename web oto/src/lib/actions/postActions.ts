"use server";

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { savePost, updatePost, deletePost, getPosts, getPostBySlug } from "@/lib/db";
import { ActionResponse } from "./auth";
import { slugify } from "@/lib/utils";

const UPLOAD_DIR_NAME = "uploads";

async function saveUploadedFile(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  const uploadDir = path.join(process.cwd(), "public", UPLOAD_DIR_NAME);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  const fileExt = path.extname(file.name) || ".jpg";
  const fileName = `${crypto.randomUUID()}${fileExt}`;
  const filePath = path.join(uploadDir, fileName);
  
  await fs.promises.writeFile(filePath, buffer);
  return `/${UPLOAD_DIR_NAME}/${fileName}`;
}

export async function createPostAction(formData: FormData): Promise<ActionResponse & { postId?: string }> {
  try {
    const title = formData.get("title")?.toString().trim() || "";
    const title_vi = formData.get("title_vi")?.toString().trim() || title;
    let slug = formData.get("slug")?.toString().trim() || "";
    const excerpt = formData.get("excerpt")?.toString().trim() || "";
    const excerpt_vi = formData.get("excerpt_vi")?.toString().trim() || excerpt;
    const content = formData.get("content")?.toString() || "";
    const content_vi = formData.get("content_vi")?.toString() || content;
    const category = formData.get("category")?.toString().trim() || "Đánh giá";
    const author = formData.get("author")?.toString().trim() || "Quản trị viên";
    const featured = formData.get("featured") === "true" ? 1 : 0;
    const published = formData.get("published") === "true" ? 1 : 0;

    const errors: Record<string, string> = {};

    if (!title) errors.title = "Tiêu đề bài viết là bắt buộc";
    if (!excerpt) errors.excerpt = "Tóm tắt bài viết là bắt buộc";
    if (!content) errors.content = "Nội dung bài viết là bắt buộc";
    if (!category) errors.category = "Danh mục là bắt buộc";
    if (!author) errors.author = "Tác giả là bắt buộc";

    if (!slug) {
      slug = slugify(title);
    } else {
      slug = slugify(slug);
    }

    if (!slug) {
      errors.slug = "Đường dẫn slug không hợp lệ";
    } else {
      const existing = await getPostBySlug(slug);
      if (existing) {
        errors.slug = "Đường dẫn slug này đã tồn tại, vui lòng chọn tiêu đề khác";
      }
    }

    // Handle thumbnail upload
    const thumbnailFile = formData.get("thumbnail") as File | null;
    let thumbnailUrl = "";
    if (thumbnailFile && thumbnailFile.size > 0) {
      try {
        thumbnailUrl = await saveUploadedFile(thumbnailFile);
      } catch (err) {
        console.error("Error saving post thumbnail:", err);
        errors.thumbnail = "Lỗi lưu ảnh đại diện";
      }
    } else {
      errors.thumbnail = "Ảnh đại diện bài viết là bắt buộc";
    }

    if (Object.keys(errors).length > 0) {
      return {
        success: false,
        message: "Thông tin bài viết không hợp lệ. Vui lòng kiểm tra lại.",
        errors,
      };
    }

    const dbPost = await savePost({
      title,
      title_vi,
      slug,
      excerpt,
      excerpt_vi,
      content,
      content_vi,
      thumbnail: thumbnailUrl,
      category,
      author,
      featured,
      published,
    });

    revalidatePath("/");
    revalidatePath("/news");
    revalidatePath("/dashboard/posts");

    return {
      success: true,
      message: "Tạo bài viết mới thành công!",
      postId: dbPost.id,
    };
  } catch (error) {
    console.error("Error creating post:", error);
    return {
      success: false,
      message: "Có lỗi xảy ra khi tạo mới bài viết. Vui lòng thử lại sau.",
    };
  }
}

export async function updatePostAction(id: string, formData: FormData): Promise<ActionResponse> {
  try {
    const title = formData.get("title")?.toString().trim() || "";
    const title_vi = formData.get("title_vi")?.toString().trim() || title;
    let slug = formData.get("slug")?.toString().trim() || "";
    const excerpt = formData.get("excerpt")?.toString().trim() || "";
    const excerpt_vi = formData.get("excerpt_vi")?.toString().trim() || excerpt;
    const content = formData.get("content")?.toString() || "";
    const content_vi = formData.get("content_vi")?.toString() || content;
    const category = formData.get("category")?.toString().trim() || "Đánh giá";
    const author = formData.get("author")?.toString().trim() || "Quản trị viên";
    const featured = formData.get("featured") === "true" ? 1 : 0;
    const published = formData.get("published") === "true" ? 1 : 0;

    const errors: Record<string, string> = {};

    if (!title) errors.title = "Tiêu đề bài viết là bắt buộc";
    if (!excerpt) errors.excerpt = "Tóm tắt bài viết là bắt buộc";
    if (!content) errors.content = "Nội dung bài viết là bắt buộc";
    if (!category) errors.category = "Danh mục là bắt buộc";
    if (!author) errors.author = "Tác giả là bắt buộc";

    if (!slug) {
      slug = slugify(title);
    } else {
      slug = slugify(slug);
    }

    if (!slug) {
      errors.slug = "Đường dẫn slug không hợp lệ";
    } else {
      const existing = await getPostBySlug(slug);
      if (existing && existing.id !== id) {
        errors.slug = "Đường dẫn slug này đã tồn tại, vui lòng chọn đường dẫn khác";
      }
    }

    // Handle optional thumbnail update
    const thumbnailFile = formData.get("thumbnail") as File | null;
    let thumbnailUrl = "";
    if (thumbnailFile && thumbnailFile.size > 0) {
      try {
        thumbnailUrl = await saveUploadedFile(thumbnailFile);
      } catch (err) {
        console.error("Error saving post thumbnail:", err);
        errors.thumbnail = "Lỗi lưu ảnh đại diện mới";
      }
    }

    if (Object.keys(errors).length > 0) {
      return {
        success: false,
        message: "Thông tin bài viết không hợp lệ. Vui lòng kiểm tra lại.",
        errors,
      };
    }

    const updatedFields: any = {
      title,
      title_vi,
      slug,
      excerpt,
      excerpt_vi,
      content,
      content_vi,
      category,
      author,
      featured,
      published,
    };

    if (thumbnailUrl) {
      updatedFields.thumbnail = thumbnailUrl;
    }

    const success = await updatePost(id, updatedFields);
    if (!success) {
      return {
        success: false,
        message: "Không tìm thấy bài viết hoặc không thể cập nhật thông tin.",
      };
    }

    revalidatePath("/");
    revalidatePath("/news");
    revalidatePath(`/news/${slug}`);
    revalidatePath("/dashboard/posts");

    return {
      success: true,
      message: "Cập nhật bài viết thành công!",
    };
  } catch (error) {
    console.error("Error updating post:", error);
    return {
      success: false,
      message: "Có lỗi xảy ra khi cập nhật bài viết. Vui lòng thử lại sau.",
    };
  }
}

export async function deletePostAction(id: string): Promise<ActionResponse> {
  try {
    const success = await deletePost(id);
    if (success) {
      revalidatePath("/");
      revalidatePath("/news");
      revalidatePath("/dashboard/posts");
      return {
        success: true,
        message: "Xóa bài viết thành công!",
      };
    }
    return {
      success: false,
      message: "Không tìm thấy bài viết để xóa.",
    };
  } catch (error) {
    console.error("Error deleting post:", error);
    return {
      success: false,
      message: "Có lỗi xảy ra khi xóa bài viết. Vui lòng thử lại sau.",
    };
  }
}
