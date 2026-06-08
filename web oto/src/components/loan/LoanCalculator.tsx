"use client";

import { useState, useMemo } from "react";
import { Calculator, HelpCircle, Info } from "lucide-react";
import { calculateLoan } from "@/lib/loan/emi";
import { generateAmortizationSchedule } from "@/lib/loan/loan-schedule";
import { getLoanInsights, LoanInsightItem } from "@/lib/loan/loan-insight";
import { LoanSummary } from "./LoanSummary";
import { LoanPieChart } from "./LoanPieChart";
import { LoanAreaChart } from "./LoanAreaChart";
import { LoanScheduleTable } from "./LoanScheduleTable";
import { LoanInsights } from "./LoanInsights";
import { LoanLeadForm } from "./LoanLeadForm";

interface CarInfo {
  id: string;
  name: string;
  brand: string;
  price: number;
  image: string;
}

interface LoanCalculatorProps {
  initialCar?: CarInfo | null;
  cars?: CarInfo[]; // Used for standalone page
}

const TERM_OPTIONS = [
  { value: 12, label: "12 tháng (1 năm)" },
  { value: 24, label: "24 tháng (2 năm)" },
  { value: 36, label: "36 tháng (3 năm)" },
  { value: 48, label: "48 tháng (4 năm)" },
  { value: 60, label: "60 tháng (5 năm)" },
  { value: 72, label: "72 tháng (6 năm)" },
  { value: 84, label: "84 tháng (7 năm)" },
];

export function LoanCalculator({ initialCar, cars = [] }: LoanCalculatorProps) {
  // If no initial car is provided, default to first car from inventory
  const [selectedCar, setSelectedCar] = useState<CarInfo | null>(
    initialCar || (cars.length > 0 ? cars[0] : null)
  );

  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(30);
  const [annualRate, setAnnualRate] = useState<number>(8.5);
  const [termMonths, setTermMonths] = useState<number>(60);
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);

  // Auto-filled price
  const carPrice = selectedCar ? selectedCar.price : 0;
  const carName = selectedCar ? `${selectedCar.brand} ${selectedCar.name}` : "Xe ô tô";

  // Calculations
  const loanResults = useMemo(() => {
    return calculateLoan({
      carPrice,
      downPaymentPercent,
      annualRate,
      termMonths,
    });
  }, [carPrice, downPaymentPercent, annualRate, termMonths]);

  const schedule = useMemo(() => {
    return generateAmortizationSchedule({
      carPrice,
      downPaymentPercent,
      annualRate,
      termMonths,
    });
  }, [carPrice, downPaymentPercent, annualRate, termMonths]);

  const insights = useMemo(() => {
    return getLoanInsights(carPrice, downPaymentPercent, annualRate, termMonths);
  }, [carPrice, downPaymentPercent, annualRate, termMonths]);

  // Apply AI Insights directly
  const handleApplyInsight = (item: LoanInsightItem) => {
    if (item.type === "down_payment" && item.newPercent !== undefined) {
      setDownPaymentPercent(item.newPercent);
    } else if (item.type === "term" && item.newTerm !== undefined) {
      setTermMonths(item.newTerm);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN").format(val) + " đ";
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Lead Form Modal */}
      <LoanLeadForm
        isOpen={isLeadFormOpen}
        onClose={() => setIsLeadFormOpen(false)}
        carId={selectedCar ? selectedCar.id : null}
        carPrice={carPrice}
        downPaymentPercent={downPaymentPercent}
        downPaymentAmount={loanResults.downPaymentAmount}
        loanAmount={loanResults.loanAmount}
        interestRate={annualRate}
        termMonths={termMonths}
        monthlyPayment={loanResults.monthlyPayment}
        totalInterest={loanResults.totalInterest}
        totalPayment={loanResults.totalPayment}
        carName={carName}
        onSuccess={() => {
          // Additional trigger or callbacks if needed
        }}
      />

      <div className="mb-8 flex items-center gap-3 border-b border-line pb-5">
        <Calculator className="text-[#e31837]" size={28} />
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
            Máy tính trả góp thông minh
          </h2>
          <p className="text-sm text-subtle mt-1">
            Thiết lập khoản vay ngân hàng, lãi suất ưu đãi và lập lịch thanh toán chi tiết.
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start pb-20 lg:pb-0">
        {/* Left Hand side: Form & Charts & Schedules */}
        <div className="space-y-8 min-w-0">
          {/* Inputs Section */}
          <div className="rounded-2xl border border-line bg-surface p-6 space-y-6">
            <h3 className="font-display text-base font-bold text-foreground mb-2 flex items-center gap-2">
              <Info size={16} className="text-[#e31837]" />
              Tham số khoản vay
            </h3>

            <div className="grid gap-6 sm:grid-cols-2">
              {/* Car Selector (only when no initial car is provided) */}
              {!initialCar && cars.length > 0 && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-subtle uppercase tracking-wider mb-2">
                    Chọn dòng xe muốn mua
                  </label>
                  <select
                    value={selectedCar ? selectedCar.id : ""}
                    onChange={(e) => {
                      const found = cars.find((c) => c.id === e.target.value);
                      if (found) setSelectedCar(found);
                    }}
                    className="w-full rounded-lg border border-line bg-background px-4 py-2.5 text-sm text-foreground focus:border-[#e31837] focus:outline-none transition-colors"
                  >
                    {cars.map((car) => (
                      <option key={car.id} value={car.id} className="bg-surface text-foreground">
                        {car.brand} {car.name} — {new Intl.NumberFormat("vi-VN").format(car.price)}đ
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Car Price (Read Only) */}
              <div>
                <label className="block text-xs font-semibold text-subtle uppercase tracking-wider mb-2">
                  Giá xe niêm yết (Cố định)
                </label>
                <div className="w-full rounded-lg border border-line bg-muted px-4 py-2.5 text-sm font-bold text-subtle">
                  {formatCurrency(carPrice)}
                </div>
              </div>

              {/* Interest Rate */}
              <div>
                <label className="block text-xs font-semibold text-subtle uppercase tracking-wider mb-2 flex items-center justify-between">
                  Lãi suất năm (% / năm)
                  <span className="text-[10px] text-subtle/70 font-normal">Mặc định: 8.5%</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="30"
                  value={annualRate}
                  onChange={(e) => setAnnualRate(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-line bg-background px-4 py-2 text-sm text-foreground focus:border-[#e31837] focus:outline-none transition-colors font-semibold"
                />
              </div>

              {/* Down Payment Slider */}
              <div className="sm:col-span-2">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-semibold text-subtle uppercase tracking-wider">
                    Tỷ lệ trả trước: <span className="text-foreground font-bold text-sm ml-1">{downPaymentPercent}%</span>
                  </label>
                  <span className="text-xs font-bold text-emerald-400">
                    Số tiền: {formatCurrency(loanResults.downPaymentAmount)}
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="90"
                  step="5"
                  value={downPaymentPercent}
                  onChange={(e) => setDownPaymentPercent(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 rounded-lg bg-muted appearance-none cursor-pointer accent-[#e31837]"
                />
                <div className="flex justify-between text-[10px] text-subtle/70 font-semibold mt-1">
                  <span>10% (Tối thiểu)</span>
                  <span>50%</span>
                  <span>90% (Tối đa)</span>
                </div>
              </div>

              {/* Loan Term Selection */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-subtle uppercase tracking-wider mb-2">
                  Kỳ hạn vay trả góp
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
                  {TERM_OPTIONS.map((opt) => {
                    const active = termMonths === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setTermMonths(opt.value)}
                        className={`rounded-lg border text-center py-2.5 text-xs font-bold transition-all cursor-pointer ${
                          active
                            ? "bg-[#e31837] border-[#e31837] text-white shadow-md shadow-[#e31837]/15"
                            : "bg-background border-line text-subtle hover:border-subtle/50 hover:text-foreground"
                        }`}
                      >
                        {opt.value} th
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* AI Insights Card */}
          <LoanInsights insights={insights} onApplyInsight={handleApplyInsight} />

          {/* Charts Row */}
          {loanResults.loanAmount > 0 && (
            <div className="grid gap-6 md:grid-cols-[1fr_1.3fr]">
              <LoanPieChart
                loanAmount={loanResults.loanAmount}
                totalInterest={loanResults.totalInterest}
              />
              <LoanAreaChart
                schedule={schedule}
                loanAmount={loanResults.loanAmount}
              />
            </div>
          )}

          {/* Detailed Schedule Table */}
          {schedule.length > 0 && (
            <LoanScheduleTable schedule={schedule} carName={carName} />
          )}
        </div>

        {/* Right Hand side: Summary Panel (Desktop Sticky / Mobile Sheet) */}
        <div className="lg:sticky lg:top-6">
          <LoanSummary
            carPrice={carPrice}
            downPaymentPercent={downPaymentPercent}
            downPaymentAmount={loanResults.downPaymentAmount}
            loanAmount={loanResults.loanAmount}
            monthlyPayment={loanResults.monthlyPayment}
            totalInterest={loanResults.totalInterest}
            totalPayment={loanResults.totalPayment}
            termMonths={termMonths}
            onOpenLeadForm={() => setIsLeadFormOpen(true)}
          />
        </div>
      </div>
    </div>
  );
}
