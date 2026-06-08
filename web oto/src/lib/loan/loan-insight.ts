import { calculateLoan } from "./emi";

export interface LoanInsightItem {
  type: "down_payment" | "term";
  title: string;
  description: string;
  originalInterest: number;
  newInterest: number;
  savings: number;
  newPercent?: number;
  newTerm?: number;
}

/**
 * Generates savings suggestions based on current loan configuration.
 */
export function getLoanInsights(
  carPrice: number,
  currentPercent: number,
  annualRate: number,
  currentTermMonths: number
): LoanInsightItem[] {
  const insights: LoanInsightItem[] = [];

  // Base Calculation
  const baseLoan = calculateLoan({
    carPrice,
    downPaymentPercent: currentPercent,
    annualRate,
    termMonths: currentTermMonths,
  });

  // 1. Suggest Higher Down Payment
  if (currentPercent < 90) {
    const targetPercent = Math.min(90, currentPercent + 10);
    const targetLoan = calculateLoan({
      carPrice,
      downPaymentPercent: targetPercent,
      annualRate,
      termMonths: currentTermMonths,
    });
    
    const savings = baseLoan.totalInterest - targetLoan.totalInterest;
    
    if (savings > 1000) {
      insights.push({
        type: "down_payment",
        title: `Tăng trả trước từ ${currentPercent}% lên ${targetPercent}%`,
        description: `Nếu nâng mức trả trước lên ${targetPercent}% (${new Intl.NumberFormat("vi-VN").format(targetLoan.downPaymentAmount)}đ), bạn sẽ giảm số tiền vay từ ${new Intl.NumberFormat("vi-VN").format(baseLoan.loanAmount)}đ xuống ${new Intl.NumberFormat("vi-VN").format(targetLoan.loanAmount)}đ.`,
        originalInterest: baseLoan.totalInterest,
        newInterest: targetLoan.totalInterest,
        savings,
        newPercent: targetPercent,
      });
    }
  }

  // 2. Suggest Shorter Term
  if (currentTermMonths > 12) {
    // Determine next shorter term
    const terms = [12, 24, 36, 48, 60, 72, 84];
    const currentIndex = terms.indexOf(currentTermMonths);
    
    // Default to 12 months lower, or minimum 12
    let targetTerm = 12;
    if (currentIndex > 0) {
      targetTerm = terms[currentIndex - 1];
    } else if (currentTermMonths === 84) {
      targetTerm = 60; // Standard jump
    } else {
      targetTerm = Math.max(12, currentTermMonths - 12);
    }

    const targetLoan = calculateLoan({
      carPrice,
      downPaymentPercent: currentPercent,
      annualRate,
      termMonths: targetTerm,
    });

    const savings = baseLoan.totalInterest - targetLoan.totalInterest;

    if (savings > 1000) {
      insights.push({
        type: "term",
        title: `Rút ngắn kỳ hạn từ ${currentTermMonths} tháng xuống ${targetTerm} tháng`,
        description: `Bằng việc giảm thời gian trả góp xuống ${targetTerm} tháng, mặc dù tiền trả hàng tháng sẽ tăng lên, tổng chi phí lãi suất bạn phải chịu sẽ giảm đi đáng kể.`,
        originalInterest: baseLoan.totalInterest,
        newInterest: targetLoan.totalInterest,
        savings,
        newTerm: targetTerm,
      });
    }
  }

  return insights;
}
