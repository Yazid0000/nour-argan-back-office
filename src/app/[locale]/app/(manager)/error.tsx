"use client";

import { useTranslations } from "next-intl";
import { WarningCircleIcon } from "@phosphor-icons/react/ssr";
import { EmptyState, buttonStyles, cx } from "@/components/ui";

export default function Error({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const t = useTranslations("states");
  return (
    <div className="px-0 lg:px-10">
      <EmptyState icon={<WarningCircleIcon size={28} />} title={t("errorTitle")}>
        <p className="max-w-sm">{t("errorBody")}</p>
        <button type="button" onClick={retry} className={cx(buttonStyles.secondary, "mt-4 min-h-11")}>
          {t("retry")}
        </button>
      </EmptyState>
    </div>
  );
}
