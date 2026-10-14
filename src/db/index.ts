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
