import type { Cents, Currency } from "./domain";

/** La boutique vit à l'heure de Marrakech, même si le serveur tourne en UTC. */
export const TIME_ZONE = "Africa/Casablanca";

/** "2026-10-13" dans le fuseau de la boutique. Sert à regrouper par jour. */
export const dayKey = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: TIME_ZONE });

// Le français sépare les milliers par une espace fine (U+202F), presque invisible en grand.
// On prend l'espace insécable classique, comme la maquette.
const wideSpaces = (s: string) => s.replace(/\u202f/g, "\u00a0");

export function formatMoney(cents: Cents, currency: Currency, locale: string) {
  return wideSpaces(moneyFormat(currency, locale).format(cents / 100));
}

/** Le nombre et la devise séparés, pour les grands chiffres où « MAD » est écrit plus petit. */
export function moneyParts(cents: Cents, currency: Currency, locale: string) {
  const parts = moneyFormat(currency, locale).formatToParts(cents / 100);
  return {
    amount: wideSpaces(parts.filter((p) => p.type !== "currency" && p.type !== "literal").map((p) => p.value).join("")),
    currency: parts.find((p) => p.type === "currency")?.value ?? currency,
  };
}

function moneyFormat(currency: Currency, locale: string) {
  const decimals = currency === "EUR" ? 2 : 0;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: currency === "EUR" ? "symbol" : "code",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatTime(d: Date, locale: string) {
  return d.toLocaleTimeString(locale, { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit" });
}

export function formatDay(d: Date, locale: string, withYear = false) {
  return d.toLocaleDateString(locale, {
    timeZone: TIME_ZONE,
    day: "numeric",
    month: "short",
    ...(withYear && { year: "numeric" }),
  });
}

/** "auj. 08:12", "hier 21:10", sinon "11 oct.". */
export function formatWhen(
  d: Date,
  now: Date,
  locale: string,
  labels: { today: string; yesterday: string },
  withTime = true,
) {
  const yesterday = new Date(now.getTime() - 86_400_000);
  const time = withTime ? ` ${formatTime(d, locale)}` : "";
  if (dayKey(d) === dayKey(now)) return labels.today + time;
  if (dayKey(d) === dayKey(yesterday)) return labels.yesterday + time;
  return formatDay(d, locale);
}

/** Recherche sans accents ni majuscules. "fes" trouve "Fès". */
export const normalize = (s: string) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
