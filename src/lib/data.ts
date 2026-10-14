import { cache } from "react";
import { connection } from "next/server";
import { type SQLWrapper, and, asc, count, desc, eq, gt, gte, inArray, lte, notInArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { customers, orderEvents, orderLines, orders, products, variants } from "@/db/schema";
import { settings } from "./demo-data";
import {
  type Cents,
  type Currency,
  type Order,
  type OrderTab,
  type Payment,
  type Product,
  type Status,
  orderTabs,
  productLevel,
  segmentOf,
  variantLevel,
} from "./domain";
import { TIME_ZONE, dayKey, normalize } from "./format";

// Les lectures des écrans. Postgres filtre, trie et additionne. Les règles métier
// (niveau de stock, segment client) restent dans domain.ts.

const DAY = 86_400_000;
// ponytail: taux fixe pour additionner les ventes en euros aux dirhams, un vrai taux du jour si la compta en dépend.
const EUR_IN_MAD = 10.8;
const NOT_SALES: Status[] = ["cancelled", "refused", "returned"];
const RETURNS: Status[] = ["refused", "returned"];

/** Les données dépendent de l'heure. On attend une vraie requête au lieu de les figer au build. */
async function start() {
  await connection();
  return new Date();
}

const isSale = notInArray(orders.status, NOT_SALES);
const totalMad = sql`case when ${orders.currency} = 'EUR' then round(${orders.total} * ${EUR_IN_MAD}::numeric) else ${orders.total} end`;
const lineMad = sql`case when ${orders.currency} = 'EUR' then round(${orderLines.qty} * ${orderLines.unitPrice} * ${EUR_IN_MAD}::numeric) else ${orderLines.qty} * ${orderLines.unitPrice} end`;
const sumMad = sql<number>`coalesce(sum(${totalMad}), 0)`.mapWith(Number);
const toMad = (cents: Cents, currency: Currency) => (currency === "EUR" ? Math.round(cents * EUR_IN_MAD) : cents);
const change = (now: number, before: number) => (before ? (now - before) / before : null);
const between = (from: Date, to: Date) => and(gt(orders.createdAt, from), lte(orders.createdAt, to));

/** Chiffre d'affaires (en dirhams) et nombre de ventes sur une période. */
async function salesBetween(from: Date, to: Date) {
  const [r] = await db
    .select({ total: sumMad, count: count() })
    .from(orders)
    .where(and(isSale, between(from, to)));
  return { ...r, average: r.count ? Math.round(r.total / r.count) : 0 };
}

/** Ventes par jour (fuseau de Marrakech), du plus ancien à aujourd'hui, jours vides compris. */
async function dailySeries(now: Date, days: number) {
  // Le fuseau est une constante du code, écrite telle quelle. En paramètre, le SELECT et le GROUP BY
  // recevraient deux paramètres distincts et Postgres ne les reconnaîtrait pas comme la même expression.
  const day = sql<string>`to_char(${orders.createdAt} at time zone ${sql.raw(`'${TIME_ZONE}'`)}, 'YYYY-MM-DD')`;
  const rows = await db
    .select({ day, total: sumMad })
    .from(orders)
    .where(and(isSale, between(new Date(now.getTime() - days * DAY), now)))
    .groupBy(day);
  const totals = new Map(rows.map((r) => [r.day, r.total]));
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(now.getTime() - (days - 1 - i) * DAY);
    return { date, total: totals.get(dayKey(date)) ?? 0 };
  });
}

function startOfToday(now: Date) {
  // Minuit à Marrakech. On recule heure par heure tant qu'on est encore le même jour.
  const key = dayKey(now);
  let t = now.getTime() - (now.getTime() % 3_600_000);
  while (dayKey(new Date(t - 3_600_000)) === key) t -= 3_600_000;
  return new Date(t);
}

// Recherche sans accents ni majuscules, côté Postgres (même règle que normalize()).
const ACCENTS = "àâäáãåçéèêëíìîïñóòôöõúùûüýÿ";
const PLAIN = "aaaaaaceeeeiiiinooooouuuuyy";
const fold = (column: SQLWrapper) => sql`translate(lower(${column}), ${ACCENTS}, ${PLAIN})`;
/** % et _ ont un sens spécial dans LIKE. Ceux tapés par l'utilisateur doivent rester du texte. */
const escapeLike = (s: string) => s.replace(/[\\%_]/g, "\\$&");

function searchCustomer(q: string, alsoOrderNumber = false) {
  const query = normalize(q.trim().replace(/^#/, ""));
  if (!query) return undefined;
  const digits = query.replace(/\D/g, "");
  const like = `%${escapeLike(query)}%`;
  return or(
    sql`${fold(customers.name)} like ${like}`,
    sql`${fold(customers.city)} like ${like}`,
    digits.length >= 3 ? sql`regexp_replace(${customers.phone}, '\\D', '', 'g') like ${`%${digits}%`}` : undefined,
    alsoOrderNumber && /^\d+$/.test(query) ? sql`${orders.id}::text like ${`${query}%`}` : undefined,
  );
}

type ProductRow = typeof products.$inferSelect & { variants: (typeof variants.$inferSelect)[] };

function toProduct(p: ProductRow): Product {
  return {
    id: p.id,
    name: { fr: p.nameFr, en: p.nameEn },
    description: p.description,
    category: p.category,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    threshold: p.threshold,
    online: p.online,
    swatch: p.swatch,
    variants: [...p.variants]
      .sort((a, b) => a.position - b.position)
      .map((v) => ({ id: v.id, label: v.label, price: v.price, stock: v.stock, restockLevel: v.restockLevel })),
  };
}

// ponytail: tout le catalogue d'un coup (25 produits), à paginer au-delà de quelques centaines.
async function allProducts() {
  const rows = await db.query.products.findMany({ with: { variants: true }, orderBy: desc(products.createdAt) });
  return rows.map(toProduct);
}

/** Ce qu'il faut pour afficher une ligne de commande, le produit (nom, couleur) et le format. */
const lineWith = { product: { columns: { id: true, nameFr: true, nameEn: true, swatch: true } }, variant: true } as const;

type LineRow = typeof orderLines.$inferSelect & {
  product: Pick<typeof products.$inferSelect, "id" | "nameFr" | "nameEn" | "swatch">;
  variant: typeof variants.$inferSelect;
};

const toLine = (l: LineRow) => ({
  productId: l.productId,
  variantId: l.variantId,
  qty: l.qty,
  unitPrice: l.unitPrice,
  product: { id: l.product.id, name: { fr: l.product.nameFr, en: l.product.nameEn }, swatch: l.product.swatch },
  variant: { id: l.variant.id, label: l.variant.label },
});

export type TodoItem =
  | { kind: "call"; count: number; names: string[] }
  | { kind: "low" | "out"; product: Product; label: string | null; stock: number; threshold: number }
  | { kind: "refused"; orderId: string; number: number; city: string };

export async function getToday() {
  const now = await start();
  const today = startOfToday(now);
  const week = new Date(now.getTime() - 7 * DAY);

  const [toConfirm, toPrepare, refused, catalogue, salesToday, salesYesterday, thisWeek, lastWeek, daily, sold] =
    await Promise.all([
      db
        .select({ createdAt: orders.createdAt, name: customers.name })
        .from(orders)
        .innerJoin(customers, eq(orders.customerId, customers.id))
        .where(eq(orders.status, "received"))
        .orderBy(asc(orders.createdAt)),
      db
        .select({
          id: orders.id,
          confirmedAt: sql`max(${orderEvents.at}) filter (where ${orderEvents.kind} = 'confirmed')`.mapWith(orderEvents.at),
        })
        .from(orders)
        .leftJoin(orderEvents, eq(orderEvents.orderId, orders.id))
        .where(inArray(orders.status, [...orderTabs.toPrepare]))
        .groupBy(orders.id),
      db
        .select({ id: orders.id, city: customers.city })
        .from(orders)
        .innerJoin(customers, eq(orders.customerId, customers.id))
        .where(eq(orders.status, "refused"))
        .orderBy(asc(orders.createdAt)),
      allProducts(),
      salesBetween(today, now),
      salesBetween(new Date(today.getTime() - DAY), new Date(now.getTime() - DAY)),
      salesBetween(week, now),
      salesBetween(new Date(now.getTime() - 14 * DAY), week),
      dailySeries(now, 30),
      db
        .select({
          productId: orderLines.productId,
          variantId: orderLines.variantId,
          qty: sql<number>`sum(${orderLines.qty})`.mapWith(Number),
          revenue: sql<number>`sum(${lineMad})`.mapWith(Number),
        })
        .from(orderLines)
        .innerJoin(orders, eq(orderLines.orderId, orders.id))
        .where(and(isSale, between(week, now)))
        .groupBy(orderLines.productId, orderLines.variantId),
    ]);

  const todo: TodoItem[] = [];
  if (toConfirm.length) todo.push({ kind: "call", count: toConfirm.length, names: toConfirm.map((o) => o.name) });
  for (const p of catalogue)
    for (const v of p.variants) {
      const level = variantLevel(v, p.threshold);
      if (level !== "ok") todo.push({ kind: level, product: p, label: v.label, stock: v.stock, threshold: p.threshold });
    }
  for (const o of refused) todo.push({ kind: "refused", orderId: String(o.id), number: o.id, city: o.city });

  // Top 5 par produit, avec le format le plus vendu de chacun.
  const byId = new Map(catalogue.map((p) => [p.id, p]));
  const best = new Map<string, { qty: number; revenue: Cents; topVariant: { id: string; qty: number } }>();
  for (const r of sold) {
    const b = best.get(r.productId) ?? { qty: 0, revenue: 0, topVariant: { id: r.variantId, qty: 0 } };
    b.qty += r.qty;
    b.revenue += r.revenue;
    if (r.qty > b.topVariant.qty) b.topVariant = { id: r.variantId, qty: r.qty };
    best.set(r.productId, b);
  }
  const top = [...best.entries()]
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5)
    .map(([productId, b]) => {
      const product = byId.get(productId)!;
      const label = product.variants.find((v) => v.id === b.topVariant.id)?.label ?? null;
      return { product, label, qty: b.qty, revenue: b.revenue };
    });

  return {
    now,
    salesToday: salesToday.total,
    salesChange: change(salesToday.total, salesYesterday.total),
    toConfirm: toConfirm.length,
    oldestToConfirm: toConfirm[0]?.createdAt ?? null,
    toPrepare: toPrepare.length,
    urgent: toPrepare.filter((o) => o.confirmedAt && now.getTime() - o.confirmedAt.getTime() > DAY).length,
    basket: thisWeek.average,
    basketChange: change(thisWeek.average, lastWeek.average),
    todo,
    daily,
    top,
  };
}

export type OrderRow = {
  id: string;
  number: number;
  name: string;
  phone: string;
  city: string;
  total: Cents;
  currency: Currency;
  payment: Payment;
  status: Status;
  createdAt: Date;
};

const tabKeys = Object.keys(orderTabs) as OrderTab[];

export const tabOf = (s: Status) => tabKeys.find((t) => (orderTabs[t] as readonly Status[]).includes(s))!;

/** Le travail en cours se traite du plus ancien au plus récent, l'archive se lit à l'envers. */
export const oldestFirst = (tab: OrderTab) => tab === "toConfirm" || tab === "toPrepare";

// ponytail: 50 lignes max, une pagination quand l'archive devient utile.
export const ORDERS_LIMIT = 50;

export async function listOrders({ tab, q = "", payment }: { tab: OrderTab; q?: string; payment?: Payment }) {
  const now = await start();
  const filters = and(payment ? eq(orders.payment, payment) : undefined, searchCustomer(q, true));
  const [byStatus, rows] = await Promise.all([
    db
      .select({ status: orders.status, n: count() })
      .from(orders)
      .innerJoin(customers, eq(orders.customerId, customers.id))
      .where(filters)
      .groupBy(orders.status),
    db
      .select({
        id: orders.id,
        name: customers.name,
        phone: customers.phone,
        city: customers.city,
        total: orders.total,
        currency: orders.currency,
        payment: orders.payment,
        status: orders.status,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .innerJoin(customers, eq(orders.customerId, customers.id))
      .where(and(filters, inArray(orders.status, [...orderTabs[tab]])))
      .orderBy(oldestFirst(tab) ? asc(orders.createdAt) : desc(orders.createdAt))
      .limit(ORDERS_LIMIT),
  ]);
  const counts = Object.fromEntries(tabKeys.map((t) => [t, 0])) as Record<OrderTab, number>;
  for (const r of byStatus) counts[tabOf(r.status)] += r.n;
  return { now, counts, rows: rows.map((r): OrderRow => ({ ...r, id: String(r.id), number: r.id })) };
}

/** L'adresse donne un texte. Seul un entier positif peut être un numéro de commande. */
const orderNumber = (id: string) => (/^\d{1,9}$/.test(id) ? Number(id) : null);

// La page et le panneau de détail demandent la même commande. cache() n'en fait qu'une lecture par requête.
export const getOrder = cache(async (id: string) => {
  const now = await start();
  const number = orderNumber(id);
  if (number === null) return null;
  const o = await db.query.orders.findFirst({
    where: eq(orders.id, number),
    with: { customer: true, lines: { with: lineWith, orderBy: asc(orderLines.id) }, events: { orderBy: asc(orderEvents.at) } },
  });
  if (!o) return null;
  const lines = o.lines.map(toLine);
  const order: Order = {
    id: String(o.id),
    number: o.id,
    customerId: o.customerId,
    createdAt: o.createdAt,
    status: o.status,
    payment: o.payment,
    currency: o.currency,
    lines,
    shippingFee: o.shippingFee,
    note: o.note,
    history: o.events.map((e) => ({ at: e.at, actor: e.actor, kind: e.kind })),
  };
  return { now, order, customer: o.customer, lines, total: o.total };
});

export async function getPreparation() {
  const now = await start();
  const preparedToday = db
    .select({ orderId: orderEvents.orderId })
    .from(orderEvents)
    .where(and(eq(orderEvents.kind, "prepared"), gte(orderEvents.at, startOfToday(now))));
  const [list, [packed]] = await Promise.all([
    db.query.orders.findMany({
      where: inArray(orders.status, [...orderTabs.toPrepare]),
      with: { customer: true, lines: { with: lineWith, orderBy: asc(orderLines.id) } },
      orderBy: asc(orders.createdAt),
    }),
    db
      .select({ orders: sql<number>`count(distinct ${orderLines.orderId})`.mapWith(Number), items: sql<number>`coalesce(sum(${orderLines.qty}), 0)`.mapWith(Number) })
      .from(orderLines)
      .where(inArray(orderLines.orderId, preparedToday)),
  ]);
  return {
    now,
    orders: list
      // D'abord ce qui reste à emballer, ensuite les colis prêts qui attendent le livreur.
      .sort((a, b) => Number(a.status === "prepared") - Number(b.status === "prepared"))
      .map((o) => ({
        order: { id: String(o.id), number: o.id, status: o.status, payment: o.payment, currency: o.currency },
        customer: o.customer,
        lines: o.lines.map(toLine),
        total: o.total,
      })),
    preparedToday: packed.orders,
    itemsPacked: packed.items,
  };
}

export type ProductFilter = "all" | "low" | "out" | "hidden";

export async function listProducts({ filter, q = "" }: { filter: ProductFilter; q?: string }) {
  await start();
  const all = await allProducts();
  const query = normalize(q.trim());
  const found = all.filter((p) => !query || normalize(p.name.fr).includes(query) || normalize(p.name.en).includes(query));
  const keep: Record<ProductFilter, (p: Product) => boolean> = {
    all: () => true,
    low: (p) => productLevel(p) === "low",
    out: (p) => productLevel(p) === "out",
    hidden: (p) => !p.online,
  };
  const counts = Object.fromEntries(
    (Object.keys(keep) as ProductFilter[]).map((f) => [f, found.filter(keep[f]).length]),
  ) as Record<ProductFilter, number>;
  return { counts, total: all.length, products: found.filter(keep[filter]) };
}

export async function getProduct(id: string) {
  await start();
  const p = await db.query.products.findFirst({ where: eq(products.id, id), with: { variants: true } });
  return p ? toProduct(p) : null;
}

export type CustomerFilter = "all" | "loyal" | "new" | "dormant";

export async function listCustomers({ segment, q = "" }: { segment: CustomerFilter; q?: string }) {
  const now = await start();
  const [rows, total] = await Promise.all([
    db
      .select({
        customer: customers,
        orderCount: count(orders.id),
        total: sql<number>`coalesce(sum(${totalMad}) filter (where ${isSale}), 0)`.mapWith(Number),
        first: sql`min(${orders.createdAt})`.mapWith(orders.createdAt),
        last: sql`max(${orders.createdAt})`.mapWith(orders.createdAt),
      })
      .from(customers)
      .innerJoin(orders, eq(orders.customerId, customers.id))
      .where(searchCustomer(q))
      .groupBy(customers.id)
      .orderBy(desc(sql`max(${orders.createdAt})`)),
    getCustomerCount(),
  ]);
  // Le segment est une règle métier (domain.ts), appliquée ici aux quelques centaines de clients.
  const withSegment = rows.map((r) => ({ ...r, segment: segmentOf(r.orderCount, r.first, r.last, now) }));
  const counts = {
    all: withSegment.length,
    loyal: withSegment.filter((r) => r.segment === "loyal").length,
    new: withSegment.filter((r) => r.segment === "new").length,
    dormant: withSegment.filter((r) => r.segment === "dormant").length,
  };
  return {
    now,
    counts,
    total,
    // ponytail: 60 lignes max, une pagination si la liste sert au-delà.
    rows: withSegment.filter((r) => segment === "all" || r.segment === segment).slice(0, 60),
  };
}

export const getCustomer = cache(async (id: string) => {
  const now = await start();
  const c = await db.query.customers.findFirst({
    where: eq(customers.id, id),
    with: { orders: { orderBy: desc(orders.createdAt) } },
  });
  if (!c || c.orders.length === 0) return null;
  const { orders: list, ...customer } = c;
  const sales = list.filter((o) => !NOT_SALES.includes(o.status));
  const total = sales.reduce((s, o) => s + toMad(o.total, o.currency), 0);
  const first = list[list.length - 1].createdAt;
  const last = list[0].createdAt;
  return {
    now,
    customer,
    orders: list.map((o) => ({ id: String(o.id), number: o.id, status: o.status, currency: o.currency, total: o.total, createdAt: o.createdAt })),
    total,
    first,
    average: sales.length ? Math.round(total / sales.length) : 0,
    refused: list.filter((o) => RETURNS.includes(o.status)).length,
    segment: segmentOf(list.length, first, last, now),
  };
});

export const periods = { "7": 7, "30": 30, "90": 90, "365": 365 } as const;
export type Period = keyof typeof periods;

export async function getStats(period: Period) {
  const now = await start();
  const days = periods[period];
  const from = new Date(now.getTime() - days * DAY);
  const inRange = and(isSale, between(from, now));

  const [current, before, [placed], cities, byCategory, [people], daily] = await Promise.all([
    salesBetween(from, now),
    salesBetween(new Date(from.getTime() - days * DAY), from),
    db
      .select({ all: count(), returns: sql<number>`count(*) filter (where ${inArray(orders.status, RETURNS)})`.mapWith(Number) })
      .from(orders)
      .where(between(from, now)),
    db
      .select({ key: customers.city, total: sumMad })
      .from(orders)
      .innerJoin(customers, eq(orders.customerId, customers.id))
      .where(inRange)
      .groupBy(customers.city)
      .orderBy(desc(sumMad)),
    db
      .select({ key: products.category, total: sql<number>`sum(${lineMad})`.mapWith(Number) })
      .from(orderLines)
      .innerJoin(orders, eq(orderLines.orderId, orders.id))
      .innerJoin(products, eq(orderLines.productId, products.id))
      .where(inRange)
      .groupBy(products.category)
      .orderBy(desc(sql`sum(${lineMad})`)),
    // Clients actifs sur la période, et parmi eux ceux dont la toute première commande tombe dans la période.
    db.execute<{ active: number; new_ones: number }>(sql`
      with active as (select distinct ${orders.customerId} as id from ${orders} where ${inRange}),
           firsts as (select ${orders.customerId} as id, min(${orders.createdAt}) as first from ${orders} group by ${orders.customerId})
      select count(*)::int as active, count(*) filter (where firsts.first > ${from})::int as new_ones
      from active join firsts using (id)`).then((r) => r.rows),
    dailySeries(now, days),
  ]);

  // Une barre par jour sur 7 et 30 jours, par semaine sur 90 jours, par mois sur 12 mois.
  const size = days === 90 ? 7 : days === 365 ? 30 : 1;
  const series = [];
  for (let i = daily.length; i > 0; i -= size) {
    const chunk = daily.slice(Math.max(0, i - size), i);
    series.unshift({ date: chunk[chunk.length - 1].date, total: chunk.reduce((s, x) => s + x.total, 0) });
  }

  return {
    now,
    from: new Date(from.getTime() + DAY),
    revenue: current.total,
    revenueChange: change(current.total, before.total),
    orders: current.count,
    ordersChange: change(current.count, before.count),
    basket: current.average,
    basketChange: change(current.average, before.average),
    placed: placed.all,
    returns: placed.returns,
    returnRate: placed.all ? placed.returns / placed.all : 0,
    series,
    byCity: [...cities.slice(0, 4), { key: "others", total: cities.slice(4).reduce((s, c) => s + c.total, 0) }],
    byCategory,
    activeCustomers: people.active,
    newCustomers: people.new_ones,
    repeatRate: people.active ? (people.active - people.new_ones) / people.active : 0,
  };
}

export async function getNavCounts() {
  await start();
  const [r] = await db.select({ n: count() }).from(orders).where(eq(orders.status, "received"));
  return { toConfirm: r.n };
}

/** Qui utilise l'écran. En phase 3, ce sera la personne connectée (session). */
export function teamMember(role: (typeof settings.team)[number]["role"]) {
  return settings.team.find((m) => m.role === role)!;
}

export async function getSettings() {
  await connection();
  return settings;
}

export async function getCustomerCount() {
  await start();
  const [r] = await db.select({ n: count() }).from(customers);
  return r.n;
}
