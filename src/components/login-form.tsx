"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { EnvelopeSimpleIcon, WarningCircleIcon } from "@phosphor-icons/react/ssr";
import { type LoginState, signIn } from "@/lib/auth-actions";
import { PasswordInput } from "./password-input";
import { buttonStyles, cx, inputStyles } from "./ui";

export function LoginForm() {
  const t = useTranslations("login");
  // useActionState garde la réponse de l'action (l'erreur éventuelle) et dit si l'envoi est en cours.
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, null);
  const messages = { missing: "errorMissing", invalid: "errorInvalid", tooMany: "errorTooMany", demo: "errorDemo" } as const;
  const error = state?.error ? t(messages[state.error]) : undefined;

  return (
    <form action={action} className="flex flex-1 flex-col">
      <input type="hidden" name="locale" value={useLocale()} />
      <div className="mt-8 flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-medium">{t("email")}</label>
          <div className="relative">
            <EnvelopeSimpleIcon aria-hidden size={18} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-text-2" />
            <input id="email" key={state?.email} name="email" type="email" autoComplete="email" defaultValue={state?.email} placeholder={t("emailPlaceholder")} className={cx(inputStyles, "pl-10")} />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-sm font-medium">{t("password")}</label>
          <PasswordInput id="password" name="password" error={error} />
          {error && (
            <p id="password-error" role="alert" className="flex items-start gap-1.5 text-xs text-err-fg">
              <WarningCircleIcon aria-hidden size={14} className="mt-px flex-none" />
              {error}
            </p>
          )}
        </div>
        {/* Premier bouton du formulaire, celui que déclenche la touche Entrée. */}
        <button type="submit" disabled={pending} className="min-h-11 self-start text-sm font-semibold text-accent disabled:opacity-50">
          {t("signIn")}
        </button>
      </div>

      <div className="mt-auto flex flex-col gap-2.5 pt-10 lg:mt-8 lg:pt-0">
        <button type="submit" name="demo" value="manager" disabled={pending} className={cx(buttonStyles.primary, "h-[52px] text-base")}>
          {t("asManager")}
        </button>
        <button type="submit" name="demo" value="preparer" disabled={pending} className={cx(buttonStyles.secondary, "h-[52px] text-base disabled:opacity-50")}>
          {t("asPreparer")}
        </button>
      </div>
    </form>
  );
}
