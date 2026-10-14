"use client";

import { useLayoutEffect } from "react";

// localStorage.theme vaut "light", "dark", ou rien pour suivre le système.
function applyTheme() {
  try {
    const t = localStorage.theme;
    document.documentElement.classList.toggle(
      "dark",
      t === "dark" || (!t && matchMedia("(prefers-color-scheme: dark)").matches),
    );
  } catch {}
}

export function ThemeScript() {
  // Une navigation côté client, comme un changement de langue, réécrit la classe de <html>.
  // On remet .dark avant que l'écran ne s'affiche.
  useLayoutEffect(applyTheme);

  // Au premier chargement, le script tourne pendant la lecture du HTML, donc sans flash.
  // Côté navigateur, React le rend en text/plain. Il ne s'exécute pas deux fois et React ne prévient plus.
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: `(${applyTheme})()` }}
    />
  );
}
