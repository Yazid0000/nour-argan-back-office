import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * Pilote HTTP de Neon. Chaque requête est un appel HTTPS indépendant.
 * - Les écrans peuvent lancer dix lectures en parallèle (mesuré, 20 simultanées passent).
 * - Les écritures groupées passent par db.batch([...]), en une seule transaction Postgres,
 *   tout réussit ou rien n'est gardé.
 * Le pilote WebSocket échouait souvent depuis le poste de dev (voir instrumentation.ts pour la cause).
 */
export const db = drizzle({ client: neon(process.env.DATABASE_URL!), schema, casing: "snake_case" });

/** Le code d'erreur Postgres. Drizzle l'enveloppe dans cause, sauf pour db.batch qui le laisse passer tel quel. */
export const pgCode = (e: unknown) => (e as { cause?: { code?: string }; code?: string }).cause?.code ?? (e as { code?: string }).code;
