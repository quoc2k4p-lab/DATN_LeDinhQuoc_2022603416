export const dynamic = "force-dynamic";

import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Calendar, User, Eye, ArrowLeft, Clock } from "lucide-react";
import { PublicHeader } from "@/components/public/PublicHeader";
import { Footer } from "@/components/public/Footer";
import { ShareButtons } from "@/components/public/ShareButtons";
import { NewsCard } from "@/components/public/NewsCard";
import { getPostBySlug, getRelatedPosts, getPosts, incrementPostViews } from "@/lib/db";
import { Badge } from "@/components/ui/Badge";

interface PostDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PostDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  
  if (!post || post.published === 0) {
    return {
      title: "Bài viết không tồn tại | TQ Auto",
    };
  }

  return {
    title: `${post.title} | TQ Auto`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [post.thumbnail],
      type: "article",
    },
  };
}

function formatContent(content: string) {
  return content.split("\n").map((para, idx) => {
    const p = para.trim();
    if (!p) return null;
    
    if (p.startsWith("###")) {
      return (
        <h3 key={idx} className="font-display text-xl font-bold text-[var(--foreground)] mt-8 mb-4">
          {p.replace(/^###\s*/, "")}
        </h3>
      );
    }
    
    if (p.startsWith("##")) {
      return (
        <h2 key={idx} className="font-display text-2xl font-bold text-[var(--foreground)] mt-8 mb-4">
          {p.replace(/^##\s*/, "")}
        </h2>
      );
    }
    
    if (p.startsWith("-")) {
      return (
        <li key={idx} className="ml-5 list-disc text-sm leading-relaxed theme-subtle my-2 pl-1">
          {p.replace(/^-\s*/, "")}
        </li>
      );
    }
    
    return (
      <p key={idx} className="text-sm leading-relaxed theme-subtle my-4 text-justify">
        {p}
      </p>
    );
  });
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post || post.published === 0) {
    notFound();
  }

  // Increment view count dynamically on page load
  await incrementPostViews(post.id);

  // Fetch related posts and sidebar posts
  const relatedPosts = await getRelatedPosts(post.category, post.id, 3);
  const allPosts = await getPosts(true);
  const latestSidebar = allPosts.filter((p) => p.id !== post.id).slice(0, 4);

  // Formatting values
  const publishDate = new Date(post.created_at).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  // Calculate reading time roughly (200 words per minute)
  const wordCount = post.content.split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200) || 1;

  // Category tone
  let tone: "info" | "neutral" | "reserved" | "available" = "neutral";
  if (post.category === "Đánh giá") {
    tone = "info";
  } else if (post.category === "Tư vấn mua xe") {
    tone = "reserved";
  } else if (post.category === "Kinh nghiệm") {
    tone = "available";
  }

  return (
    <>
      <PublicHeader />
      <main className="min-h-screen theme-page py-10">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          
          {/* Back button */}
          <div className="mb-6">
            <Link
              href="/news"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider theme-subtle hover:text-[var(--foreground)] transition"
            >
              <ArrowLeft size={14} /> Quay lại tin tức
            </Link>
          </div>

          <div className="grid gap-10 lg:grid-cols-[1fr_350px]">
            {/* Left Column: Full Content */}
            <article className="space-y-6">
              
              {/* Banner Image */}
              <div className="relative aspect-[21/9] overflow-hidden rounded-md bg-[var(--muted)] border theme-border">
                <Image
                  src={post.thumbnail}
                  alt={post.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 800px"
                  className="object-cover"
                />
              </div>

              {/* Meta information */}
              <div className="flex flex-wrap items-center gap-4 text-xs theme-subtle border-b theme-border pb-4">
                <Badge tone={tone}>{post.category}</Badge>
                <div className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-[#e31837]" />
                  <span>{publishDate}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <User size={13} className="text-[#e31837]" />
                  <span>Tác giả: {post.author}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={13} className="text-[#e31837]" />
                  <span>{readingTime} phút đọc</span>
                </div>
                <div className="flex items-center gap-1.5 ml-auto">
                  <Eye size={13} />
                  <span>{post.views + 1} lượt xem</span>
                </div>
              </div>

              {/* Title */}
              <h1 className="font-display text-3xl font-extrabold leading-tight text-[var(--foreground)] sm:text-4xl md:text-5xl">
                {post.title}
              </h1>

              {/* Excerpt panel */}
              <div className="rounded-md border theme-border theme-surface-strong p-5 text-sm leading-relaxed theme-subtle italic border-l-4 border-l-[#e31837]">
                {post.excerpt}
              </div>

              {/* Content Body */}
              <div className="prose prose-invert max-w-none theme-subtle text-sm">
                {formatContent(post.content)}
              </div>

              {/* Share & Footer Section */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t theme-border pt-6 mt-8">
                <ShareButtons title={post.title} />
                <Badge tone="neutral">TQ Auto Showroom</Badge>
              </div>

            </article>

            {/* Right Column: Sidebar */}
            <aside className="space-y-8">
              
              {/* Sidebar Header / Latest Posts */}
              <div className="rounded-md border theme-border theme-surface-strong p-6">
                <h3 className="font-display text-base font-bold uppercase tracking-wider text-[var(--foreground)] border-b theme-border pb-4 mb-4">
                  Bài viết mới nhất
                </h3>
                
                {latestSidebar.length > 0 ? (
                  <div className="space-y-5">
                    {latestSidebar.map((sidebarPost) => {
                      const sidebarDate = new Date(sidebarPost.created_at).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      });
                      
                      return (
                        <div key={sidebarPost.id} className="flex gap-3 group">
                          {/* Thumbnail */}
                          <Link href={`/news/${sidebarPost.slug}`} className="relative h-14 w-20 shrink-0 overflow-hidden rounded bg-[var(--muted)]">
                            <Image
                              src={sidebarPost.thumbnail}
                              alt={sidebarPost.title}
                              fill
                              sizes="80px"
                              className="object-cover"
                            />
                          </Link>
                          
                          {/* Content */}
                          <div className="space-y-1">
                            <Link href={`/news/${sidebarPost.slug}`} className="group-hover:text-[var(--brand)] transition-colors duration-200">
                              <h4 className="text-xs font-bold text-[var(--foreground)] line-clamp-2 leading-snug">
                                {sidebarPost.title}
                              </h4>
                            </Link>
                             <p className="text-[10px] theme-subtle">{sidebarDate}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm theme-subtle">Chưa có bài viết khác.</p>
                )}
              </div>

              {/* Sidebar Banner Ad */}
              <div className="group relative overflow-hidden rounded-md border theme-banner p-6 text-center shadow-lg transition-all duration-300 hover:border-red-600/30">
                <Image
                  src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=400&q=80"
                  alt="Showroom"
                  fill
                  className="object-cover theme-banner-img"
                />
                <div className="absolute inset-0 theme-banner-overlay z-10" />
                <div className="relative z-20 space-y-4">
                  <h4 className="font-display text-lg font-bold">Bạn đang tìm mua xe chất lượng?</h4>
                  <p className="text-xs theme-banner-text-subtle">Khám phá kho xe đã kiểm định của chúng tôi và đặt lịch lái thử ngay hôm nay.</p>
                  <Link href="/cars" className="inline-block rounded bg-[#e31837] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#c2142d] transition w-full">
                    Xem kho xe
                  </Link>
                </div>
              </div>

            </aside>
          </div>

          {/* Related Articles Section */}
          {relatedPosts.length > 0 && (
            <div className="mt-16 border-t theme-border pt-12">
              <h2 className="font-display text-2xl font-bold text-[var(--foreground)] mb-8 text-center md:text-left">
                Bài viết liên quan
              </h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {relatedPosts.map((rPost) => (
                  <NewsCard key={rPost.id} post={rPost} />
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
      <Footer />
    </>
  );
}
