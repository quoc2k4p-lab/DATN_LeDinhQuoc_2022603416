import { calculateLoan as calculateEmi } from "@/lib/loan/emi";

interface CalculateLoanParams {
  price: number;
  downPayment: number; // as percent, e.g. 30
  term: number; // in months, e.g. 60
  interestRate?: number; // e.g. 8.5
}

export async function calculateLoan(params: CalculateLoanParams) {
  const { price, downPayment, term, interestRate = 8.5 } = params;

  const results = calculateEmi({
    carPrice: price,
    downPaymentPercent: downPayment,
    annualRate: interestRate,
    termMonths: term,
  });

  return {
    carPrice: results.carPrice,
    downPaymentPercent: results.downPaymentPercent,
    downPaymentAmount: results.downPaymentAmount,
    loanAmount: results.loanAmount,
    monthlyPayment: results.monthlyPayment,
    totalInterest: results.totalInterest,
    totalPayment: results.totalPayment,
    termMonths: results.termMonths,
    interestRate: results.annualRate,
  };
}
