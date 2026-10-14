import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
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
