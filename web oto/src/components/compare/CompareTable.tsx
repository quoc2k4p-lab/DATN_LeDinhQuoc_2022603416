"use client";

import { Check, X, CheckCircle2 } from "lucide-react";
import { CarSpecsExtended } from "@/lib/compare/compare-engine";

interface CompareTableProps {
  cars: CarSpecsExtended[];
  scrollRef: React.RefObject<HTMLDivElement | null>;
}

export function CompareTable({ cars, scrollRef }: CompareTableProps) {
  // Helper to extract numeric price for best-value checks
  const getNumericPrice = (priceStr: string) => Number(priceStr.replace(/\D/g, "")) || 0;

  // Find index of the best car for a specific metric
  const getBestIndex = (
    extractor: (car: CarSpecsExtended) => number,
    lowerIsBetter: boolean = false
  ): number => {
    if (cars.length < 2) return -1;
    
    let bestValue = extractor(cars[0]);
    let bestIndex = 0;
    let allEqual = true;

    for (let i = 1; i < cars.length; i++) {
      const val = extractor(cars[i]);
      if (val !== bestValue) {
        allEqual = false;
      }
      if (lowerIsBetter) {
        if (val < bestValue) {
          bestValue = val;
          bestIndex = i;
        }
      } else {
        if (val > bestValue) {
          bestValue = val;
          bestIndex = i;
        }
      }
    }

    return allEqual ? -1 : bestIndex;
  };

  const bestIndices = {
    price: getBestIndex((c) => getNumericPrice(c.price), true),
    horsepower: getBestIndex((c) => c.horsepower, false),
    torque: getBestIndex((c) => c.torque, false),
    acceleration: getBestIndex((c) => c.acceleration, true),
    maxSpeed: getBestIndex((c) => c.maxSpeed, false),
    fuelCombined: getBestIndex((c) => c.fuelCombined, true),
    fuelUrban: getBestIndex((c) => c.fuelUrban, true),
    fuelExtraUrban: getBestIndex((c) => c.fuelExtraUrban, true),
    length: getBestIndex((c) => c.length, false),
    width: getBestIndex((c) => c.width, false),
    height: getBestIndex((c) => c.height, false),
    wheelbase: getBestIndex((c) => c.wheelbase, false),
  };

  // Render cells helpers
  const renderRow = (
    label: string,
    extractor: (car: CarSpecsExtended) => React.ReactNode,
    bestIndex: number = -1
  ) => {
    return (
      <tr className="border-b border-[var(--line)] hover:bg-[var(--foreground)]/[0.01] transition duration-150 group/row">
        <td className="px-5 py-3.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--subtle)] bg-[var(--background)]/40 w-[180px] sm:w-[200px] align-middle border-r border-[var(--line)] select-none">
          <div className="min-h-[40px] flex items-center break-words overflow-hidden">
            {label}
          </div>
        </td>
        {cars.map((car, index) => {
          const isBest = index === bestIndex;
          return (
            <td
              key={car.id}
              className={`relative px-5 py-3.5 align-middle transition duration-150 border-l border-[var(--line)]/50 ${
                isBest
                  ? "text-emerald-500 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.015]"
                  : "text-[var(--foreground)] opacity-90"
              }`}
            >
              <div className="min-h-[40px] flex items-center pr-6 break-words overflow-hidden text-xs sm:text-sm font-semibold">
                <span className={isBest ? "font-bold text-emerald-500" : ""}>{extractor(car)}</span>
              </div>
              {isBest && (
                <span className="absolute top-1/2 -translate-y-1/2 right-3.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/25 shadow-[0_0_8px_rgba(16,185,129,0.12)] animate-pulse shrink-0">
                  <Check size={11} strokeWidth={3} />
                </span>
              )}
            </td>
          );
        })}
        {cars.length < 3 &&
          Array.from({ length: 3 - cars.length }).map((_, i) => (
            <td key={`empty-${i}`} className="px-5 py-3.5 bg-[var(--background)]/[0.02] border-l border-[var(--line)]/30 align-middle">
              <div className="min-h-[40px] flex items-center" />
            </td>
          ))}
      </tr>
    );
  };

  const renderBooleanRow = (
    label: string,
    key: keyof CarSpecsExtended
  ) => {
    return renderRow(label, (car) => {
      const isTrue = car[key] === true;
      return isTrue ? (
        <span className="flex items-center gap-1.5 text-emerald-500 font-bold">
          <CheckCircle2 size={15} className="text-emerald-500 shrink-0" /> Có
        </span>
      ) : (
        <span className="flex items-center gap-1.5 text-[var(--subtle)] opacity-50 font-semibold">
          <X size={15} className="shrink-0" /> Không
        </span>
      );
    });
  };

  const renderHeaderSection = (title: string) => {
    return (
      <tr className="bg-gradient-to-r from-[var(--surface-strong)] to-[var(--background)] border-y border-[var(--line)]">
        <td
          colSpan={4}
          className="px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#e31837] border-l-4 border-[#e31837] select-none"
        >
          {title}
        </td>
      </tr>
    );
  };

  // Programmatic spec definitions for Mobile layout
  interface MobileSpecItem {
    label: string;
    valueKey?: keyof CarSpecsExtended;
    extractor?: (car: CarSpecsExtended) => React.ReactNode;
    bestIndex?: number;
    isBoolean?: boolean;
  }

  interface MobileSpecGroup {
    title: string;
    specs: MobileSpecItem[];
  }

  const specGroups: MobileSpecGroup[] = [
    {
      title: "1. Giá bán & Khuyến mãi",
      specs: [
        { label: "Giá bán", extractor: (c) => c.price, bestIndex: bestIndices.price },
        { label: "Khuyến mãi", extractor: (c) => c.pricePromo || "Liên hệ đại lý" },
      ],
    },
    {
      title: "2. Động cơ",
      specs: [
        { label: "Loại động cơ", valueKey: "engineType" },
        { label: "Dung tích xi lanh", extractor: (c) => c.engineSize > 0 ? `${c.engineSize.toFixed(1)} L` : "N/A" },
        { label: "Công suất tối đa", extractor: (c) => `${c.horsepower} HP`, bestIndex: bestIndices.horsepower },
        { label: "Mô-men xoắn cực đại", extractor: (c) => `${c.torque} Nm`, bestIndex: bestIndices.torque },
      ],
    },
    {
      title: "3. Vận hành",
      specs: [
        { label: "Hộp số", valueKey: "transmission" },
        { label: "Hệ dẫn động", valueKey: "drivetrain" },
        { label: "Tăng tốc (0-100 km/h)", extractor: (c) => `${c.acceleration} giây`, bestIndex: bestIndices.acceleration },
        { label: "Tốc độ tối đa", extractor: (c) => `${c.maxSpeed} km/h`, bestIndex: bestIndices.maxSpeed },
      ],
    },
    {
      title: "4. Tiêu hao nhiên liệu",
      specs: [
        { label: "Trong đô thị", extractor: (c) => c.fuelUrban > 0 ? `${c.fuelUrban} lít/100km` : "0 (Xe điện)", bestIndex: bestIndices.fuelUrban },
        { label: "Ngoài đô thị", extractor: (c) => c.fuelExtraUrban > 0 ? `${c.fuelExtraUrban} lít/100km` : "0 (Xe điện)", bestIndex: bestIndices.fuelExtraUrban },
        { label: "Đường hỗn hợp", extractor: (c) => c.fuelCombined > 0 ? `${c.fuelCombined} lít/100km` : "0 (Xe điện)", bestIndex: bestIndices.fuelCombined },
      ],
    },
    {
      title: "5. Kích thước & Trọng lượng",
      specs: [
        { label: "Chiều dài", extractor: (c) => c.length, bestIndex: bestIndices.length },
        { label: "Chiều rộng", extractor: (c) => c.width, bestIndex: bestIndices.width },
        { label: "Chiều cao", extractor: (c) => c.height, bestIndex: bestIndices.height },
        { label: "Chiều dài cơ sở", extractor: (c) => c.wheelbase, bestIndex: bestIndices.wheelbase },
      ],
    },
    {
      title: "6. Tiện nghi & Giải trí",
      specs: [
        { label: "Ghế bọc da", valueKey: "leatherSeats", isBoolean: true },
        { label: "Cửa sổ trời", valueKey: "sunroof", isBoolean: true },
        { label: "Apple CarPlay", valueKey: "appleCarplay", isBoolean: true },
        { label: "Android Auto", valueKey: "androidAuto", isBoolean: true },
        { label: "Camera 360 độ", valueKey: "cam360", isBoolean: true },
        { label: "Màn hình kính lái HUD", valueKey: "hud", isBoolean: true },
      ],
    },
    {
      title: "7. Trang bị an toàn",
      specs: [
        { label: "Hệ thống ABS", valueKey: "abs", isBoolean: true },
        { label: "Hệ thống cân bằng ESP", valueKey: "esp", isBoolean: true },
        { label: "Số lượng túi khí", extractor: (c) => `${c.airbags} túi khí` },
        { label: "Hệ thống ADAS", valueKey: "adas", isBoolean: true },
        { label: "Cảnh báo lệch làn", valueKey: "laneDepartureWarning", isBoolean: true },
        { label: "Cảnh báo điểm mù", valueKey: "blindSpotMonitoring", isBoolean: true },
      ],
    },
  ];

  return (
    <>
      {/* Desktop/Tablet view: stable, perfectly aligned table layout */}
      <div ref={scrollRef} className="hidden md:block overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)] shadow-2xl shadow-black/5 dark:shadow-black/40">
        <div className="overflow-x-auto scrollbar-none">
          <table className="w-full min-w-[800px] border-collapse text-left table-fixed">
            <colgroup>
              <col className="w-[180px] sm:w-[200px]" />
              <col className="w-[calc((100%-180px)/3)] sm:w-[calc((100%-200px)/3)]" />
              <col className="w-[calc((100%-180px)/3)] sm:w-[calc((100%-200px)/3)]" />
              <col className="w-[calc((100%-180px)/3)] sm:w-[calc((100%-200px)/3)]" />
            </colgroup>
            
            {/* Table Header */}
            <thead className="select-none bg-[var(--surface)] border-b border-[var(--line)]">
              <tr>
                <th className="px-5 py-3.5 bg-[var(--surface)] align-middle border-r border-[var(--line)]">
                  <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--foreground)] opacity-70">
                    Thông số kỹ thuật
                  </span>
                </th>
                {Array.from({ length: 3 }).map((_, index) => {
                  const car = cars[index];
                  if (car) {
                    return (
                      <th
                        key={car.id}
                        className="px-5 py-3.5 bg-[var(--surface)] text-left border-l border-[var(--line)] align-middle"
                      >
                        <span className="font-bold text-xs sm:text-sm text-[#e31837] line-clamp-2 break-words whitespace-normal">
                          {car.name}
                        </span>
                      </th>
                    );
                  } else {
                    return (
                      <th
                        key={`empty-th-${index}`}
                        className="px-5 py-3.5 bg-[var(--surface)] text-left border-l border-[var(--line)] align-middle"
                      >
                        <span className="font-bold text-xs sm:text-sm text-[var(--subtle)] opacity-40">
                          Trống
                        </span>
                      </th>
                    );
                  }
                })}
              </tr>
            </thead>

            {/* Table Body (Spec Rows) */}
            <tbody>
              {/* 1. GIÁ BÁN */}
              {renderHeaderSection("1. Giá bán & Khuyến mãi")}
              {renderRow("Giá bán", (c) => c.price, bestIndices.price)}
              {renderRow("Khuyến mãi", (c) => c.pricePromo || "Liên hệ đại lý")}

              {/* 2. ĐỘNG CƠ */}
              {renderHeaderSection("2. Động cơ")}
              {renderRow("Loại động cơ", (c) => c.engineType)}
              {renderRow("Dung tích xi lanh", (c) => c.engineSize > 0 ? `${c.engineSize.toFixed(1)} L` : "N/A")}
              {renderRow("Công suất tối đa", (c) => `${c.horsepower} HP`, bestIndices.horsepower)}
              {renderRow("Mô-men xoắn cực đại", (c) => `${c.torque} Nm`, bestIndices.torque)}

              {/* 3. VẬN HÀNH */}
              {renderHeaderSection("3. Vận hành")}
              {renderRow("Hộp số", (c) => c.transmission)}
              {renderRow("Hệ dẫn động", (c) => c.drivetrain)}
              {renderRow("Tăng tốc (0-100 km/h)", (c) => `${c.acceleration} giây`, bestIndices.acceleration)}
              {renderRow("Tốc độ tối đa", (c) => `${c.maxSpeed} km/h`, bestIndices.maxSpeed)}

              {/* 4. TIÊU HAO NHIÊN LIỆU */}
              {renderHeaderSection("4. Tiêu hao nhiên liệu")}
              {renderRow("Trong đô thị", (c) => c.fuelUrban > 0 ? `${c.fuelUrban} lít/100km` : "0 (Xe điện)", bestIndices.fuelUrban)}
              {renderRow("Ngoài đô thị", (c) => c.fuelExtraUrban > 0 ? `${c.fuelExtraUrban} lít/100km` : "0 (Xe điện)", bestIndices.fuelExtraUrban)}
              {renderRow("Đường hỗn hợp", (c) => c.fuelCombined > 0 ? `${c.fuelCombined} lít/100km` : "0 (Xe điện)", bestIndices.fuelCombined)}

              {/* 5. KÍCH THƯỚC */}
              {renderHeaderSection("5. Kích thước & Trọng lượng")}
              {renderRow("Chiều dài", (c) => c.length, bestIndices.length)}
              {renderRow("Chiều rộng", (c) => c.width, bestIndices.width)}
              {renderRow("Chiều cao", (c) => c.height, bestIndices.height)}
              {renderRow("Chiều dài cơ sở", (c) => c.wheelbase, bestIndices.wheelbase)}

              {/* 6. TIỆN NGHI */}
              {renderHeaderSection("6. Tiện nghi & Giải trí")}
              {renderBooleanRow("Ghế bọc da", "leatherSeats")}
              {renderBooleanRow("Cửa sổ trời", "sunroof")}
              {renderBooleanRow("Apple CarPlay", "appleCarplay")}
              {renderBooleanRow("Android Auto", "androidAuto")}
              {renderBooleanRow("Camera 360 độ", "cam360")}
              {renderBooleanRow("Màn hình kính lái HUD", "hud")}

              {/* 7. AN TOÀN */}
              {renderHeaderSection("7. Trang bị an toàn")}
              {renderBooleanRow("Hệ thống ABS", "abs")}
              {renderBooleanRow("Hệ thống cân bằng ESP", "esp")}
              {renderRow("Số lượng túi khí", (c) => `${c.airbags} túi khí`)}
              {renderBooleanRow("Hệ thống ADAS", "adas")}
              {renderBooleanRow("Cảnh báo lệch làn", "laneDepartureWarning")}
              {renderBooleanRow("Cảnh báo điểm mù", "blindSpotMonitoring")}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile view: beautiful, clean card list grouped by spec section */}
      <div className="block md:hidden space-y-6">
        {specGroups.map((group) => (
          <div key={group.title} className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-4 shadow-md space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-[#e31837] border-l-2 border-[#e31837] pl-2 select-none">
              {group.title}
            </h4>
            <div className="space-y-4 divide-y divide-[var(--line)]/40">
              {group.specs.map((spec, specIdx) => {
                return (
                  <div key={spec.label} className={`${specIdx > 0 ? "pt-3" : ""} space-y-1.5`}>
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-[var(--subtle)] select-none">
                      {spec.label}
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {cars.map((car, index) => {
                        const isBest = index === spec.bestIndex;
                        let displayValue: React.ReactNode = "";
                        if (spec.extractor) {
                          displayValue = spec.extractor(car);
                        } else if (spec.valueKey) {
                          if (spec.isBoolean) {
                            displayValue = car[spec.valueKey] === true ? (
                              <span className="flex items-center gap-1 text-emerald-500 font-bold text-xs">
                                <CheckCircle2 size={13} className="shrink-0" /> Có
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[var(--subtle)] opacity-60 text-xs">
                                <X size={13} className="shrink-0" /> Không
                              </span>
                            );
                          } else {
                            displayValue = String(car[spec.valueKey]);
                          }
                        }

                        return (
                          <div
                            key={car.id}
                            className={`p-2.5 rounded-lg border border-[var(--line)]/55 relative bg-[var(--background)]/30 flex flex-col justify-between min-h-[72px] ${
                              isBest ? "border-emerald-500/30 bg-emerald-500/[0.02] dark:bg-emerald-500/[0.01]" : ""
                            }`}
                          >
                            <div className="text-[9px] text-[#e31837] font-black uppercase tracking-wider truncate mb-1">
                              {car.name}
                            </div>
                            <div className={`text-xs font-semibold break-words pr-4 ${isBest ? "text-emerald-500 font-bold" : "text-[var(--foreground)] opacity-90"}`}>
                              {displayValue}
                            </div>
                            {isBest && (
                              <span className="absolute top-2 right-2 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/25">
                                <Check size={8} strokeWidth={3} />
                              </span>
                            )}
                          </div>
                        );
                      })}
                      {/* Empty slots for spacing matching the columns if < 3 */}
                      {cars.length < 3 && Array.from({ length: 3 - cars.length }).map((_, i) => (
                        <div key={`empty-mob-spec-${i}`} className="p-2.5 rounded-lg border border-dashed border-[var(--line)]/30 bg-transparent flex items-center justify-center min-h-[72px]">
                          <span className="text-[9px] text-[var(--subtle)] opacity-30 font-bold select-none">Trống</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
