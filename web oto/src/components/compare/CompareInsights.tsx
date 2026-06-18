"use client";

import { Sparkles, Check, AlertTriangle } from "lucide-react";
import { CarSpecsExtended } from "@/lib/compare/compare-engine";

interface CompareInsightsProps {
  cars: CarSpecsExtended[];
}

export function CompareInsights({ cars }: CompareInsightsProps) {
  const getNumericPrice = (priceStr: string) => Number(priceStr.replace(/\D/g, "")) || 0;

  // Generate dynamic pros/cons for each car compared to others
  const generateInsights = (car: CarSpecsExtended, index: number) => {
    const pros: string[] = [];
    const cons: string[] = [];

    const otherCars = cars.filter((_, idx) => idx !== index);

    if (otherCars.length > 0) {
      const carPrice = getNumericPrice(car.price);
      const otherPrices = otherCars.map((c) => getNumericPrice(c.price));
      const minOtherPrice = Math.min(...otherPrices);
      const maxOtherPrice = Math.max(...otherPrices);

      // Price Insight
      if (carPrice < minOtherPrice) {
        pros.push("Giá bán cạnh tranh nhất trong nhóm");
      } else if (carPrice > maxOtherPrice) {
        cons.push("Giá thành cao nhất trong nhóm so sánh");
      }

      // Horsepower Insight
      const otherHPs = otherCars.map((c) => c.horsepower);
      const maxOtherHP = Math.max(...otherHPs);
      const minOtherHP = Math.min(...otherHPs);
      if (car.horsepower > maxOtherHP) {
        pros.push(`Công suất mạnh mẽ nhất (${car.horsepower} HP)`);
      } else if (car.horsepower < minOtherHP) {
        cons.push(`Công suất khiêm tốn hơn đối thủ (${car.horsepower} HP)`);
      }

      // Fuel consumption Insight
      const otherFuels = otherCars.map((c) => c.fuelCombined).filter((f) => f > 0);
      if (car.fuelCombined > 0 && otherFuels.length > 0) {
        const minOtherFuel = Math.min(...otherFuels);
        const maxOtherFuel = Math.max(...otherFuels);
        if (car.fuelCombined < minOtherFuel) {
          pros.push(`Tiết kiệm nhiên liệu vượt trội (${car.fuelCombined}L/100km)`);
        } else if (car.fuelCombined > maxOtherFuel) {
          cons.push(`Mức tiêu hao nhiên liệu cao hơn (${car.fuelCombined}L/100km)`);
        }
      } else if (car.fuelCombined === 0) {
        pros.push("Xe thuần điện thân thiện môi trường, không tốn nhiên liệu hóa thạch");
      }

      // Space / Wheelbase Insight
      const otherWheelbases = otherCars.map((c) => c.wheelbase);
      const maxOtherWheelbase = Math.max(...otherWheelbases);
      if (car.wheelbase > maxOtherWheelbase) {
        pros.push(`Trục cơ sở dài nhất (${car.wheelbase} mm) mang lại cabin rộng rãi`);
      }

      // Safety / Airbags Insight
      const otherAirbags = otherCars.map((c) => c.airbags);
      const maxOtherAirbags = Math.max(...otherAirbags);
      if (car.airbags > maxOtherAirbags) {
        pros.push(`Trang bị nhiều túi khí nhất (${car.airbags} túi khí)`);
      }
    }

    // Static pros/cons based on specifications
    if (car.adas) {
      pros.push("Tích hợp hệ thống hỗ trợ lái thông minh ADAS tiên tiến");
    } else {
      cons.push("Thiếu vắng các công nghệ hỗ trợ lái chủ động nâng cao");
    }

    if (car.cam360 && car.hud) {
      pros.push("Hỗ trợ quan sát toàn cảnh Cam 360 độ và màn hình HUD tiện lợi");
    }

    if (car.sunroof) {
      pros.push("Có cửa sổ trời tạo không gian cabin thoáng đãng");
    }

    // Default fallbacks if empty
    if (pros.length === 0) {
      pros.push("Vận hành ổn định, thiết kế hiện đại hợp xu hướng");
      pros.push("Nội thất tiện nghi đầy đủ các kết nối cơ bản");
    }
    if (cons.length === 0) {
      cons.push("Trọng lượng xe khá nặng ảnh hưởng tới độ bốc ban đầu");
    }

    return { pros: pros.slice(0, 3), cons: cons.slice(0, 2) };
  };

  if (cars.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6 lg:p-8 shadow-xl flex flex-col min-h-[440px]">
        <div className="mb-6 flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.25)]">
            <Sparkles size={18} className="animate-pulse" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
              AI Insights <span className="text-[10px] font-extrabold bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 rounded px-1.5 py-0.5 uppercase tracking-wider">Beta</span>
            </h3>
            <p className="text-xs text-[var(--subtle)] mt-0.5 font-medium">Đánh giá nhanh ưu nhược điểm tương đối giữa các dòng xe</p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center flex-1 my-4 border border-dashed border-[var(--line)] rounded-xl p-6 text-center bg-[var(--background)]/[0.02]">
          <div className="h-12 w-12 rounded-full bg-zinc-800/10 dark:bg-zinc-700/20 flex items-center justify-center text-[var(--subtle)] mb-3">
            <Sparkles size={20} className="text-[var(--subtle)]" />
          </div>
          <p className="text-sm font-semibold text-[var(--foreground)]">Chưa có đánh giá từ AI</p>
          <p className="text-xs text-[var(--subtle)] mt-1 max-w-[250px]">Vui lòng thêm xe để AI phân tích và đưa ra ưu nhược điểm chi tiết</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6 lg:p-8 shadow-xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.25)]">
          <Sparkles size={18} className="animate-pulse" />
        </div>
        <div>
          <h3 className="font-display text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
            AI Insights <span className="text-[10px] font-extrabold bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 rounded px-1.5 py-0.5 uppercase tracking-wider">Beta</span>
          </h3>
          <p className="text-xs text-[var(--subtle)] mt-0.5 font-medium">Đánh giá nhanh ưu nhược điểm tương đối giữa các dòng xe</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {cars.map((car, index) => {
          const { pros, cons } = generateInsights(car, index);
          return (
            <div
              key={car.id}
              className="flex flex-col rounded-xl border border-[var(--line)] bg-[var(--surface-strong)]/30 p-5 transition-all duration-300 hover:border-[var(--line)]/80 hover:bg-[var(--surface-strong)]/60 group"
            >
              <h4 className="font-display text-sm font-extrabold text-[var(--foreground)] border-b border-[var(--line)] pb-3 truncate group-hover:text-[#e31837] transition duration-300">
                {car.name}
              </h4>

              {/* Pros list */}
              <div className="mt-4.5 flex-1">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-500">
                  Điểm nổi bật
                </p>
                <ul className="mt-3 space-y-2.5 text-xs font-semibold leading-relaxed text-[var(--foreground)] opacity-90">
                  {pros.map((pro, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/25 mt-0.5">
                        <Check size={9} strokeWidth={3} />
                      </span>
                      <span>{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Cons list */}
              <div className="mt-6 border-t border-[var(--line)] pt-4">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-500">
                  Điểm cân nhắc
                </p>
                <ul className="mt-3 space-y-2.5 text-xs font-semibold leading-relaxed text-[var(--subtle)]">
                  {cons.map((con, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/25 mt-0.5">
                        <AlertTriangle size={9} />
                      </span>
                      <span>{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
