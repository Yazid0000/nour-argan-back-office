import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { locale as rootLocale } from "next/root-params";
import { routing } from "./routing";

export default getRequestConfig(async ({ locale }) => {
  // `locale` n'arrive ici que si on le passe explicitement. Sinon on lit le segment [locale].
  if (!locale) {
    const param = await rootLocale();
    locale = hasLocale(routing.locales, param) ? param : routing.defaultLocale;
  }
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
