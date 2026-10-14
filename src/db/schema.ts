import { relations, sql } from "drizzle-orm";
import { boolean, check, index, integer, pgEnum, pgTable, serial, text, timestamp, unique } from "drizzle-orm/pg-core";
import { actors, categories, countries, currencies, historyKinds, payments, statuses } from "../lib/domain";

// Le schéma de la base, écrit en TypeScript. drizzle-kit en tire les migrations SQL (dossier drizzle/).
// Les noms de colonnes en camelCase ici deviennent snake_case en base (option casing).
// Montants en centimes, entiers, pour ne jamais arrondir de travers.

// Un enum Postgres n'accepte que les valeurs listées. Une faute de frappe est refusée par la base.
export const categoryEnum = pgEnum("category", categories);
export const statusEnum = pgEnum("order_status", statuses);
export const paymentEnum = pgEnum("payment", payments);
export const currencyEnum = pgEnum("currency", currencies);
export const countryEnum = pgEnum("country", countries);
export const actorEnum = pgEnum("actor", actors);
export const historyKindEnum = pgEnum("history_kind", historyKinds);

const createdAt = () => timestamp({ withTimezone: true }).notNull().defaultNow();

export const products = pgTable(
  "products",
  {
    id: text().primaryKey(),
    nameFr: text().notNull(),
    nameEn: text().notNull(),
    description: text().notNull().default(""),
    category: categoryEnum().notNull(),
    price: integer().notNull(),
    compareAtPrice: integer(),
    threshold: integer().notNull().default(10),
    online: boolean().notNull().default(true),
    swatch: text().notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    check("price_positive", sql`${t.price} > 0`),
    check("threshold_non_negative", sql`${t.threshold} >= 0`),
  ],
);

export const variants = pgTable(
  "variants",
  {
    id: text().primaryKey(),
    // Clé étrangère vers le produit. Supprimer un produit jamais vendu supprime ses formats. Un produit vendu,
    // lui, est protégé par les lignes de commande qui pointent vers ses formats : on le masque au lieu de le supprimer.
    productId: text()
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    label: text(),
    price: integer().notNull(),
    stock: integer().notNull().default(0),
    restockLevel: integer().notNull().default(0),
    position: integer().notNull().default(0),
  },
  (t) => [
    // Le stock ne peut jamais passer sous zéro, même si deux personnes cliquent en même temps.
    check("stock_non_negative", sql`${t.stock} >= 0`),
    check("variant_price_positive", sql`${t.price} > 0`),
    index().on(t.productId),
  ],
);

export const customers = pgTable("customers", {
  id: text().primaryKey(),
  name: text().notNull(),
  phone: text().notNull(),
  address: text().notNull(),
  city: text().notNull(),
  postalCode: text().notNull(),
  country: countryEnum().notNull(),
  note: text(),
  createdAt: createdAt(),
});

export const orders = pgTable(
  "orders",
  {
    // Le numéro de commande affiché (#1048) sert d'identifiant. Postgres le génère lui-même (compteur),
    // donc deux commandes créées en même temps ne peuvent pas recevoir le même numéro.
    id: integer().primaryKey().generatedByDefaultAsIdentity(),
    customerId: text()
      .notNull()
      .references(() => customers.id),
    status: statusEnum().notNull().default("received"),
    payment: paymentEnum().notNull(),
    currency: currencyEnum().notNull().default("MAD"),
    shippingFee: integer().notNull().default(0),
    // Calculé par le serveur à la création (lignes + livraison), jamais envoyé par le navigateur.
    total: integer().notNull(),
    note: text(),
    createdAt: createdAt(),
  },
  (t) => [index().on(t.status), index().on(t.createdAt), index().on(t.customerId)],
);

export const orderLines = pgTable(
  "order_lines",
  {
    id: serial().primaryKey(),
    orderId: integer()
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: text()
      .notNull()
      .references(() => products.id),
    variantId: text()
      .notNull()
      .references(() => variants.id),
    qty: integer().notNull(),
    unitPrice: integer().notNull(),
  },
  (t) => [check("qty_positive", sql`${t.qty} > 0`), unique().on(t.orderId, t.variantId), index().on(t.orderId)],
);

/** L'historique de chaque commande, avec qui a fait quoi et quand. */
export const orderEvents = pgTable(
  "order_events",
  {
    id: serial().primaryKey(),
    orderId: integer()
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    at: timestamp({ withTimezone: true }).notNull().defaultNow(),
    actor: actorEnum().notNull(),
    kind: historyKindEnum().notNull(),
  },
  (t) => [index().on(t.orderId)],
);

// Les relations disent à Drizzle comment joindre les tables (db.query.orders.findFirst({ with: { lines: true } })).
export const productsRelations = relations(products, ({ many }) => ({ variants: many(variants) }));
export const variantsRelations = relations(variants, ({ one }) => ({
  product: one(products, { fields: [variants.productId], references: [products.id] }),
}));
export const customersRelations = relations(customers, ({ many }) => ({ orders: many(orders) }));
export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, { fields: [orders.customerId], references: [customers.id] }),
  lines: many(orderLines),
  events: many(orderEvents),
}));
export const orderLinesRelations = relations(orderLines, ({ one }) => ({
  order: one(orders, { fields: [orderLines.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderLines.productId], references: [products.id] }),
  variant: one(variants, { fields: [orderLines.variantId], references: [variants.id] }),
}));
export const orderEventsRelations = relations(orderEvents, ({ one }) => ({
  order: one(orders, { fields: [orderEvents.orderId], references: [orders.id] }),
}));
