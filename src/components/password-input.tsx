"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { LockSimpleIcon } from "@phosphor-icons/react/ssr";
import { cx, inputStyles } from "./ui";

export function PasswordInput({ id, name, defaultValue, error }: { id: string; name: string; defaultValue?: string; error?: string }) {
  const t = useTranslations("login");
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <LockSimpleIcon aria-hidden size={18} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-text-2" />
      <input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        autoComplete="current-password"
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cx(inputStyles, "pr-24 pl-10")}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 right-0 min-w-11 px-3.5 text-sm font-medium text-accent"
      >
        {visible ? t("hide") : t("show")}
      </button>
    </div>
  );
}
