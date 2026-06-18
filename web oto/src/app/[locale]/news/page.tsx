export const dynamic = "force-dynamic";

import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, User, ArrowLeft, ArrowRight as NextIcon } from "lucide-react";
import { PublicHeader } from "@/components/public/PublicHeader";
import { Footer } from "@/components/public/Footer";
import { NewsCard } from "@/components/public/NewsCard";
import { NewsFilters } from "@/components/public/NewsFilters";
import { getPosts } from "@/lib/db";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = {
  title: "Tin tức & Đánh giá xe ô tô mới nhất | TQ Auto",
  description: "Cập nhật tin tức thị trường ô tô mới nhất, đánh giá trải nghiệm thực tế các dòng xe Honda, Toyota, Mazda, BMW, Mercedes và cẩm nang kinh nghiệm lái xe từ TQ Auto.",
  openGraph: {
    title: "Tin tức & Đánh giá xe ô tô mới nhất | TQ Auto",
    description: "Cập nhật tin tức thị trường ô tô mới nhất, đánh giá trải nghiệm thực tế các dòng xe và cẩm nang kinh nghiệm lái xe.",
    images: ["https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&h=630&q=80"],
  },
};

interface NewsPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    page?: string;
  }>;
}

export default async function NewsPage({ searchParams }: NewsPageProps) {
  const { q = "", category = "", page = "1" } = await searchParams;
  
  const allPosts = await getPosts(true); // Published only
  
  // Apply filtering
  let filteredPosts = [...allPosts];
  
  if (q.trim()) {
    const searchLower = q.toLowerCase().trim();
    filteredPosts = filteredPosts.filter(
      (p) =>
        p.title.toLowerCase().includes(searchLower) ||
        p.excerpt.toLowerCase().includes(searchLower) ||
        p.content.toLowerCase().includes(searchLower)
    );
  }
  
  if (category && category !== "Tất cả") {
    filteredPosts = filteredPosts.filter((p) => p.category === category);
  }

  const itemsPerPage = 6;
  const currentPage = parseInt(page, 10) || 1;
  
  // Determine featured post (always show the global featured post on page 1 as long as there is no search query active)
  const showFeatured = currentPage === 1 && !q;
  const featuredPost = allPosts.find((p) => p.featured === 1) || allPosts[0] || null;
  let displayPosts = [...filteredPosts];

  if (showFeatured && featuredPost) {
    // Exclude featured article from the general listing so it doesn't appear twice
    displayPosts = displayPosts.filter((p) => p.id !== featuredPost.id);
  }

  // Calculate pagination
  const totalItems = displayPosts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedPosts = displayPosts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <>
      <PublicHeader />
      <main className="min-h-screen theme-page py-12">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          
          {/* Header Title */}
          <div className="mb-12 text-center md:text-left">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#e31837] mb-2">
              AUTOMOTIVE JOURNAL
            </p>
            <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
              Tin Tức & Bài Viết
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 theme-subtle">
              Đánh giá thực tế, kinh nghiệm chọn mua xe cũ, xu hướng thị trường và tư vấn kỹ thuật từ đội ngũ chuyên gia tại showroom.
            </p>
          </div>

          {/* Featured Article Section */}
          {showFeatured && featuredPost && (
            <div className="mb-16">
              <div className="group relative grid gap-8 overflow-hidden rounded-md border theme-border theme-surface-strong p-6 md:grid-cols-[1.2fr_0.8fr] md:p-8 lg:p-10">
                {/* Image */}
                <Link href={`/news/${featuredPost.slug}`} className="relative aspect-[16/10] overflow-hidden rounded-md bg-[var(--muted)] md:aspect-auto md:h-full">
                  <Image
                    src={featuredPost.thumbnail}
                    alt={featuredPost.title}
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 60vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                </Link>

                {/* Content */}
                <div className="flex flex-col justify-center">
                  <div className="mb-4 flex items-center gap-3">
                    <Badge tone="info">Nổi bật</Badge>
                    <Badge tone={featuredPost.category === "Đánh giá" ? "info" : featuredPost.category === "Tư vấn mua xe" ? "reserved" : "available"}>
                      {featuredPost.category}
                    </Badge>
                    <span className="text-xs theme-subtle">•</span>
                    <span className="text-xs theme-subtle">
                      {new Date(featuredPost.created_at).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <Link href={`/news/${featuredPost.slug}`}>
                    <h2 className="font-display text-2xl font-bold leading-tight text-[var(--foreground)] group-hover:text-[#e31837] transition-colors duration-300 md:text-3xl lg:text-4xl">
                      {featuredPost.title}
                    </h2>
                  </Link>

                  <p className="mt-4 text-sm leading-relaxed theme-subtle">
                    {featuredPost.excerpt}
                  </p>

                  <div className="mt-6 flex items-center gap-2.5 text-xs font-semibold text-[var(--foreground)]">
                    <User size={14} className="text-[#e31837]" />
                    <span>Tác giả: {featuredPost.author}</span>
                  </div>

                  <div className="mt-8">
                    <Link
                      href={`/news/${featuredPost.slug}`}
                      className="inline-flex items-center gap-2 rounded bg-[#e31837] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#c2142d]"
                    >
                      Đọc bài viết <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters (Search & Categories) */}
          <NewsFilters />

          {/* Articles Listing Grid */}
          {paginatedPosts.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedPosts.map((post) => (
                <NewsCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="rounded-md border theme-border theme-surface-strong p-12 text-center">
              <p className="text-lg font-semibold theme-subtle">Không tìm thấy bài viết nào phù hợp.</p>
              <p className="mt-2 text-sm theme-subtle">Vui lòng thử từ khóa khác hoặc xóa bộ lọc.</p>
              <Link href="/news" className="mt-4 inline-block text-xs font-bold uppercase tracking-wider text-[#e31837] hover:underline">
                Đặt lại bộ lọc
              </Link>
            </div>
          )}

          {/* Pagination Navigation */}
          {totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-4 border-t theme-border pt-8">
              {currentPage > 1 ? (
                <Link
                  href={`/news?${new URLSearchParams({
                    ...(q ? { q } : {}),
                    ...(category ? { category } : {}),
                    page: String(currentPage - 1),
                  }).toString()}`}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border theme-border theme-surface-strong theme-subtle hover:border-[#e31837] hover:text-[var(--foreground)] transition"
                >
                  <ArrowLeft size={16} />
                </Link>
              ) : (
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border theme-border bg-[var(--muted)] theme-subtle cursor-not-allowed">
                  <ArrowLeft size={16} />
                </span>
              )}

              <span className="text-sm font-semibold theme-subtle">
                Trang {currentPage} / {totalPages}
              </span>

              {currentPage < totalPages ? (
                <Link
                  href={`/news?${new URLSearchParams({
                    ...(q ? { q } : {}),
                    ...(category ? { category } : {}),
                    page: String(currentPage + 1),
                  }).toString()}`}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border theme-border theme-surface-strong theme-subtle hover:border-[#e31837] hover:text-[var(--foreground)] transition"
                >
                  <NextIcon size={16} />
                </Link>
              ) : (
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border theme-border bg-[var(--muted)] theme-subtle cursor-not-allowed">
                  <NextIcon size={16} />
                </span>
              )}
            </div>
          )}

        </div>
      </main>
      <Footer />
    </>
  );
}
