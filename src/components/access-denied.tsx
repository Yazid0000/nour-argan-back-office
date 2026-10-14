import { useTranslations } from "next-intl";
import { LockSimpleIcon } from "@phosphor-icons/react/ssr";
import { Link } from "@/i18n/navigation";
import { EmptyState, buttonStyles, cx } from "./ui";

/** Ce qu'un préparateur voit s'il tape l'adresse d'une page de la gérante. */
export function AccessDenied() {
  const t = useTranslations("states");
  return (
    <div className="lg:px-10">
      <EmptyState icon={<LockSimpleIcon size={28} />} title={t("forbiddenTitle")}>
        <p className="max-w-sm">{t("forbiddenBody")}</p>
        <Link href="/app/preparation" className={cx(buttonStyles.primary, "mt-4 h-11")}>
          {t("forbiddenLink")}
        </Link>
      </EmptyState>
    </div>
  );
}
