import { defineConfig } from "drizzle-kit";
import "./src/db/network";

// drizzle-kit tourne hors de Next, qui ne lui passe donc pas .env.local. Node sait le lire seul.
// Sans fichier (CI, Vercel), les variables viennent déjà de l'environnement.
try {
  process.loadEnvFile(".env.local");
} catch {}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  casing: "snake_case",
  // Connexion directe, sans le pooler, dont les migrations ont besoin.
  dbCredentials: { url: process.env.DATABASE_URL_UNPOOLED! },
});
