import { useTranslations } from "next-intl";
import { CompassIcon } from "@phosphor-icons/react/ssr";
import { EmptyState, buttonStyles, cx } from "@/components/ui";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("states");
  return (
    <div className="lg:px-10">
      <EmptyState icon={<CompassIcon size={28} />} title={t("notFound")}>
        <Link href="/app" className={cx(buttonStyles.secondary, "mt-2 min-h-11")}>{t("notFoundLink")}</Link>
      </EmptyState>
    </div>
  );
}
