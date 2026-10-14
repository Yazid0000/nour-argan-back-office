import { useLocale, useTranslations } from "next-intl";
import { ThemeToggle } from "@/components/theme-toggle";
import { Link } from "@/i18n/navigation";

// Page provisoire de la phase 0 : vérifie polices, couleurs, mode sombre et langues.
export default function Home() {
  const t = useTranslations("home");
  const otherLocale = useLocale() === "fr" ? "en" : "fr";

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 px-4 py-12">
      <p className="text-sm text-text-2">Nour Argan</p>
      <h1 className="font-display text-3xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="text-text-2">{t("intro")}</p>

      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="flex items-baseline justify-between">
          <span className="font-medium">{t("sample")}</span>
          <span className="font-mono">1 240 MAD</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
          <span className="rounded-full bg-ok-bg px-2 py-0.5 text-ok-fg">{t("delivered")}</span>
          <span className="rounded-full bg-warn-bg px-2 py-0.5 text-warn-fg">{t("toConfirm")}</span>
          <span className="rounded-full bg-err-bg px-2 py-0.5 text-err-fg">{t("outOfStock")}</span>
          <span className="rounded-full bg-neutral-bg px-2 py-0.5 text-neutral-fg">{t("cancelled")}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button className="min-h-11 rounded-lg bg-accent px-4 font-medium text-accent-fg">
          {t("primary")}
        </button>
        <ThemeToggle />
        <Link
          href="/"
          locale={otherLocale}
          className="flex min-h-11 items-center px-2 font-medium text-accent underline-offset-4 hover:underline"
        >
          {t("switchLanguage")}
        </Link>
      </div>
    </main>
  );
}
