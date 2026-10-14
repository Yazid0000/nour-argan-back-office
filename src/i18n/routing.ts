import { defineRouting } from "next-intl/routing";

// FR sans préfixe ("/"), EN sous "/en". Pas de détection auto : "/" reste toujours en FR.
export const routing = defineRouting({
  locales: ["fr", "en"],
  defaultLocale: "fr",
  localePrefix: "as-needed",
  localeDetection: false,
});
