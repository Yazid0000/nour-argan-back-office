import { defineRouting } from "next-intl/routing";

// Pas de détection de la langue du navigateur, pour que "/" reste toujours en FR.
export const routing = defineRouting({
  locales: ["fr", "en"],
  defaultLocale: "fr",
  localePrefix: "as-needed",
  localeDetection: false,
});
