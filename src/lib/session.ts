import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { auth } from "./auth";
import { type Role, parseRole } from "./domain";

export type CurrentUser = { id: string; name: string; email: string; role: Role };

/**
 * Qui fait la requête. Seul point du code qui lit la session.
 * Sans session valide, on renvoie vers la connexion. cache() n'interroge la base qu'une fois par requête.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = parseRole(session?.user.role);
  // Pas de session, ou un rôle inconnu en base. On ne laisse rien passer.
  if (!session || !role) return redirect({ href: "/connexion", locale: await getLocale() });
  const { id, name, email } = session.user;
  return { id, name, email, role };
});

/** La personne connectée a-t-elle un de ces rôles ? Le serveur décide, pas le menu affiché. */
export async function hasRole(...allowed: Role[]) {
  const me = await getCurrentUser();
  return allowed.includes(me.role);
}

export class ForbiddenError extends Error {
  constructor() {
    super("Accès refusé pour ce rôle.");
  }
}

/** Pour les lectures et actions protégées. Refuse net si le rôle ne convient pas. */
export async function requireRole(...allowed: Role[]) {
  const me = await getCurrentUser();
  if (!allowed.includes(me.role)) throw new ForbiddenError();
  return me;
}
