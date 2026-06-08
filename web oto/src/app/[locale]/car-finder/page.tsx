export const dynamic = "force-dynamic";

import { Metadata } from "next";
import { PublicHeader } from "@/components/public/PublicHeader";
import { Footer } from "@/components/public/Footer";
import CarFinderSurveyClient from "./CarFinderSurveyClient";

export const metadata: Metadata = {
  title: "Tìm xe thông minh | Gợi ý ô tô phù hợp nhất với bạn | TQ Auto",
  description: "Trải nghiệm hệ thống tìm xe thông minh của Showroom TQ Auto. Trả lời 5 câu hỏi nhanh về ngân sách, mục đích và sở thích để tìm ra dòng xe phù hợp 100%.",
  openGraph: {
    title: "Tìm xe thông minh - TQ Auto",
    description: "Nhận đề xuất xe phù hợp nhất với tầm tiền và mục đích sử dụng của bạn.",
    images: ["https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&h=630&q=80"],
  },
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function CarFinderPage({ params }: PageProps) {
  const { locale } = await params;

  return (
    <>
      <PublicHeader />
      <main className="min-h-screen theme-page py-10">
        <div className="mx-auto max-w-4xl px-5 sm:px-8">
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e31837]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#e31837]">
              Smart Recommendation Engine
            </span>
            <h1 className="mt-3 font-display text-3xl font-extrabold text-white sm:text-4xl">
              Tìm xe thông minh phù hợp
            </h1>
            <p className="mt-2 text-sm text-zinc-400 max-w-lg mx-auto">
              Chỉ với 5 câu hỏi khảo sát nhanh, hệ thống AI của chúng tôi sẽ tính toán và đề xuất dòng xe tối ưu nhất cho bạn.
            </p>
          </div>

          <CarFinderSurveyClient locale={locale} />
        </div>
      </main>
      <Footer />
    </>
  );
}
