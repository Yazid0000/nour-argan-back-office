// Vide la base et la remplit avec les données de démo. Lancer avec npm run db:seed
import "./network";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { del, list, put } from "@vercel/blob";
import { hashPassword } from "better-auth/crypto";
import { sql } from "drizzle-orm";
import { demoAccounts } from "../lib/auth";
import { generateDemo } from "../lib/demo-data";
import { total } from "../lib/domain";
import { PHOTO_FOLDER } from "../lib/photos";
import { db } from "./index";
import { account, customers, orderEvents, orderLines, orders, products, user, variants } from "./schema";

// Les photos de démo (Pexels, voir demo-photos/CREDITS.md) vivent dans produits/demo/ et ne sont envoyées qu'une fois.
// Le reste du dossier produits/ vient des visiteurs de la démo, effacé à chaque remise à zéro.
const DEMO_FOLDER = `${PHOTO_FOLDER}demo/`;
const hasBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

async function listPhotos() {
  const blobs = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: PHOTO_FOLDER, cursor });
    blobs.push(...page.blobs);
    cursor = page.cursor;
  } while (cursor);
  return blobs;
}

/** Efface les photos ajoutées pendant la démo, et renvoie l'adresse des photos de démo déjà en ligne. */
async function cleanPhotos() {
  if (!hasBlob) return { deleted: 0, demo: new Map<string, string>() };
  const blobs = await listPhotos();
  const added = blobs.filter((b) => !b.pathname.startsWith(DEMO_FOLDER));
  if (added.length) await del(added.map((b) => b.url));
  return { deleted: added.length, demo: new Map(blobs.map((b) => [b.pathname, b.url])) };
}

/** La photo de démo d'un produit, envoyée dans Blob si elle n'y est pas encore. Sans Blob, le produit garde son bloc rayé. */
async function demoPhoto(id: string, online: Map<string, string>) {
  const file = join(process.cwd(), "src/db/demo-photos", `${id}.jpg`);
  if (!hasBlob || !existsSync(file)) return [];
  const path = `${DEMO_FOLDER}${id}.jpg`;
  const url = online.get(path) ?? (await put(path, readFileSync(file), { access: "public", contentType: "image/jpeg", addRandomSuffix: false })).url;
  return [url];
}

async function main() {
  const demo = generateDemo(new Date());
  const password = process.env.DEMO_PASSWORD;
  if (!password) throw new Error("DEMO_PASSWORD manque dans .env.local");
  // Même fonction de hachage que Better Auth à la connexion (scrypt). Le mot de passe en clair n'est jamais stocké.
  const passwordHash = await hashPassword(password);
  const { deleted, demo: online } = await cleanPhotos();
  const photos = new Map(await Promise.all(demo.products.map(async (p) => [p.id, await demoPhoto(p.id, online)] as const)));
  const people = Object.entries(demoAccounts).map(([role, a]) => ({ ...a, role: role as keyof typeof demoAccounts }));

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
    // Supprimer les utilisateurs supprime aussi leurs sessions et comptes (clés étrangères en cascade).
    db.delete(user),
    db.insert(user).values(people.map((p) => ({ id: p.id, name: p.name, email: p.email, role: p.role, emailVerified: true }))),
    db.insert(account).values(
      people.map((p) => ({ id: `account-${p.id}`, accountId: p.id, providerId: "credential", userId: p.id, password: passwordHash })),
    ),
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
        photos: photos.get(p.id),
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

  console.log(`Base remplie : ${people.length} comptes démo, ${demo.products.length} produits, ${demo.customers.length} clients, ${demo.orders.length} commandes.`);
  console.log(`Photos : ${deleted} ajoutées pendant la démo effacées, ${[...photos.values()].filter((p) => p.length).length} photos de démo en place.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
