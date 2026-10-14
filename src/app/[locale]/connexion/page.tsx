import { useLocale, useTranslations } from "next-intl";
import { LoginForm } from "@/components/login-form";
import { Link } from "@/i18n/navigation";

export default function LoginPage() {
  const t = useTranslations("login");
  const common = useTranslations("common");
  const otherLocale = useLocale() === "fr" ? "en" : "fr";

  return (
    <div className="mx-auto flex min-h-dvh max-w-[420px] flex-col px-6 pt-6 pb-[max(24px,env(safe-area-inset-bottom))] lg:justify-center">
      <div className="flex items-baseline gap-2">
        <span className="font-display text-lg font-bold tracking-[-0.02em]">{common("brand")}</span>
        <span className="text-[13px] text-text-2">{common("backOffice")}</span>
      </div>

      <main className="mt-14 flex flex-1 flex-col lg:mt-10 lg:flex-none">
        <h1 className="font-display text-[32px] font-semibold tracking-[-0.02em]">{t("title")}</h1>
        <p className="mt-2 text-[15px] text-text-2">{t("intro")}</p>

        <LoginForm />
      </main>

      <footer className="mt-8 flex items-center justify-between gap-4 text-[13px] text-text-2">
        <p>{t("pitch")}</p>
        <Link href="/connexion" locale={otherLocale} className="flex min-h-11 flex-none items-center font-medium text-accent">
          {otherLocale.toUpperCase()}
        </Link>
      </footer>
    </div>
  );
}
