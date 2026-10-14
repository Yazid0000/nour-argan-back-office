import { getSessionCookie } from "better-auth/cookies";
import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intl = createMiddleware(routing);

// "/app", "/en/app"… construit à partir des langues, pour qu'en ajouter une ne demande rien ici.
const prefixes = routing.locales.filter((l) => l !== routing.defaultLocale).join("|");
const appPath = new RegExp(`^(/(?:${prefixes}))?/app(/|$)`);

export default function proxy(request: NextRequest) {
  const match = appPath.exec(request.nextUrl.pathname);
  // Tri rapide, sans base de données. Pas de cookie de session, pas d'accès à /app.
  // Ce n'est qu'un filtre. La vraie vérification (session valide et rôle) se fait côté serveur, page par page.
  if (match && !getSessionCookie(request)) {
    return NextResponse.redirect(new URL(`${match[1] ?? ""}/connexion`, request.url));
  }
  return intl(request);
}

export const config = {
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
