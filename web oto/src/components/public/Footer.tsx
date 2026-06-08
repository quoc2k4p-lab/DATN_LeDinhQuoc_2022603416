import { CarFront, Mail, MapPin, Phone } from "lucide-react";
import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("Footer");
  
  return (
    <footer className="border-t theme-surface text-[var(--foreground)]">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center overflow-hidden">
              <img src="/logo_tqauto.png" alt="TQ Auto Logo" className="h-full w-full object-contain drop-shadow" />
            </span>
            <span className="font-display text-xl font-extrabold uppercase">TQ Auto</span>
          </div>
          <p className="max-w-md text-sm leading-6 theme-subtle">
            {t("tagline")}
          </p>
        </div>
        <div className="space-y-4 text-sm theme-subtle">
          <p className="flex gap-3"><MapPin size={18} /> Nguyên Xá, Tây Tựu, Hà Nội</p>
          <p className="flex gap-3"><Phone size={18} /> 034 811 5938</p>
          <p className="flex gap-3"><Mail size={18} /> showroom@tqauto.vn</p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm font-semibold uppercase tracking-[0.05em] theme-subtle">
          <span>{t("inventory")}</span>
          <span>{t("consulting")}</span>
          <span>{t("booking")}</span>
          <span>{t("admin")}</span>
        </div>
      </div>
    </footer>
  );
}
