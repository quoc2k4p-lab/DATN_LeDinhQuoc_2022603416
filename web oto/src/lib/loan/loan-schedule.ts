import { calculateLoan, LoanInput } from "./emi";

export interface ScheduleRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  remainingBalance: number;
}

/**
 * Generates the full amortization schedule for the loan.
 */
export function generateAmortizationSchedule(input: LoanInput): ScheduleRow[] {
  const { loanAmount, termMonths, annualRate, monthlyPayment } = calculateLoan(input);
  
  if (loanAmount <= 0 || termMonths <= 0) return [];

  const schedule: ScheduleRow[] = [];
  let remainingBalance = loanAmount;
  const monthlyRate = annualRate / 12 / 100;

  for (let m = 1; m <= termMonths; m++) {
    let interest = 0;
    if (annualRate > 0) {
      interest = Math.round(remainingBalance * monthlyRate);
    }
    
    let principal = monthlyPayment - interest;

    // Adjust for the last month to clear the balance exactly
    if (m === termMonths || remainingBalance - principal < 0) {
      principal = remainingBalance;
      interest = Math.max(0, monthlyPayment - principal);
    }

    remainingBalance = Math.max(0, remainingBalance - principal);

    schedule.push({
      month: m,
      payment: principal + interest,
      principal,
      interest,
      remainingBalance,
    });
  }

  return schedule;
}

/**
 * Generates a localized CSV content for download.
 */
export function exportToCsvString(schedule: ScheduleRow[], carName: string): string {
  const headers = [
    "Tháng",
    "Tiền trả gốc (VND)",
    "Tiền trả lãi (VND)",
    "Tổng thanh toán (VND)",
    "Dư nợ còn lại (VND)"
  ];

  const rows = schedule.map((row) => [
    `Tháng ${row.month}`,
    row.principal,
    row.interest,
    row.payment,
    row.remainingBalance
  ]);

  const csvContent = [
    `Bảng tính trả góp xe: ${carName}`,
    "",
    headers.join(","),
    ...rows.map(r => r.join(","))
  ].join("\n");

  return "\uFEFF" + csvContent; // Add BOM for Excel UTF-8
}
