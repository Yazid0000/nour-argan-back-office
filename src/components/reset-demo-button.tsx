"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowClockwiseIcon } from "@phosphor-icons/react/ssr";
import { type ResetState, resetDemoNow } from "@/lib/demo-actions";
import { buttonStyles, cx } from "./ui";

/** Remet toute la démo à zéro, après confirmation. */
export function ResetDemoButton() {
  const t = useTranslations("settings");
  const [state, action, pending] = useActionState<ResetState, FormData>(resetDemoNow, null);
  return (
    <form action={action} className="flex flex-col items-start gap-2">
      <input type="hidden" name="locale" value={useLocale()} />
      <button
        type="submit"
        disabled={pending}
        // Tout le monde perd ses essais en cours, on demande d'abord.
        onClick={(e) => {
          if (!window.confirm(t("resetConfirm"))) e.preventDefault();
        }}
        className={cx(buttonStyles.secondary, "min-h-11 text-sm disabled:opacity-50")}
      >
        <ArrowClockwiseIcon aria-hidden size={16} className={pending ? "motion-safe:animate-spin" : undefined} />
        {pending ? t("resetting") : t("reset")}
      </button>
      <p role="status" className={state ? "text-[13px] text-err-fg" : "sr-only"}>
        {state && <span className="fade-in block">{t("resetTooMany")}</span>}
      </p>
    </form>
  );
}
