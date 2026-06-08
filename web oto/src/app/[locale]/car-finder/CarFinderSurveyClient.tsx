"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Sparkles, RefreshCw, Car, Calendar, DollarSign } from "lucide-react";
import { getFinderRecommendationsAction } from "@/lib/actions/finderActions";

interface CarFinderSurveyClientProps {
  locale: string;
}

const BUDGET_OPTIONS = [
  { value: "< 500", label: "Dưới 500 triệu", desc: "Các dòng xe đô thị cỡ nhỏ hạng A/B giá rẻ" },
  { value: "500-800", label: "500 - 800 triệu", desc: "Xe sedan/SUV cỡ nhỏ, nhiều lựa chọn gia đình" },
  { value: "800-1000", label: "800 triệu - 1 tỷ", desc: "Crossover gầm cao cỡ C hoặc sedan hạng D" },
  { value: "1000-1500", label: "1 tỷ - 1.5 tỷ", desc: "SUV cỡ trung sang trọng hoặc bán tải cao cấp" },
  { value: "> 1500", label: "Trên 1.5 tỷ", desc: "Xe hạng sang, dòng xe nhập khẩu đẳng cấp" },
];

const PURPOSE_OPTIONS = [
  { value: "family", label: "Phục vụ gia đình", desc: "Ưu tiên không gian rộng rãi, êm ái, cách âm tốt" },
  { value: "service", label: "Chạy xe dịch vụ", desc: "Tối ưu chi phí mua xe ban đầu và nhiên liệu" },
  { value: "city", label: "Di chuyển trong phố", desc: "Gầm cao linh hoạt hoặc hatchback xoay sở dễ dàng" },
  { value: "luxury", label: "Gặp gỡ đối tác (Doanh nhân)", desc: "Thiết kế sang trọng, thương hiệu lịch lãm" },
  { value: "offroad", label: "Dã ngoại & Off-road", desc: "Động cơ mạnh mẽ, dẫn động 4 bánh kiên cố" },
];

const SEAT_OPTIONS = [
  { value: 5, label: "5 chỗ ngồi", desc: "Sedan 5 chỗ hoặc Crossover đô thị nhỏ gọn" },
  { value: 7, label: "7 chỗ ngồi", desc: "SUV/MPV cỡ lớn cho gia đình đông người" },
];

const FUEL_OPTIONS = [
  { value: "Xăng", label: "Động cơ Xăng", desc: "Phổ biến nhất, vận hành êm ái, bốc" },
  { value: "Dầu", label: "Động cơ Dầu (Diesel)", desc: "Mô-men xoắn cao, khỏe khoắn, tiết kiệm cho đường xa" },
  { value: "Điện", label: "Động cơ Điện (EV)", desc: "Không tiếng ồn, bảo vệ môi trường, công nghệ mới" },
  { value: "Hybrid", label: "Động cơ Hybrid (Xăng lai Điện)", desc: "Êm ái đô thị, không lo sạc, cực kỳ tiết kiệm" },
];

const PRIORITY_OPTIONS = [
  { value: "economy", label: "Tiết kiệm nhiên liệu", desc: "Tối ưu hóa số tiền đổ xăng hàng tháng" },
  { value: "safety", label: "Trang bị an toàn", desc: "Gia cố túi khí, phanh chủ động và khung gầm vững chắc" },
  { value: "luxury", label: "Nội ngoại thất sang trọng", desc: "Hoàn thiện da cao cấp, chi tiết ốp gỗ, chrome sang chảnh" },
  { value: "technology", label: "Công nghệ & Tiện ích", desc: "Màn hình lớn, kết nối thông minh, hỗ trợ tự động lái" },
  { value: "comfort", label: "Cảm giác lái & Hiệu suất", desc: "Khung gầm chắc chắn, cách âm tốt, tăng tốc phấn khích" },
];

export default function CarFinderSurveyClient({ locale }: CarFinderSurveyClientProps) {
  const [step, setStep] = useState(1);
  const [budget, setBudget] = useState("");
  const [purpose, setPurpose] = useState("");
  const [seats, setSeats] = useState<number | null>(null);
  const [fuel, setFuel] = useState("");
  const [priority, setPriority] = useState("");
  const [isPending, startTransition] = useTransition();
  const [recommendations, setRecommendations] = useState<any[]>([]);

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    } else {
      // Calculate recommendations on step 5
      setStep(6);
      startTransition(async () => {
        const res = await getFinderRecommendationsAction({
          budget,
          purpose,
          fuel,
          seats: seats || undefined,
          priority,
        });
        if (res.success && res.recommendations) {
          setRecommendations(res.recommendations);
        }
      });
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleReset = () => {
    setStep(1);
    setBudget("");
    setPurpose("");
    setSeats(null);
    setFuel("");
    setPriority("");
    setRecommendations([]);
  };

  // Determine if next button should be disabled
  const isNextDisabled = () => {
    if (step === 1 && !budget) return true;
    if (step === 2 && !purpose) return true;
    if (step === 3 && !seats) return true;
    if (step === 4 && !fuel) return true;
    if (step === 5 && !priority) return true;
    return false;
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN").format(val) + " đ";
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#151a22] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#e31837]/5 blur-3xl pointer-events-none" />

      {step <= 5 && (
        <div className="mb-6 flex items-center justify-between border-b border-white/5 pb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            Khảo sát tìm xe — Bước {step} / 5
          </span>
          <div className="flex h-1.5 w-36 gap-1 rounded-full bg-zinc-800 overflow-hidden">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`h-full flex-1 rounded-full transition-colors duration-300 ${
                  s <= step ? "bg-[#e31837]" : "bg-transparent"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <h2 className="font-display text-lg font-bold text-white">Bạn dự định mua xe trong khoảng ngân sách nào?</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {BUDGET_OPTIONS.map((opt) => {
                const active = budget === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setBudget(opt.value)}
                    className={`rounded-xl border text-left p-4 transition-all duration-200 ${
                      active
                        ? "bg-[#e31837]/10 border-[#e31837] text-white"
                        : "bg-[#0d1016] border-white/5 text-zinc-400 hover:border-white/20"
                    }`}
                  >
                    <div className="flex justify-between items-center font-bold text-white">
                      <span>{opt.label}</span>
                      {active && <Check size={16} className="text-[#e31837]" />}
                    </div>
                    <p className="text-xs text-zinc-500 mt-1 font-medium leading-relaxed">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <h2 className="font-display text-lg font-bold text-white">Mục đích sử dụng xe chính của bạn là gì?</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {PURPOSE_OPTIONS.map((opt) => {
                const active = purpose === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setPurpose(opt.value)}
                    className={`rounded-xl border text-left p-4 transition-all duration-200 ${
                      active
                        ? "bg-[#e31837]/10 border-[#e31837] text-white"
                        : "bg-[#0d1016] border-white/5 text-zinc-400 hover:border-white/20"
                    }`}
                  >
                    <div className="flex justify-between items-center font-bold text-white">
                      <span>{opt.label}</span>
                      {active && <Check size={16} className="text-[#e31837]" />}
                    </div>
                    <p className="text-xs text-zinc-500 mt-1 font-medium leading-relaxed">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <h2 className="font-display text-lg font-bold text-white">Bạn ưu tiên dòng xe mấy chỗ ngồi?</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {SEAT_OPTIONS.map((opt) => {
                const active = seats === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setSeats(opt.value)}
                    className={`rounded-xl border text-left p-4 transition-all duration-200 ${
                      active
                        ? "bg-[#e31837]/10 border-[#e31837] text-white"
                        : "bg-[#0d1016] border-white/5 text-zinc-400 hover:border-white/20"
                    }`}
                  >
                    <div className="flex justify-between items-center font-bold text-white">
                      <span>{opt.label}</span>
                      {active && <Check size={16} className="text-[#e31837]" />}
                    </div>
                    <p className="text-xs text-zinc-500 mt-1 font-medium leading-relaxed">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <h2 className="font-display text-lg font-bold text-white">Loại nhiên liệu động cơ bạn ưa thích là gì?</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {FUEL_OPTIONS.map((opt) => {
                const active = fuel === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setFuel(opt.value)}
                    className={`rounded-xl border text-left p-4 transition-all duration-200 ${
                      active
                        ? "bg-[#e31837]/10 border-[#e31837] text-white"
                        : "bg-[#0d1016] border-white/5 text-zinc-400 hover:border-white/20"
                    }`}
                  >
                    <div className="flex justify-between items-center font-bold text-white">
                      <span>{opt.label}</span>
                      {active && <Check size={16} className="text-[#e31837]" />}
                    </div>
                    <p className="text-xs text-zinc-500 mt-1 font-medium leading-relaxed">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {step === 5 && (
          <motion.div
            key="step5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <h2 className="font-display text-lg font-bold text-white">Đâu là đặc tính bạn ưu tiên hàng đầu ở chiếc xe?</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {PRIORITY_OPTIONS.map((opt) => {
                const active = priority === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setPriority(opt.value)}
                    className={`rounded-xl border text-left p-4 transition-all duration-200 ${
                      active
                        ? "bg-[#e31837]/10 border-[#e31837] text-white"
                        : "bg-[#0d1016] border-white/5 text-zinc-400 hover:border-white/20"
                    }`}
                  >
                    <div className="flex justify-between items-center font-bold text-white">
                      <span>{opt.label}</span>
                      {active && <Check size={16} className="text-[#e31837]" />}
                    </div>
                    <p className="text-xs text-zinc-500 mt-1 font-medium leading-relaxed">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {step === 6 && (
          <motion.div
            key="step6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {isPending ? (
              <div className="py-16 text-center space-y-4">
                <RefreshCw className="animate-spin text-[#e31837] mx-auto" size={40} />
                <p className="text-sm font-semibold text-zinc-400 animate-pulse">
                  Hệ thống AI đang tính toán thang điểm và đề cử xe phù hợp nhất...
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-white/5 pb-4">
                  <Sparkles className="text-amber-400" size={20} />
                  <h3 className="font-display text-xl font-bold text-white">Kết quả tìm kiếm của bạn</h3>
                </div>

                {recommendations.length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-3">
                    {recommendations.map((rec, idx) => (
                      <div
                        key={rec.id}
                        className={`rounded-xl border bg-[#0d1016] p-5 flex flex-col justify-between hover:-translate-y-1 transition-all duration-200 relative overflow-hidden ${
                          idx === 0 ? "border-amber-500/40 shadow-lg shadow-amber-500/5" : "border-white/5"
                        }`}
                      >
                        {idx === 0 && (
                          <div className="absolute right-0 top-0 bg-amber-500 text-black font-black text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-bl-lg">
                            Phù hợp nhất
                          </div>
                        )}
                        <div>
                          <div className="aspect-[16/10] w-full rounded-lg overflow-hidden bg-zinc-800 relative mb-4">
                            <img src={rec.thumbnail} alt={rec.name} className="h-full w-full object-cover" />
                          </div>
                          
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#e31837]">
                              {rec.brand}
                            </span>
                            <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-bold ${
                              rec.score >= 90
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-blue-500/10 text-blue-400"
                            }`}>
                              {rec.matchPercent} phù hợp
                            </span>
                          </div>

                          <h4 className="font-display text-base font-bold text-white mb-1 truncate">{rec.name}</h4>
                          <p className="font-display text-sm font-extrabold text-[#e31837] mb-4">
                            {formatCurrency(rec.price)}
                          </p>

                          <div className="space-y-1.5 border-t border-white/5 pt-3 mb-6">
                            {rec.reasons.map((reason: string, rIdx: number) => (
                              <p key={rIdx} className="text-xs text-zinc-400 leading-relaxed flex items-start gap-1">
                                <span>{reason}</span>
                              </p>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-auto">
                          <a
                            href={`/${locale}/loan-calculator?carId=${rec.id}`}
                            className="inline-flex items-center justify-center gap-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] font-bold text-white py-2 transition"
                          >
                            <DollarSign size={10} /> Tính trả góp
                          </a>
                          <a
                            href={`/${locale}/appointments?carId=${rec.id}`}
                            className="inline-flex items-center justify-center gap-1 rounded bg-[#e31837] hover:bg-[#c1132a] text-[10px] font-bold text-white py-2 transition"
                          >
                            <Calendar size={10} /> Đặt lịch hẹn
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-zinc-500 font-medium">
                    Không tìm thấy xe nào phù hợp. Vui lòng thử lại với khoảng ngân sách rộng hơn hoặc bớt tiêu chí lọc.
                  </div>
                )}

                <div className="flex justify-center border-t border-white/5 pt-6 mt-6">
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 font-bold text-sm text-white px-6 py-3 transition"
                  >
                    <RefreshCw size={14} /> Làm khảo sát mới
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {step <= 5 && (
        <div className="flex justify-between items-center border-t border-white/5 pt-6 mt-6">
          <button
            onClick={handleBack}
            disabled={step === 1}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-zinc-900/40 hover:bg-zinc-800 text-xs font-bold text-white px-4 py-2.5 transition disabled:opacity-20 disabled:pointer-events-none"
          >
            <ArrowLeft size={14} /> Quay lại
          </button>

          <button
            onClick={handleNext}
            disabled={isNextDisabled()}
            className="flex items-center gap-1.5 rounded-xl bg-[#e31837] hover:bg-[#c1132a] text-xs font-bold text-white px-5 py-2.5 transition disabled:opacity-30 disabled:pointer-events-none"
          >
            {step === 5 ? "Xem kết quả" : "Tiếp theo"} <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
