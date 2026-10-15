"use server";

import { eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { z } from "zod";
import { db, pgCode } from "@/db";
import { customers, orderEvents, orders } from "@/db/schema";
import { ForbiddenError, requireRole } from "./session";

export type NoteState = { ok: true } | { ok: false; error: "invalid" | "forbidden" | "notFound" } | null;

const note = z.string().trim().max(500);
const input = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("order"), id: z.coerce.number().int().positive(), note }),
  z.object({ kind: z.literal("customer"), id: z.string().min(1).max(80), note }),
]);

/** Enregistre la note interne d'une commande ou d'un client. Réservé à la gérante. */
export async function saveNote(_previous: NoteState, form: FormData): Promise<NoteState> {
  const parsed = input.safeParse({ kind: form.get("kind"), id: form.get("id"), note: form.get("note") ?? "" });
  if (!parsed.success) return { ok: false, error: "invalid" };
  let me;
  try {
    me = await requireRole("manager");
  } catch (e) {
    if (e instanceof ForbiddenError) return { ok: false, error: "forbidden" };
    throw e;
  }
  const value = parsed.data.note || null;

  if (parsed.data.kind === "order") {
    const { id } = parsed.data;
    try {
      // La note et sa ligne d'historique ensemble. Une note effacée ne laisse pas de trace dans l'historique.
      const [updated] = await db.batch([
        db.update(orders).set({ note: value }).where(eq(orders.id, id)).returning({ id: orders.id }),
        ...(value ? [db.insert(orderEvents).values({ orderId: id, userId: me.id, userName: me.name, kind: "noteAdded" })] : []),
      ]);
      if (updated.length === 0) return { ok: false, error: "notFound" };
    } catch (e) {
      // 23503, la commande n'existe pas (la démo a pu être remise à zéro entre-temps).
      if (pgCode(e) === "23503") return { ok: false, error: "notFound" };
      throw e;
    }
  } else {
    const updated = await db.update(customers).set({ note: value }).where(eq(customers.id, parsed.data.id)).returning({ id: customers.id });
    if (updated.length === 0) return { ok: false, error: "notFound" };
  }

  refresh();
  return { ok: true };
}
