import { useLocale, useTranslations } from "next-intl";
import { EnvelopeSimpleIcon } from "@phosphor-icons/react/ssr";
import { PasswordInput } from "@/components/password-input";
import { buttonStyles, cx, inputStyles } from "@/components/ui";
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

        {/* La connexion par e-mail arrive à la phase 3. */}
        <form className="mt-8 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium">{t("email")}</label>
            <div className="relative">
              <EnvelopeSimpleIcon aria-hidden size={18} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-text-2" />
              <input id="email" name="email" type="email" autoComplete="email" defaultValue="salma@nourargan.ma" className={cx(inputStyles, "pl-10")} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm font-medium">{t("password")}</label>
            <PasswordInput id="password" name="password" defaultValue="demo-salma" />
          </div>
        </form>

        <div className="mt-auto flex flex-col gap-2.5 pt-10 lg:mt-8 lg:pt-0">
          <Link href="/app" className={cx(buttonStyles.primary, "h-[52px] text-base")}>
            {t("asManager")}
          </Link>
          <Link href="/app/preparation" className={cx(buttonStyles.secondary, "h-[52px] text-base")}>
            {t("asPreparer")}
          </Link>
        </div>
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
