import { sql } from "drizzle-orm";
import { db, pgCode } from "@/db";
import { type Action, actionTarget, fromStatuses, stockEffect } from "./domain";

export type TransitionResult = "ok" | "conflict" | "outOfStock";

/** Une liste SQL « ('a', 'b') » avec un paramètre par valeur. */
const list = (values: string[]) => sql`(${sql.join(values.map((v) => sql`${v}`), sql`, `)})`;

/**
 * Fait avancer une commande en une seule requête SQL, donc tout réussit ou rien ne change.
 * 1. La commande est verrouillée (FOR UPDATE). Un second clic simultané attend son tour.
 * 2. Le statut ne change que si le statut actuel autorise cette action.
 * 3. Le stock est retiré ou remis selon l'action.
 * 4. L'historique garde qui a fait quoi.
 * La règle stock >= 0 de la base fait tout annuler s'il manque une unité.
 * Ne vérifie PAS qui appelle. C'est le rôle de la Server Action (order-actions.ts).
 */
export async function applyOrderAction(orderId: number, action: Action, by: { id: string; name: string }): Promise<TransitionResult> {
  const effect = stockEffect[action];
  const stock = effect
    ? sql`, stock as (
        update variants v set stock = v.stock + ${effect.sign} * l.qty
        from order_lines l, changed c
        where l.order_id = c.id and v.id = l.variant_id
        ${effect.onlyFrom ? sql`and c.from_status in ${list(effect.onlyFrom)}` : sql``}
        returning v.id
      )`
    : sql``;

  try {
    const result = await db.execute<{ changed: number }>(sql`
      with locked as (
        select id, status from orders where id = ${orderId} for update
      ),
      changed as (
        update orders o set status = ${actionTarget[action]}
        from locked
        where o.id = locked.id and locked.status in ${list(fromStatuses(action))}
        returning o.id, locked.status as from_status
      )
      ${stock},
      event as (
        insert into order_events (order_id, user_id, user_name, kind)
        select id, ${by.id}, ${by.name}, ${actionTarget[action]} from changed
        returning id
      )
      select count(*)::int as changed from changed
    `);
    // 0 ligne modifiée. La commande n'existe pas, ou quelqu'un l'a déjà fait avancer entre-temps.
    return Number(result.rows[0]?.changed ?? 0) > 0 ? "ok" : "conflict";
  } catch (e) {
    // 23514, une règle CHECK a refusé. Ici c'est stock >= 0.
    if (pgCode(e) === "23514") return "outOfStock";
    throw e;
  }
}
