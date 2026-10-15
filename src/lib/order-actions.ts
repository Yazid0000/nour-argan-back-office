"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { type Action, actionRoles, actions } from "./domain";
import { applyOrderAction } from "./order-transition";
import { ForbiddenError, requireRole } from "./session";

export type OrderActionState =
  | { ok: true; action: Action }
  | { ok: false; error: "invalid" | "forbidden" | "conflict" | "outOfStock" }
  | null;

// Ce que le navigateur a le droit d'envoyer. Tout le reste est refusé avant de toucher à la base.
const input = z.object({
  orderId: z.coerce.number().int().positive().max(2_147_483_647),
  action: z.enum(actions),
});

/** Bouton d'action sur une commande. Vérifie l'entrée, puis la session et le rôle, puis agit. */
export async function runOrderAction(_previous: OrderActionState, form: FormData): Promise<OrderActionState> {
  const parsed = input.safeParse({ orderId: form.get("orderId"), action: form.get("action") });
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { orderId, action } = parsed.data;

  let me;
  try {
    me = await requireRole(...actionRoles[action]);
  } catch (e) {
    if (e instanceof ForbiddenError) return { ok: false, error: "forbidden" };
    throw e;
  }

  const result = await applyOrderAction(orderId, action, me);
  if (result !== "ok") return { ok: false, error: result };
  refresh();
  return { ok: true, action };
}
