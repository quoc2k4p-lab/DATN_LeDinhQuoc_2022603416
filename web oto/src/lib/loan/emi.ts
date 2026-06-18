/**
 * Core Loan EMI Calculator Utilities
 */

export interface LoanInput {
  carPrice: number;
  downPaymentPercent: number; // e.g. 30 for 30%
  annualRate: number; // e.g. 8.5 for 8.5%
  termMonths: number; // e.g. 60 for 60 months
}

export interface LoanOutput {
  carPrice: number;
  downPaymentPercent: number;
  downPaymentAmount: number;
  loanAmount: number;
  annualRate: number;
  termMonths: number;
  monthlyPayment: number;
  totalInterest: number;
  totalPayment: number;
}

/**
 * Calculates loan outcomes based on inputs using the EMI amortization formula.
 */
export function calculateLoan(input: LoanInput): LoanOutput {
  const { carPrice, downPaymentPercent, annualRate, termMonths } = input;

  const downPaymentAmount = Math.round((carPrice * downPaymentPercent) / 100);
  const loanAmount = carPrice - downPaymentAmount;

  let monthlyPayment = 0;
  if (loanAmount > 0) {
    if (annualRate === 0) {
      monthlyPayment = Math.round(loanAmount / termMonths);
    } else {
      const monthlyRate = annualRate / 12 / 100;
      const compoundFactor = Math.pow(1 + monthlyRate, termMonths);
      monthlyPayment = Math.round(
        (loanAmount * monthlyRate * compoundFactor) / (compoundFactor - 1)
      );
    }
  }

  const totalPayment = monthlyPayment * termMonths;
  const totalInterest = Math.max(0, totalPayment - loanAmount);

  return {
    carPrice,
    downPaymentPercent,
    downPaymentAmount,
    loanAmount,
    annualRate,
    termMonths,
    monthlyPayment,
    totalInterest,
    totalPayment,
  };
}
