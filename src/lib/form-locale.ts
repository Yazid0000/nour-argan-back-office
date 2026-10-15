import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";

/**
 * La langue de la page qui a envoyé le formulaire (champ caché « locale »).
 * Dans une Server Action, Next ne fournit pas la langue de l'adresse (next/root-params).
 * On ne fait pas confiance au champ. Une valeur inconnue redevient le français.
 */
export function formLocale(form: FormData) {
  const locale = form.get("locale");
  return typeof locale === "string" && hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
}
