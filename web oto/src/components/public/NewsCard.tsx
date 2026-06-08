import Link from "next/link";
import Image from "next/image";
import { Calendar, ArrowRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/Badge";
import { DbPost } from "@/lib/db";

interface NewsCardProps {
  post: DbPost;
}

export function NewsCard({ post }: NewsCardProps) {
  const locale = useLocale();
  const t = useTranslations("Common");

  // Determine badge tone
  let tone: "info" | "neutral" | "reserved" | "available" = "neutral";
  if (post.category === "Đánh giá") {
    tone = "info";
  } else if (post.category === "Tư vấn mua xe") {
    tone = "reserved";
  } else if (post.category === "Kinh nghiệm") {
    tone = "available";
  }

  // Localize content fields
  const title = locale === "en" ? (post.title_en || post.title) : (post.title_vi || post.title);
  const excerpt = locale === "en" ? (post.excerpt_en || post.excerpt) : (post.excerpt_vi || post.excerpt);

  // Format date
  const publishDate = new Date(post.created_at).toLocaleDateString(locale === "en" ? "en-US" : "vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <article className="group flex flex-col overflow-hidden rounded-md border theme-border theme-surface transition-all duration-300 hover:border-[var(--accent)]/30 hover:shadow-lg hover:shadow-black/20">
      {/* Thumbnail Image */}
      <Link href={`/${locale}/news/${post.slug}`} className="relative block aspect-[16/10] overflow-hidden bg-[var(--muted)]">
        <Image
          src={post.thumbnail}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </Link>

      {/* Card Body */}
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          <Badge tone={tone}>{post.category}</Badge>
          <div className="flex items-center gap-1.5 text-xs theme-subtle">
            <Calendar size={13} />
            <span>{publishDate}</span>
          </div>
        </div>

        <Link href={`/${locale}/news/${post.slug}`} className="group-hover:text-[#e31837] transition-colors duration-300">
          <h3 className="font-display text-lg font-bold text-[var(--foreground)] line-clamp-2 leading-snug">
            {title}
          </h3>
        </Link>

        <p className="mt-3 text-sm leading-relaxed theme-subtle line-clamp-3">
          {excerpt}
        </p>

        {/* Read More */}
        <div className="mt-auto pt-5">
          <Link
            href={`/${locale}/news/${post.slug}`}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#e31837] transition-all hover:text-[var(--foreground)] group-hover:translate-x-1"
          >
            {t("readMore")} <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </article>
  );
}
