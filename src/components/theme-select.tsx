"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { applyTheme } from "./theme-script";
import { cx } from "./ui";

type Choice = "system" | "light" | "dark";
const labels = { system: "themeSystem", light: "themeLight", dark: "themeDark" } as const;

export function ThemeSelect() {
  const t = useTranslations("settings");
  const [choice, setChoice] = useState<Choice>("system");

  // localStorage n'existe que dans le navigateur, on le lit donc après l'affichage.
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setChoice((localStorage.theme as Choice | undefined) ?? "system");
    } catch {}
  }, []);

  function pick(next: Choice) {
    setChoice(next);
    try {
      if (next === "system") localStorage.removeItem("theme");
      else localStorage.setItem("theme", next);
    } catch {}
    applyTheme();
  }

  return (
    <div role="radiogroup" aria-label={t("theme")} className="grid grid-cols-3 gap-1 rounded-lg border border-border bg-surface p-1">
      {(Object.keys(labels) as Choice[]).map((c) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={choice === c}
          onClick={() => pick(c)}
          className={cx("min-h-11 rounded-md px-3 text-sm", choice === c ? "bg-accent-soft font-semibold text-accent" : "font-medium text-text-2")}
        >
          {t(labels[c])}
        </button>
      ))}
    </div>
  );
}
