import type { NextConfig } from "next";
import { blobHost } from "./src/lib/photos";

const photoHost = blobHost();

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  // Next ne redimensionne que les images de notre espace Vercel Blob, rangées dans produits/.
  images: {
    remotePatterns: photoHost ? [{ protocol: "https", hostname: photoHost, pathname: "/produits/**" }] : [],
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
