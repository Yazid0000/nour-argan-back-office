// Vérifie les règles de stock des commandes sur la vraie base. Lancer avec npm run check:orders
// Le script modifie les données de démo. Il relance le seed à la fin pour tout remettre en place.
import "../src/db/network";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "../src/db";
import { orderEvents, orderLines, orders, user, variants } from "../src/db/schema";
import { demoAccounts } from "../src/lib/auth";
import { applyOrderAction } from "../src/lib/order-transition";

const tester = { id: demoAccounts.manager.id, name: "Test automatique" };

async function linesOf(orderId: number) {
  return db.select({ variantId: orderLines.variantId, qty: orderLines.qty }).from(orderLines).where(eq(orderLines.orderId, orderId));
}
async function stocks(ids: string[]) {
  const rows = await db.select({ id: variants.id, stock: variants.stock }).from(variants).where(inArray(variants.id, ids));
  return Object.fromEntries(rows.map((r) => [r.id, r.stock]));
}
async function status(orderId: number) {
  const [o] = await db.select({ status: orders.status }).from(orders).where(eq(orders.id, orderId));
  return o.status;
}

async function main() {
  // Garde-fou. Le script efface tout à la fin, il refuse une base qui a d'autres comptes que ceux de la démo.
  const demoIds = new Set<string>(Object.values(demoAccounts).map((a) => a.id));
  const accounts = await db.select({ id: user.id }).from(user);
  assert.ok(accounts.length > 0 && accounts.every((a) => demoIds.has(a.id)), "cette base n'est pas la base de démo, rien n'a été touché");

  const received = await db.select({ id: orders.id }).from(orders).where(eq(orders.status, "received")).limit(4);
  assert.ok(received.length >= 4, "il faut au moins 4 commandes à confirmer dans la démo");
  const [a, b, c, d] = received.map((r) => r.id);

  // 1. Confirmer retire exactement la quantité commandée, et l'historique garde l'auteur.
  const linesA = await linesOf(a);
  const before = await stocks(linesA.map((l) => l.variantId));
  assert.equal(await applyOrderAction(a, "confirm", tester), "ok");
  assert.equal(await status(a), "confirmed");
  const after = await stocks(linesA.map((l) => l.variantId));
  for (const l of linesA) assert.equal(after[l.variantId], before[l.variantId] - l.qty, `stock de ${l.variantId} après confirmation`);
  const [event] = await db.select().from(orderEvents).where(and(eq(orderEvents.orderId, a), eq(orderEvents.kind, "confirmed")));
  assert.equal(event.userName, tester.name, "l'historique garde le nom de la personne");
  console.log("ok  confirmer retire le stock et note l'auteur");

  // 2. Confirmer une deuxième fois est refusé et ne touche pas au stock.
  assert.equal(await applyOrderAction(a, "confirm", tester), "conflict");
  assert.deepEqual(await stocks(linesA.map((l) => l.variantId)), after);
  console.log("ok  une commande déjà confirmée est refusée");

  // 3. Deux clics en même temps. Un seul passe, le stock n'est retiré qu'une fois.
  const linesB = await linesOf(b);
  const beforeB = await stocks(linesB.map((l) => l.variantId));
  const results = await Promise.all([applyOrderAction(b, "confirm", tester), applyOrderAction(b, "confirm", tester)]);
  assert.deepEqual([...results].sort(), ["conflict", "ok"], `résultats simultanés : ${results}`);
  const afterB = await stocks(linesB.map((l) => l.variantId));
  for (const l of linesB) assert.equal(afterB[l.variantId], beforeB[l.variantId] - l.qty, "stock retiré une seule fois");
  console.log("ok  deux confirmations simultanées ne retirent le stock qu'une fois");

  // 4. S'il manque une unité, rien ne change, ni le statut ni le stock des autres articles.
  const linesC = await linesOf(c);
  await db.update(variants).set({ stock: linesC[0].qty - 1 }).where(eq(variants.id, linesC[0].variantId));
  const beforeC = await stocks(linesC.map((l) => l.variantId));
  assert.equal(await applyOrderAction(c, "confirm", tester), "outOfStock");
  assert.equal(await status(c), "received");
  assert.deepEqual(await stocks(linesC.map((l) => l.variantId)), beforeC, "aucun stock touché");
  console.log("ok  une rupture annule tout");

  // 5. Annuler une commande confirmée remet le stock ; annuler une commande non confirmée n'y touche pas.
  // (Mesuré juste avant, car le test 4 a pu changer le stock d'un format que la commande A contient aussi.)
  const beforeCancel = await stocks(linesA.map((l) => l.variantId));
  assert.equal(await applyOrderAction(a, "cancel", tester), "ok");
  const afterCancel = await stocks(linesA.map((l) => l.variantId));
  for (const l of linesA) assert.equal(afterCancel[l.variantId], beforeCancel[l.variantId] + l.qty, `stock de ${l.variantId} remis`);
  const linesD = await linesOf(d);
  const beforeD = await stocks(linesD.map((l) => l.variantId));
  assert.equal(await applyOrderAction(d, "cancel", tester), "ok");
  assert.deepEqual(await stocks(linesD.map((l) => l.variantId)), beforeD, "aucun stock remis pour une commande jamais confirmée");
  console.log("ok  annuler remet le stock seulement s'il avait été retiré");

  // 6. Un retour après livraison remet le stock.
  const [delivered] = await db.select({ id: orders.id }).from(orders).where(eq(orders.status, "delivered")).limit(1);
  const linesE = await linesOf(delivered.id);
  const beforeE = await stocks(linesE.map((l) => l.variantId));
  assert.equal(await applyOrderAction(delivered.id, "recordReturn", tester), "ok");
  assert.equal(await status(delivered.id), "returned");
  const afterE = await stocks(linesE.map((l) => l.variantId));
  for (const l of linesE) assert.equal(afterE[l.variantId], beforeE[l.variantId] + l.qty, `stock de ${l.variantId} après le retour`);
  console.log("ok  un retour après livraison remet le stock");
}

main()
  .then(() => {
    console.log("Tout est bon. Remise en place des données de démo…");
    execSync("npm run db:seed", { stdio: "inherit" });
  })
  .catch((e) => {
    console.error(e);
    console.error("Échec. Relance npm run db:seed pour remettre les données de démo.");
    process.exit(1);
  });
