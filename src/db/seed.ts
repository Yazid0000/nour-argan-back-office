// Vide la base et la remplit avec les données de démo. Lancer avec npm run db:seed
import "./network";
import { sql } from "drizzle-orm";
import { generateDemo } from "../lib/demo-data";
import { total } from "../lib/domain";
import { db } from "./index";
import { customers, orderEvents, orderLines, orders, products, variants } from "./schema";

async function main() {
  const demo = generateDemo(new Date());

  // Un seul batch, donc une seule transaction. Si une insertion échoue, rien n'est gardé
  // et la base reste comme avant au lieu d'être à moitié vide.
  await db.batch([
    // Les tables qui pointent vers les autres d'abord, sinon les clés étrangères bloquent.
    db.delete(orderEvents),
    db.delete(orderLines),
    db.delete(orders),
    db.delete(customers),
    db.delete(variants),
    db.delete(products),
    db.insert(products).values(
      demo.products.map((p, i) => ({
        id: p.id,
        nameFr: p.name.fr,
        nameEn: p.name.en,
        description: p.description,
        category: p.category,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        threshold: p.threshold,
        online: p.online,
        swatch: p.swatch,
        // Une minute d'écart entre produits, pour que la liste (du plus récent au plus ancien) garde cet ordre.
        createdAt: new Date(Date.now() - i * 60_000),
      })),
    ),
    db.insert(variants).values(
      demo.products.flatMap((p) => p.variants.map((v, position) => ({ ...v, productId: p.id, position }))),
    ),
    db.insert(customers).values(demo.customers),
    db.insert(orders).values(
      demo.orders.map((o) => ({
        id: o.number,
        customerId: o.customerId,
        status: o.status,
        payment: o.payment,
        currency: o.currency,
        shippingFee: o.shippingFee,
        total: total(o),
        note: o.note,
        createdAt: o.createdAt,
      })),
    ),
    db.insert(orderLines).values(demo.orders.flatMap((o) => o.lines.map((l) => ({ ...l, orderId: o.number })))),
    db.insert(orderEvents).values(demo.orders.flatMap((o) => o.history.map((h) => ({ ...h, orderId: o.number })))),
  ]);
  // Les numéros ont été imposés par le seed. Le compteur automatique repart après le plus grand.
  await db.execute(sql`select setval(pg_get_serial_sequence('orders', 'id'), (select max(id) from orders))`);

  console.log(`Base remplie : ${demo.products.length} produits, ${demo.customers.length} clients, ${demo.orders.length} commandes.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
