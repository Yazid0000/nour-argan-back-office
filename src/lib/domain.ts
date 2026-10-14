// Le modèle de la boutique. Les écrans ne connaissent que ces types ;
// à la phase 2, la base de données les remplira à la place des données fictives.

/** Montant en centimes (1 MAD = 100), pour ne jamais arrondir de travers. */
export type Cents = number;
export type Currency = "MAD" | "EUR";

export const categories = ["oils", "hammam", "face", "hair", "gifts"] as const;
export type Category = (typeof categories)[number];

export type Variant = {
  id: string;
  /** "100 ml", "200 g"… null pour un produit à format unique. */
  label: string | null;
  price: Cents;
  stock: number;
  /** Stock après le dernier réassort, le 100 % de la jauge. */
  restockLevel: number;
};

export type Product = {
  id: string;
  name: { fr: string; en: string };
  description: string;
  category: Category;
  /** Prix affiché dans la boutique, et prix barré s'il y a une promo. */
  price: Cents;
  compareAtPrice: Cents | null;
  /** Alerte quand un format passe à ce stock ou en dessous. */
  threshold: number;
  online: boolean;
  /** Couleur du bloc rayé qui remplace la photo en attendant la phase 5. */
  swatch: string;
  variants: Variant[];
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: "MA" | "FR" | "BE";
  note: string | null;
  createdAt: Date;
};

export type Payment = "cod" | "card" | "transfer";

export type OrderLine = {
  productId: string;
  variantId: string;
  qty: number;
  /** Copié au moment de la commande, pour qu'un changement de prix ne réécrive pas le passé. */
  unitPrice: Cents;
};

/*
 * Cycle de vie d'une commande :
 * received → confirmed → prepared → shipped → delivered
 * shipped → refused (colis refusé) → returned (remis en stock)
 * received | confirmed | prepared → cancelled
 */
export const statuses = [
  "received",
  "confirmed",
  "prepared",
  "shipped",
  "delivered",
  "refused",
  "returned",
  "cancelled",
] as const;
export type Status = (typeof statuses)[number];

/** La prochaine étape logique, le bouton principal de la commande. */
export type NextAction = "confirm" | "markPrepared" | "markShipped" | "markDelivered" | "restock";
export type Action = NextAction | "markRefused" | "cancel";

/** Pour chaque statut, le bouton principal (la prochaine étape) et les actions secondaires. */
export const transitions: Record<Status, { next: NextAction | null; others: Action[] }> = {
  received: { next: "confirm", others: ["cancel"] },
  confirmed: { next: "markPrepared", others: ["cancel"] },
  prepared: { next: "markShipped", others: ["cancel"] },
  shipped: { next: "markDelivered", others: ["markRefused"] },
  delivered: { next: null, others: [] },
  refused: { next: "restock", others: [] },
  returned: { next: null, others: [] },
  cancelled: { next: null, others: [] },
};

/** Les étapes du rail de statut, dans l'ordre. */
export const railSteps = ["received", "confirmed", "prepared", "shipped", "delivered"] as const;

/** Les onglets de la page Commandes et les statuts qu'ils regroupent. */
export const orderTabs = {
  toConfirm: ["received"],
  toPrepare: ["confirmed", "prepared"],
  shipped: ["shipped"],
  delivered: ["delivered"],
  closed: ["refused", "returned", "cancelled"],
} as const satisfies Record<string, readonly Status[]>;
export type OrderTab = keyof typeof orderTabs;

export type Actor = "site" | "salma" | "youssef" | "courier";

export type HistoryEvent = {
  at: Date;
  actor: Actor;
  kind: Status | "callNoAnswer" | "noteAdded";
};

export type Order = {
  id: string;
  number: number;
  customerId: string;
  createdAt: Date;
  status: Status;
  payment: Payment;
  currency: Currency;
  lines: OrderLine[];
  shippingFee: Cents;
  note: string | null;
  history: HistoryEvent[];
};

export function subtotal(order: Pick<Order, "lines">): Cents {
  return order.lines.reduce((sum, l) => sum + l.qty * l.unitPrice, 0);
}

export function total(order: Pick<Order, "lines" | "shippingFee">): Cents {
  return subtotal(order) + order.shippingFee;
}

export type StockLevel = "ok" | "low" | "out";

export function variantLevel(v: Variant, threshold: number): StockLevel {
  if (v.stock === 0) return "out";
  return v.stock <= threshold ? "low" : "ok";
}

/** Rupture si plus rien du tout, stock faible si un format est sous le seuil. */
export function productLevel(p: Product): StockLevel {
  const levels = p.variants.map((v) => variantLevel(v, p.threshold));
  if (levels.every((l) => l === "out")) return "out";
  return levels.some((l) => l !== "ok") ? "low" : "ok";
}

export type GaugeTone = "accent" | "amber" | "red";

/** Couleur de la jauge. Accent, puis ambre au seuil, puis rouge sous la moitié du seuil. */
export function gaugeTone(stock: number, threshold: number): GaugeTone {
  if (stock < threshold / 2) return "red";
  return stock <= threshold ? "amber" : "accent";
}

/** Le format mis en avant. Celui dont le prix est le prix affiché, sinon le premier. */
export function mainVariant(p: Product): Variant {
  return p.variants.find((v) => v.price === p.price) ?? p.variants[0];
}

export type Segment = "loyal" | "new" | "dormant";

/** Fidèle dès 5 commandes, nouvelle si sa seule commande a moins de 30 jours, à relancer après 90 jours sans commande. */
export function segmentOf(orderCount: number, firstOrder: Date, lastOrder: Date, now: Date): Segment | null {
  const days = (d: Date) => (now.getTime() - d.getTime()) / 86_400_000;
  if (days(lastOrder) > 90) return "dormant";
  if (orderCount >= 5) return "loyal";
  if (orderCount === 1 && days(firstOrder) < 30) return "new";
  return null;
}
