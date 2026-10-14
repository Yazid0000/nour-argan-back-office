"use client";

import { useTranslations } from "next-intl";

export function ThemeToggle() {
  const t = useTranslations("theme");

  function toggle() {
    const dark = document.documentElement.classList.toggle("dark");
    try {
      localStorage.theme = dark ? "dark" : "light";
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="min-h-11 rounded-lg border border-border bg-surface px-4 text-sm font-medium"
    >
      {t("toggle")}
    </button>
  );
}
