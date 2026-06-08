import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { CompareBar } from "@/components/compare/CompareBar";
import { ChatWidget } from "@/components/chat/ChatWidget";

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  // Validate that the incoming locale is supported
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Load translation messages for the current locale
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      {children}
      <CompareBar />
      <ChatWidget />
    </NextIntlClientProvider>
  );
}
