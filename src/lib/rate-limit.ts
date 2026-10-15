import "server-only";

/**
 * Compte les événements récents par clé (adresse IP, e-mail) et dit quand une limite est atteinte.
 * ponytail: compteur en mémoire, propre à chaque instance du serveur. Il arrête un script naïf, pas une
 * attaque répartie. Upstash Redis si un vrai site l'exige.
 */
export function rateLimit(max: number, windowMs: number) {
  const hits = new Map<string, number[]>();
  const recent = (key: string) => {
    const now = Date.now();
    const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    // Une clé sans événement récent disparaît, la mémoire ne grossit pas indéfiniment.
    if (list.length) hits.set(key, list);
    else hits.delete(key);
    return list;
  };
  return {
    reached: (key: string) => recent(key).length >= max,
    record: (key: string) => hits.set(key, [...recent(key), Date.now()]),
  };
}

/** L'adresse IP du visiteur. Sur Vercel, x-forwarded-for est réécrit par la plateforme. */
export const clientIp = (h: Headers) => h.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
