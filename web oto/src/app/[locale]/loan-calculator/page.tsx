export const dynamic = "force-dynamic";

import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getUiCars } from "@/lib/dbAdapter";
import { PublicHeader } from "@/components/public/PublicHeader";
import { Footer } from "@/components/public/Footer";
import { LoanCalculator } from "@/components/loan/LoanCalculator";

export const metadata: Metadata = {
  title: "Máy tính trả góp ô tô online | Tính toán khoản vay mua xe nhanh chóng | TQ Auto",
  description: "Công cụ tính toán khoản vay mua xe ô tô trả góp trực tuyến. Ước tính tiền trả trước, dư nợ vay ngân hàng, lãi suất và lịch trả nợ hàng tháng (EMI) chính xác nhất.",
  openGraph: {
    title: "Máy tính trả góp ô tô online | TQ Auto",
    description: "Ước tính số tiền trả trước, khoản vay ngân hàng và lịch trả gốc lãi hàng tháng chính xác nhất.",
    images: ["https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&h=630&q=80"],
  },
};

interface LoanCalculatorPageProps {
  params: Promise<{ locale: string }>;
}

export default async function LoanCalculatorPage({ params }: LoanCalculatorPageProps) {
  const { locale } = await params;
  const t = await getTranslations("CarDetails");

  // Fetch available vehicles to allow selecting in standalone simulator
  const allUiCars = await getUiCars(locale);

  // Map to simple CarInfo schema for simulator
  const cars = allUiCars.map((car) => ({
    id: car.id,
    name: car.name,
    brand: car.brand,
    price: parseInt(car.price.replace(/\D/g, ""), 10) || 0,
    image: car.image,
  }));

  // JSON-LD structured schema object
  const schemaJson = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FinancialProduct",
        "@id": `https://tqauto.vn/${locale}/loan-calculator#financial-product`,
        "name": "Công cụ tính trả góp ô tô - TQ Auto",
        "description": "Tính toán tiền trả trước, số tiền vay và lịch trả nợ hàng tháng khi mua ô tô trả góp tại Showroom TQ Auto.",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "VND"
        }
      },
      {
        "@type": "LoanOrCredit",
        "@id": `https://tqauto.vn/${locale}/loan-calculator#loan-or-credit`,
        "name": "Hỗ trợ vay mua xe trả góp Showroom TQ Auto",
        "amount": {
          "@type": "MonetaryAmount",
          "currency": "VND"
        },
        "interestRate": 8.5,
        "loanTerm": {
          "@type": "QuantitativeValue",
          "value": 84,
          "unitCode": "MON"
        }
      }
    ]
  };

  return (
    <>
      {/* Schema Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJson) }}
      />

      <PublicHeader />
      <main className="min-h-screen theme-page py-6">
        <LoanCalculator cars={cars} />
      </main>
      <Footer />
    </>
  );
}
