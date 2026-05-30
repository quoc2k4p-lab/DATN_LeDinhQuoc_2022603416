import { getTranslations } from "next-intl/server";
import { NewsCard } from "@/components/public/NewsCard";
import { getPosts } from "@/lib/db";
import { Button } from "@/components/ui/Button";
import { ArrowRight } from "lucide-react";

interface HomepageNewsProps {
  locale: string;
}

export async function HomepageNews({ locale }: HomepageNewsProps) {
  const t = await getTranslations("Homepage");
  const allPosts = await getPosts(true); // Fetch published posts only
  const latestPosts = allPosts.slice(0, 3); // Get latest 3 posts

  if (latestPosts.length === 0) return null;

  return (
    <section className="py-20 border-t theme-border theme-page">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-10">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#e31837]">
              {t("newsTitle")}
            </p>
            <h2 className="font-display text-4xl font-extrabold text-[var(--foreground)]">
              {t("newsTitle")}
            </h2>
            <p className="mt-3 text-sm leading-6 theme-subtle">
              {t("newsSub")}
            </p>
          </div>
          <div className="mt-4 md:mt-0 shrink-0">
            <Button href={`/${locale}/news`} variant="secondary">
              {t("allArticles")} <ArrowRight size={16} className="ml-1" />
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {latestPosts.map((post) => (
            <NewsCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
}
