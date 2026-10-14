import { cache } from "react";
import { connection } from "next/server";
import { demoData, settings } from "./demo-data";
import {
  type Cents,
  type Customer,
  type Order,
  type OrderTab,
  type Payment,
  type Product,
  type Status,
  orderTabs,
  productLevel,
  segmentOf,
  total,
  variantLevel,
} from "./domain";
import { dayKey, normalize } from "./format";

// Les lectures des écrans. En phase 2, ces fonctions interrogeront Postgres
// avec les mêmes signatures, et les écrans ne changeront pas.

const DAY = 86_400_000;
// ponytail: taux fixe pour additionner les ventes en euros aux dirhams, un vrai taux du jour si la compta en dépend.
const EUR_IN_MAD = 10.8;

async function load() {
  // Les données dépendent de l'heure. On attend une vraie requête au lieu de les figer au build.
  await connection();
  return demoData();
}

const isSale = (s: Status) => s !== "cancelled" && s !== "refused" && s !== "returned";
const inMad = (o: Order): Cents => (o.currency === "EUR" ? Math.round(total(o) * EUR_IN_MAD) : total(o));
const sum = (orders: Order[]) => orders.reduce((s, o) => s + inMad(o), 0);
const average = (orders: Order[]) => (orders.length ? Math.round(sum(orders) / orders.length) : 0);
const between = (orders: Order[], from: number, to: number) =>
  orders.filter((o) => o.createdAt.getTime() > from && o.createdAt.getTime() <= to);
const change = (now: number, before: number) => (before ? (now - before) / before : null);

function indexes(d: ReturnType<typeof demoData>) {
  const products = new Map(d.products.map((p) => [p.id, p]));
  const customers = new Map(d.customers.map((c) => [c.id, c]));
  const variant = (productId: string, variantId: string) => {
    const p = products.get(productId)!;
    return { product: p, variant: p.variants.find((v) => v.id === variantId)! };
  };
  return { products, customers, variant };
}

function startOfToday(now: Date) {
  // Minuit à Marrakech. On recule heure par heure tant qu'on est encore le même jour.
  const key = dayKey(now);
  let t = now.getTime() - (now.getTime() % 3_600_000);
  while (dayKey(new Date(t - 3_600_000)) === key) t -= 3_600_000;
  return t;
}

export type TodoItem =
  | { kind: "call"; count: number; names: string[] }
  | { kind: "low" | "out"; product: Product; label: string | null; stock: number; threshold: number }
  | { kind: "refused"; orderId: string; number: number; city: string };

export async function getToday() {
  const d = await load();
  const { customers, variant } = indexes(d);
  const now = d.now.getTime();
  const today = startOfToday(d.now);
  const sales = d.orders.filter((o) => isSale(o.status));

  const toConfirm = d.orders.filter((o) => o.status === "received");
  const toPrepare = d.orders.filter((o) => o.status === "confirmed" || o.status === "prepared");
  const confirmedAt = (o: Order) => o.history.find((h) => h.kind === "confirmed")?.at.getTime() ?? now;

  const todo: TodoItem[] = [];
  if (toConfirm.length)
    todo.push({ kind: "call", count: toConfirm.length, names: toConfirm.map((o) => customers.get(o.customerId)!.name) });
  for (const p of d.products)
    for (const v of p.variants) {
      const level = variantLevel(v, p.threshold);
      if (level !== "ok") todo.push({ kind: level, product: p, label: v.label, stock: v.stock, threshold: p.threshold });
    }
  for (const o of d.orders.filter((o) => o.status === "refused"))
    todo.push({ kind: "refused", orderId: o.id, number: o.number, city: customers.get(o.customerId)!.city });

  const week = between(sales, now - 7 * DAY, now);
  const best = new Map<string, { qty: number; revenue: Cents; variants: Map<string, number> }>();
  for (const o of week)
    for (const l of o.lines) {
      const b = best.get(l.productId) ?? { qty: 0, revenue: 0, variants: new Map() };
      b.qty += l.qty;
      b.revenue += Math.round(l.qty * l.unitPrice * (o.currency === "EUR" ? EUR_IN_MAD : 1));
      b.variants.set(l.variantId, (b.variants.get(l.variantId) ?? 0) + l.qty);
      best.set(l.productId, b);
    }
  const top = [...best.entries()]
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5)
    .map(([productId, b]) => {
      const topVariant = [...b.variants.entries()].sort((x, y) => y[1] - x[1])[0][0];
      const { product, variant: v } = variant(productId, topVariant);
      return { product, label: v.label, qty: b.qty, revenue: b.revenue };
    });

  const salesToday = sum(between(sales, today, now));
  return {
    now: d.now,
    salesToday,
    salesChange: change(salesToday, sum(between(sales, today - DAY, now - DAY))),
    toConfirm: toConfirm.length,
    oldestToConfirm: toConfirm[0]?.createdAt ?? null,
    toPrepare: toPrepare.length,
    urgent: toPrepare.filter((o) => now - confirmedAt(o) > DAY).length,
    basket: average(week),
    basketChange: change(average(week), average(between(sales, now - 14 * DAY, now - 7 * DAY))),
    todo,
    daily: dailySeries(sales, d.now, 30),
    top,
  };
}

/** Ventes par jour, du plus ancien à aujourd'hui. */
function dailySeries(sales: Order[], now: Date, days: number) {
  const totals = new Map<string, Cents>();
  for (const o of between(sales, now.getTime() - days * DAY, now.getTime()))
    totals.set(dayKey(o.createdAt), (totals.get(dayKey(o.createdAt)) ?? 0) + inMad(o));
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(now.getTime() - (days - 1 - i) * DAY);
    return { date, total: totals.get(dayKey(date)) ?? 0 };
  });
}

export type OrderRow = {
  id: string;
  number: number;
  name: string;
  phone: string;
  city: string;
  total: Cents;
  currency: Order["currency"];
  payment: Payment;
  status: Status;
  createdAt: Date;
};

function matches(o: Order, c: Customer, q: string) {
  const query = normalize(q.trim().replace(/^#/, ""));
  if (!query) return true;
  const digits = query.replace(/\D/g, "");
  return (
    String(o.number).startsWith(query) ||
    normalize(c.name).includes(query) ||
    normalize(c.city).includes(query) ||
    (digits.length >= 3 && c.phone.replace(/\D/g, "").includes(digits))
  );
}

export const tabOf = (s: Status) =>
  (Object.keys(orderTabs) as OrderTab[]).find((t) => (orderTabs[t] as readonly Status[]).includes(s))!;

export async function listOrders({ tab, q = "", payment }: { tab: OrderTab; q?: string; payment?: Payment }) {
  const d = await load();
  const { customers } = indexes(d);
  const found = d.orders.filter((o) => {
    const c = customers.get(o.customerId)!;
    return (!payment || o.payment === payment) && matches(o, c, q);
  });
  const counts = Object.fromEntries(
    (Object.keys(orderTabs) as OrderTab[]).map((t) => [t, found.filter((o) => tabOf(o.status) === t).length]),
  ) as Record<OrderTab, number>;
  // Le travail en cours se traite du plus ancien au plus récent, l'archive se lit à l'envers.
  const oldestFirst = tab === "toConfirm" || tab === "toPrepare";
  const rows = found
    .filter((o) => tabOf(o.status) === tab)
    .sort((a, b) => (oldestFirst ? 1 : -1) * (a.createdAt.getTime() - b.createdAt.getTime()))
    // ponytail: 50 lignes max, une pagination quand l'archive devient utile.
    .slice(0, 50)
    .map((o): OrderRow => {
      const c = customers.get(o.customerId)!;
      return { id: o.id, number: o.number, name: c.name, phone: c.phone, city: c.city, total: total(o), currency: o.currency, payment: o.payment, status: o.status, createdAt: o.createdAt };
    });
  return { now: d.now, counts, rows };
}

// La page et le panneau de détail demandent la même commande. cache() n'en fait qu'une lecture par requête.
export const getOrder = cache(async (id: string) => {
  const d = await load();
  const { customers, variant } = indexes(d);
  const order = d.orders.find((o) => o.id === id);
  if (!order) return null;
  return {
    now: d.now,
    order,
    customer: customers.get(order.customerId)!,
    lines: order.lines.map((l) => ({ ...l, ...variant(l.productId, l.variantId) })),
    total: total(order),
  };
});

export async function getPreparation() {
  const d = await load();
  const { customers, variant } = indexes(d);
  const today = startOfToday(d.now);
  const preparedToday = d.orders.filter((o) =>
    o.history.some((h) => h.kind === "prepared" && h.at.getTime() >= today),
  );
  return {
    now: d.now,
    orders: d.orders
      .filter((o) => o.status === "confirmed" || o.status === "prepared")
      // D'abord ce qui reste à emballer, ensuite les colis prêts qui attendent le livreur.
      .sort((a, b) => Number(a.status === "prepared") - Number(b.status === "prepared"))
      .map((o) => ({
        order: o,
        customer: customers.get(o.customerId)!,
        lines: o.lines.map((l) => ({ ...l, ...variant(l.productId, l.variantId) })),
        total: total(o),
      })),
    preparedToday: preparedToday.length,
    itemsPacked: preparedToday.reduce((s, o) => s + o.lines.reduce((n, l) => n + l.qty, 0), 0),
  };
}

export type ProductFilter = "all" | "low" | "out" | "hidden";

export async function listProducts({ filter, q = "" }: { filter: ProductFilter; q?: string }) {
  const d = await load();
  const query = normalize(q.trim());
  const found = d.products.filter(
    (p) => !query || normalize(p.name.fr).includes(query) || normalize(p.name.en).includes(query),
  );
  const keep: Record<ProductFilter, (p: Product) => boolean> = {
    all: () => true,
    low: (p) => productLevel(p) === "low",
    out: (p) => productLevel(p) === "out",
    hidden: (p) => !p.online,
  };
  const counts = Object.fromEntries(
    (Object.keys(keep) as ProductFilter[]).map((f) => [f, found.filter(keep[f]).length]),
  ) as Record<ProductFilter, number>;
  return { counts, total: d.products.length, products: found.filter(keep[filter]) };
}

export async function getProduct(id: string) {
  const d = await load();
  return d.products.find((p) => p.id === id) ?? null;
}

type CustomerStats = { customer: Customer; orders: Order[]; total: Cents; first: Date; last: Date };

function customerStats(d: ReturnType<typeof demoData>) {
  const byCustomer = new Map<string, Order[]>();
  for (const o of d.orders) byCustomer.set(o.customerId, [...(byCustomer.get(o.customerId) ?? []), o]);
  return d.customers.map((customer): CustomerStats => {
    const orders = byCustomer.get(customer.id) ?? [];
    return {
      customer,
      orders,
      total: sum(orders.filter((o) => isSale(o.status))),
      first: orders[0].createdAt,
      last: orders[orders.length - 1].createdAt,
    };
  });
}

export type CustomerFilter = "all" | "loyal" | "new" | "dormant";

export async function listCustomers({ segment, q = "" }: { segment: CustomerFilter; q?: string }) {
  const d = await load();
  const query = normalize(q.trim());
  const digits = query.replace(/\D/g, "");
  const rows = customerStats(d)
    .filter(
      ({ customer: c }) =>
        !query ||
        normalize(c.name).includes(query) ||
        normalize(c.city).includes(query) ||
        (digits.length >= 3 && c.phone.replace(/\D/g, "").includes(digits)),
    )
    .map((s) => ({ ...s, segment: segmentOf(s.orders.length, s.first, s.last, d.now) }))
    .sort((a, b) => b.last.getTime() - a.last.getTime());
  const counts = {
    all: rows.length,
    loyal: rows.filter((r) => r.segment === "loyal").length,
    new: rows.filter((r) => r.segment === "new").length,
    dormant: rows.filter((r) => r.segment === "dormant").length,
  };
  return {
    now: d.now,
    counts,
    total: d.customers.length,
    // ponytail: 60 lignes max, une pagination si la liste sert au-delà.
    rows: rows.filter((r) => segment === "all" || r.segment === segment).slice(0, 60),
  };
}

export const getCustomer = cache(async (id: string) => {
  const d = await load();
  const stats = customerStats(d).find((s) => s.customer.id === id);
  if (!stats) return null;
  const sales = stats.orders.filter((o) => isSale(o.status));
  return {
    now: d.now,
    ...stats,
    orders: [...stats.orders].reverse(),
    average: average(sales),
    refused: stats.orders.filter((o) => o.status === "refused" || o.status === "returned").length,
    segment: segmentOf(stats.orders.length, stats.first, stats.last, d.now),
  };
});

export const periods = { "7": 7, "30": 30, "90": 90, "365": 365 } as const;
export type Period = keyof typeof periods;

export async function getStats(period: Period) {
  const d = await load();
  const { customers, products } = indexes(d);
  const days = periods[period];
  const now = d.now.getTime();
  const from = now - days * DAY;
  const all = between(d.orders, from, now);
  const sales = all.filter((o) => isSale(o.status));
  const before = between(d.orders, from - days * DAY, from).filter((o) => isSale(o.status));
  const revenue = sum(sales);

  const share = (key: (o: Order) => string | string[]) => {
    const m = new Map<string, Cents>();
    for (const o of sales)
      for (const k of [key(o)].flat()) m.set(k, (m.get(k) ?? 0) + inMad(o) / [key(o)].flat().length);
    return [...m.entries()].map(([k, v]) => ({ key: k, total: Math.round(v) })).sort((a, b) => b.total - a.total);
  };
  const cities = share((o) => customers.get(o.customerId)!.city);
  const byCity = [...cities.slice(0, 4), { key: "others", total: cities.slice(4).reduce((s, c) => s + c.total, 0) }];
  const byCategory = share((o) => o.lines.map((l) => products.get(l.productId)!.category));

  const firstOrder = new Map<string, number>();
  for (const o of d.orders) if (!firstOrder.has(o.customerId)) firstOrder.set(o.customerId, o.createdAt.getTime());
  const active = new Set(sales.map((o) => o.customerId));
  const newOnes = [...active].filter((id) => firstOrder.get(id)! > from).length;
  const returns = all.filter((o) => o.status === "refused" || o.status === "returned").length;

  // Une barre par jour sur 7 et 30 jours, par semaine sur 90 jours, par mois sur 12 mois.
  const daily = dailySeries(sales, d.now, days);
  const size = days === 90 ? 7 : days === 365 ? 30 : 1;
  const series = [];
  for (let i = daily.length; i > 0; i -= size) {
    const chunk = daily.slice(Math.max(0, i - size), i);
    series.unshift({ date: chunk[chunk.length - 1].date, total: chunk.reduce((s, x) => s + x.total, 0) });
  }

  return {
    now: d.now,
    from: new Date(from + DAY),
    revenue,
    revenueChange: change(revenue, sum(before)),
    orders: sales.length,
    ordersChange: change(sales.length, before.length),
    basket: average(sales),
    basketChange: change(average(sales), average(before)),
    placed: all.length,
    returns,
    returnRate: all.length ? returns / all.length : 0,
    series,
    byCity,
    byCategory,
    activeCustomers: active.size,
    newCustomers: newOnes,
    repeatRate: active.size ? (active.size - newOnes) / active.size : 0,
  };
}

export async function getNavCounts() {
  const d = await load();
  return { toConfirm: d.orders.filter((o) => o.status === "received").length };
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
  const d = await load();
  return d.customers.length;
}
