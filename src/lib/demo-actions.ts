"use server";

import { headers } from "next/headers";
import { resetDemo } from "@/db/reset";
import { redirect } from "@/i18n/navigation";
import { formLocale } from "./form-locale";
import { clientIp, rateLimit } from "./rate-limit";
import { requireRole } from "./session";

export type ResetState = { error: "tooMany" } | null;

// La remise à zéro touche tous les visiteurs. 3 fois par heure et par adresse IP, pas plus.
const resets = rateLimit(3, 60 * 60 * 1000);

/** « Réinitialiser les données de démo » dans Paramètres. Même remise à zéro que le cron de la nuit. */
export async function resetDemoNow(_previous: ResetState, form: FormData): Promise<ResetState> {
  await requireRole("manager");
  const ip = clientIp(await headers());
  if (resets.reached(ip)) return { error: "tooMany" };
  resets.record(ip);
  await resetDemo();
  // Les comptes démo ont été recréés, la session en cours n'existe plus. On repart de la connexion.
  return redirect({ href: "/connexion", locale: formLocale(form) });
}
