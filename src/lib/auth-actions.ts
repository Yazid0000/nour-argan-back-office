"use server";

import { headers } from "next/headers";
import { hasLocale } from "next-intl";
import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { auth, demoAccounts } from "./auth";
import { parseRole, roleHome } from "./domain";

/**
 * La langue de la page qui a envoyé le formulaire (champ caché « locale »).
 * Dans une Server Action, Next ne fournit pas la langue de l'adresse (next/root-params).
 * On ne fait pas confiance au champ. Une valeur inconnue redevient le français.
 */
function formLocale(form: FormData) {
  const locale = form.get("locale");
  return typeof locale === "string" && hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
}

// L'e-mail tapé revient avec l'erreur, car React vide le formulaire après l'envoi.
export type LoginState = { error: "missing" | "invalid" | "tooMany" | "demo"; email: string } | null;

// Better Auth limite les essais seulement sur ses routes HTTP, pas quand on l'appelle depuis une action.
// On compte donc nous-mêmes les échecs, par adresse IP et e-mail : 5 par minute au plus.
// ponytail: compteur en mémoire, propre à chaque instance du serveur. Une table en base si un vrai site l'exige.
const WINDOW_MS = 60_000;
const MAX_FAILURES = 5;
const failures = new Map<string, number[]>();

function recentFailures(key: string) {
  const now = Date.now();
  const list = (failures.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  failures.set(key, list);
  return list;
}

/**
 * Connexion. Deux cas :
 * - un bouton démo envoie seulement « manager » ou « preparer », le mot de passe reste sur le serveur ;
 * - sinon, l'e-mail et le mot de passe tapés.
 * Le navigateur ne choisit jamais le rôle, il vient du compte en base.
 */
export async function signIn(_previous: LoginState, form: FormData): Promise<LoginState> {
  const demo = form.get("demo");
  const isDemo = demo === "manager" || demo === "preparer";
  const email = isDemo ? demoAccounts[demo].email : String(form.get("email") ?? "").trim().slice(0, 200);
  const password = isDemo ? process.env.DEMO_PASSWORD : String(form.get("password") ?? "").slice(0, 200);
  if (isDemo && !password) {
    console.error("Connexion démo impossible : DEMO_PASSWORD n'est pas défini.");
    return { error: "demo", email: "" };
  }
  if (!email || !password) return { error: "missing", email };

  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
  const key = `${ip}:${email.toLowerCase()}`;
  // Les boutons démo n'envoient aucun mot de passe et ne peuvent pas servir à en deviner un. Pas de limite.
  if (!isDemo && recentFailures(key).length >= MAX_FAILURES) return { error: "tooMany", email };

  let role;
  try {
    const result = await auth.api.signInEmail({ body: { email, password }, headers: requestHeaders });
    role = parseRole(result.user.role);
  } catch {
    if (!isDemo) recentFailures(key).push(Date.now());
    if (isDemo) {
      // Un bouton démo qui échoue, c'est la démo qui n'est pas prête (base vide), pas le visiteur.
      console.error("Connexion démo refusée : la base a-t-elle été remplie (npm run db:seed) ?");
      return { error: "demo", email: "" };
    }
    // Même message que l'e-mail existe ou non, pour ne pas révéler quels comptes existent.
    return { error: "invalid", email };
  }
  if (!role) return { error: "invalid", email: isDemo ? "" : email };
  // En dehors du try, car redirect() fonctionne en lançant une exception qu'il ne faut pas attraper.
  redirect({ href: roleHome[role], locale: formLocale(form) });
  return null;
}

export async function signOut(form: FormData) {
  await auth.api.signOut({ headers: await headers() });
  redirect({ href: "/connexion", locale: formLocale(form) });
}
