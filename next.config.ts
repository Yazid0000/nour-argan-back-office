import type { NextConfig } from "next";
import { blobHost } from "./src/lib/photos";

const photoHost = blobHost();

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  // Le cron et le bouton « Réinitialiser » lisent les photos de démo sur le disque, pour les renvoyer dans Blob si elles y manquent.
  outputFileTracingIncludes: {
    "/api/cron/reset": ["./src/db/demo-photos/*.jpg"],
    "/[locale]/app/parametres": ["./src/db/demo-photos/*.jpg"],
  },
  // Next ne redimensionne que les images de notre espace Vercel Blob, rangées dans produits/.
  images: {
    remotePatterns: photoHost ? [{ protocol: "https", hostname: photoHost, pathname: "/produits/**" }] : [],
  },
  // En-têtes de sécurité sur toutes les réponses. frame-ancestors et X-Frame-Options empêchent d'afficher
  // le back-office dans le cadre d'un autre site (clickjacking). Les scripts ne sont pas bloqués par la CSP,
  // Next en écrit dans chaque page et les autoriser un par un rendrait toutes les pages dynamiques.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  // Pas de page d'accueil. On arrive directement sur la connexion, dans la bonne langue.
  async redirects() {
    return [
      { source: "/", destination: "/connexion", permanent: false },
      { source: "/en", destination: "/en/connexion", permanent: false },
    ];
  },
  turbopack: {
    // Un package-lock.json traîne dans le dossier utilisateur et tromperait Turbopack.
    root: process.cwd(),
    // Remplace le plugin de next-intl, qui charge @swc/core. Ce binaire refuse de démarrer
    // sur ce Windows à cause d'une vérification des droits de son cache.
    resolveAlias: { "next-intl/config": "./src/i18n/request.ts" },
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
