import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  turbopack: {
    // Un package-lock.json traîne dans le dossier utilisateur : on fixe la racine au projet.
    root: process.cwd(),
    // Ce que fait le plugin de next-intl, sans lui : son chargement exige @swc/core,
    // dont le binaire natif refuse de démarrer sur ce Windows (vérif. de droits du cache).
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
