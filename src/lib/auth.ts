import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import { account, session, user, verification } from "@/db/schema";
import { roles } from "./domain";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema: { user, session, account, verification } }),
  emailAndPassword: {
    enabled: true,
    // Pas d'inscription publique. Les comptes viennent du seed (et plus tard de « Inviter quelqu'un »).
    disableSignUp: true,
  },
  user: {
    additionalFields: {
      // input: false, personne ne peut choisir son rôle en envoyant un formulaire.
      role: { type: [...roles], required: true, defaultValue: "preparer", input: false },
    },
  },
  session: { expiresIn: 60 * 60 * 24 * 7 },
  // Permet aux Server Actions de poser le cookie de session après la connexion.
  plugins: [nextCookies()],
});

/** Les deux comptes démo. Le mot de passe vient de l'environnement, jamais du code. */
export const demoAccounts = {
  manager: { id: "user-salma", name: "Salma", email: "salma@nourargan.ma" },
  preparer: { id: "user-youssef", name: "Youssef", email: "youssef@nourargan.ma" },
} as const;
