import type messages from "../messages/fr.json";
import type { routing } from "@/i18n/routing";

// TypeScript connaît les langues et toutes les clés de texte. Une clé absente ne compile pas.
declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}
