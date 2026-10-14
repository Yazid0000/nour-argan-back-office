import type {
  Actor,
  Category,
  Cents,
  Customer,
  HistoryEvent,
  Order,
  OrderLine,
  Payment,
  Product,
  Status,
} from "./domain";
import { subtotal } from "./domain";

// Données inventées, mais toujours les mêmes, car le hasard part d'une graine fixe.
// Les dates sont relatives à aujourd'hui, pour que la démo ait toujours des commandes du jour.
// La phase 2 réutilisera ce générateur pour remplir la base (seed).

function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type V = [label: string | null, price: number, stock: number, restockLevel: number];

function product(
  id: string,
  fr: string,
  en: string,
  category: Category,
  swatch: string,
  threshold: number,
  variants: V[],
  description: string,
  extra: { compareAt?: number; online?: boolean; price?: number } = {},
): Product {
  return {
    id,
    name: { fr, en },
    description,
    category,
    swatch,
    threshold,
    price: (extra.price ?? variants[0][1]) * 100,
    compareAtPrice: extra.compareAt ? extra.compareAt * 100 : null,
    online: extra.online ?? true,
    variants: variants.map(([label, price, stock, restockLevel], i) => ({
      id: `${id}-${i + 1}`,
      label,
      price: price * 100,
      stock,
      restockLevel,
    })),
  };
}

// 25 produits, 3 avec plusieurs formats, 2 en rupture, 3 sous le seuil d'alerte.
const products: Product[] = [
  product("argan-pure", "Huile d'argan pure", "Pure argan oil", "oils", "#D9A75F", 10,
    [["50 ml", 110, 18, 30], ["100 ml", 180, 42, 60], ["250 ml", 390, 12, 25]],
    "Pressée à froid à Essaouira, sans additif. Pour le visage, les cheveux et les ongles.",
    { price: 180, compareAt: 220 }),
  product("argan-cosmetique", "Huile d'argan cosmétique", "Cosmetic argan oil", "oils", "#E3C27A", 10,
    [["50 ml", 110, 8, 40]], "Format voyage, flacon compte-gouttes."),
  product("savon-noir-eucalyptus", "Savon noir à l'eucalyptus", "Eucalyptus black soap", "hammam", "#4B5135", 10,
    [["200 g", 45, 64, 80], ["500 g", 95, 22, 30]], "Savon noir traditionnel aux feuilles d'eucalyptus, pour le hammam."),
  product("ghassoul", "Ghassoul en poudre", "Ghassoul clay powder", "hammam", "#C48E7A", 10,
    [["250 g", 60, 0, 50]], "Argile de l'Atlas, à mélanger avec de l'eau de rose."),
  product("eau-de-rose", "Eau de rose de Kelâa", "Kelaa rose water", "face", "#EDB3BC", 10,
    [["100 ml", 35, 26, 40], ["250 ml", 70, 5, 40]], "Distillée dans la vallée des roses, à Kelâa M'Gouna.",
    { price: 70, compareAt: 85 }),
  product("coffret-hammam", "Coffret hammam", "Hammam gift box", "gifts", "#8C6A55", 5,
    [["3 produits", 290, 14, 25]], "Savon noir, gant kessa et ghassoul, dans une boîte en carton recyclé."),
  product("coffret-decouverte", "Coffret découverte argan et rose", "Argan and rose discovery box", "gifts", "#CC9C9A", 8,
    [["4 produits", 340, 3, 20]], "Huile d'argan, eau de rose, crème et baume, en petits formats.", { compareAt: 390 }),
  product("argan-culinaire", "Huile d'argan culinaire", "Culinary argan oil", "oils", "#B9823F", 8,
    [["250 ml", 150, 27, 40]], "Amandons torréfiés, goût de noisette. Pour l'amlou et les salades."),
  product("gant-kessa", "Gant kessa", "Kessa exfoliating glove", "hammam", "#6F7B8A", 10,
    [["1 pièce", 45, 40, 60]], "Gant de gommage en viscose.", { online: false }),
  product("huile-figue", "Huile de figue de Barbarie", "Prickly pear seed oil", "oils", "#9E3B5C", 4,
    [["30 ml", 420, 9, 12]], "Il faut une tonne de figues pour un litre d'huile."),
  product("huile-nigelle", "Huile de nigelle", "Black seed oil", "oils", "#2F2A24", 8,
    [["100 ml", 90, 31, 40]], "Pressée à froid, pour la peau et les cheveux."),
  product("argan-fleur-oranger", "Huile d'argan à la fleur d'oranger", "Orange blossom argan oil", "oils", "#E8C48A", 8,
    [["50 ml", 130, 19, 30]], "Huile d'argan parfumée au néroli."),
  product("savon-noir-nature", "Savon noir nature", "Plain black soap", "hammam", "#3A3226", 10,
    [["200 g", 40, 55, 70]], "À l'huile d'olive, sans parfum."),
  product("pierre-alun", "Pierre d'alun", "Alum stone", "hammam", "#C9CCCF", 8,
    [["90 g", 45, 28, 40]], "Déodorant naturel, à passer humide."),
  product("ghassoul-plantes", "Ghassoul aux sept plantes", "Seven-herb ghassoul", "hammam", "#9A7B56", 8,
    [["200 g", 75, 17, 30]], "Ghassoul mélangé à la lavande, au romarin et à la rose."),
  product("eau-fleur-oranger", "Eau de fleur d'oranger", "Orange blossom water", "face", "#F1D9A6", 10,
    [["250 ml", 65, 33, 40]], "Tonique doux pour le visage."),
  product("creme-argan", "Crème de jour à l'argan", "Argan day cream", "face", "#E9DCC6", 6,
    [["50 ml", 165, 14, 20]], "Crème légère, sans parfum ajouté."),
  product("masque-ghassoul-rose", "Masque ghassoul et rose", "Ghassoul and rose mask", "face", "#D99A94", 6,
    [["100 g", 85, 21, 30]], "Masque purifiant, prêt à l'emploi."),
  product("baume-levres", "Baume à lèvres à l'argan", "Argan lip balm", "face", "#C7865F", 10,
    [["15 ml", 45, 46, 60]], "Cire d'abeille et huile d'argan."),
  product("serum-figue", "Sérum à la figue de Barbarie", "Prickly pear serum", "face", "#A33E5C", 4,
    [["30 ml", 320, 0, 10]], "Sérum de nuit à l'huile de figue de Barbarie."),
  product("shampoing-ghassoul", "Shampoing au ghassoul", "Ghassoul shampoo", "hair", "#B48A6E", 8,
    [["250 ml", 80, 24, 30]], "Lave en douceur, sans sulfate."),
  product("masque-capillaire", "Masque capillaire à l'argan", "Argan hair mask", "hair", "#D3A86B", 6,
    [["200 ml", 110, 12, 20]], "À laisser poser dix minutes."),
  product("huile-cheveux", "Huile cheveux argan et ricin", "Argan and castor hair oil", "hair", "#8E6B3F", 6,
    [["100 ml", 95, 16, 25]], "Bain d'huile avant le shampoing."),
  product("coffret-mariee", "Coffret de la mariée", "Bridal gift box", "gifts", "#E6C9C1", 3,
    [["5 produits", 420, 6, 10]], "Le rituel beauté avant le mariage, en cinq produits."),
  product("trousse-voyage", "Trousse voyage hammam", "Hammam travel kit", "gifts", "#7D8B74", 4,
    [["4 produits", 190, 11, 15]], "Le hammam en petits formats, dans une trousse en coton."),
];

// Les produits phares sortent plus souvent dans les commandes.
const popularity: Record<string, number> = {
  "argan-pure": 10, "savon-noir-eucalyptus": 8, "eau-de-rose": 6, "ghassoul": 5, "coffret-hammam": 3,
  "argan-culinaire": 3, "argan-cosmetique": 4, "savon-noir-nature": 4, "gant-kessa": 3,
};

const firstNames = [
  "Khadija", "Fatima Zahra", "Meryem", "Imane", "Sanaa", "Nadia", "Leila", "Hind", "Yasmine", "Salma",
  "Zineb", "Houda", "Siham", "Ghita", "Samira", "Amina", "Kawtar", "Najat", "Latifa", "Rim",
  "Omar", "Youssef", "Rachid", "Karim", "Mehdi", "Hamza", "Anas", "Said", "Hicham", "Adil",
];
const lastNames = [
  "Benali", "Alaoui", "Tazi", "El Idrissi", "Bennani", "El Fassi", "Kettani", "Amrani", "Lahlou", "Berrada",
  "Chraibi", "Sefrioui", "Ouazzani", "Belkadi", "Naciri", "Benjelloun", "Ziani", "El Amrani", "Hajji", "Squalli",
  "Bouzidi", "Tahiri", "Filali", "Rami", "Skalli", "Guessous", "Lazrak", "Mernissi", "Bennis", "Cherkaoui",
];
const europeFirstNames = ["Sophie", "Claire", "Inès", "Julie", "Camille", "Nora", "Léa", "Manon", "Sarah", "Lucie"];
const europeLastNames = ["Carpentier", "Martin", "Dubois", "Lambert", "Peeters", "Haddad", "Janssens", "Moreau", "Lefebvre", "Roux"];

type City = { name: string; weight: number; postalCode: string; country: Customer["country"]; fee: Cents };
const cities: City[] = [
  { name: "Casablanca", weight: 30, postalCode: "20250", country: "MA", fee: 3500 },
  { name: "Marrakech", weight: 18, postalCode: "40000", country: "MA", fee: 2000 },
  { name: "Rabat", weight: 14, postalCode: "10000", country: "MA", fee: 3500 },
  { name: "Tanger", weight: 9, postalCode: "90000", country: "MA", fee: 3500 },
  { name: "Agadir", weight: 7, postalCode: "80000", country: "MA", fee: 4500 },
  { name: "Fès", weight: 7, postalCode: "30000", country: "MA", fee: 4500 },
  { name: "Essaouira", weight: 4, postalCode: "44000", country: "MA", fee: 4500 },
  { name: "Meknès", weight: 3, postalCode: "50000", country: "MA", fee: 4500 },
  { name: "Tétouan", weight: 2, postalCode: "93000", country: "MA", fee: 4500 },
  { name: "Paris", weight: 2, postalCode: "75011", country: "FR", fee: 900 },
  { name: "Lyon", weight: 1, postalCode: "69003", country: "FR", fee: 900 },
  { name: "Bruxelles", weight: 1, postalCode: "1050", country: "BE", fee: 900 },
];
const streets = ["Derb Lalla Azzouna", "Rue Ibn Battouta", "Avenue Hassan II", "Rue de Fès", "Résidence Al Andalous", "Boulevard Zerktouni", "Rue des Orangers"];
const europeStreets = ["Rue de la Roquette", "Rue Paul Bert", "Chaussée d'Ixelles"];

/** Prix en euros pour l'Europe, arrondi aux 50 centimes. */
const toEuroCents = (mad: Cents) => Math.round(mad / 10.8 / 50) * 50;
const FREE_SHIPPING_MAD = 50000;
const DAY = 86_400_000;
const HOUR = 3_600_000;

function generate(now: Date) {
  const rand = mulberry32(42);
  const pick = <T,>(items: readonly T[]) => items[Math.floor(rand() * items.length)];
  const weighted = <T,>(items: readonly T[], weight: (t: T) => number) => {
    let r = rand() * items.reduce((s, t) => s + weight(t), 0);
    return items.find((t) => (r -= weight(t)) < 0) ?? items[items.length - 1];
  };
  const digits = (n: number) => Array.from({ length: n }, () => Math.floor(rand() * 10)).join("");

  const customers: Customer[] = [];
  const taken = new Set<string>();
  function uniqueName(europe: boolean) {
    for (;;) {
      const name = europe ? `${pick(europeFirstNames)} ${pick(europeLastNames)}` : `${pick(firstNames)} ${pick(lastNames)}`;
      if (!taken.has(name)) return taken.add(name), name;
    }
  }
  function newCustomer(at: Date): Customer {
    const city = weighted(cities, (c) => c.weight);
    const europe = city.country !== "MA";
    const c: Customer = {
      id: `c${customers.length + 1}`,
      name: uniqueName(europe),
      phone: europe
        ? city.country === "FR" ? `+33 6 ${digits(2)} ${digits(2)} ${digits(2)} ${digits(2)}` : `+32 4${digits(2)} ${digits(2)} ${digits(2)} ${digits(2)}`
        : `+212 6 ${digits(2)} ${digits(2)} ${digits(2)} ${digits(2)}`,
      address: `${pick(europe ? europeStreets : streets)}, n° ${1 + Math.floor(rand() * 60)}`,
      city: city.name,
      postalCode: city.postalCode,
      country: city.country,
      note: rand() < 0.08 ? "Préfère être appelée après 18 h." : null,
      createdAt: at,
    };
    customers.push(c);
    return c;
  }

  // Environ 2 commandes par jour il y a un an, 5 aujourd'hui. La boutique grandit.
  const orders: Order[] = [];
  for (let day = 0; day <= 364; day++) {
    const rate = 1.6 + 3.4 * (day / 364) ** 1.5;
    const count = Math.floor(rate + rand() * 2.2 - 0.6);
    for (let k = 0; k < count; k++) {
      const createdAt = new Date(now.getTime() - (364 - day) * DAY - rand() * 20 * HOUR);
      const customer = customers.length > 20 && rand() < 0.5 ? pick(customers) : newCustomer(createdAt);
      const city = cities.find((c) => c.name === customer.city)!;
      const europe = city.country !== "MA";

      const lines: OrderLine[] = [];
      const lineCount = rand() < 0.55 ? 1 : rand() < 0.75 ? 2 : 3;
      for (let i = 0; i < lineCount; i++) {
        const p = weighted(products, (p) => popularity[p.id] ?? 1);
        if (lines.some((l) => l.productId === p.id)) continue;
        const v = pick(p.variants);
        lines.push({
          productId: p.id,
          variantId: v.id,
          qty: rand() < 0.75 ? 1 : 2,
          unitPrice: europe ? toEuroCents(v.price) : v.price,
        });
      }
      const sub = subtotal({ lines });
      const freeShipping = !europe && sub >= FREE_SHIPPING_MAD;
      const payment: Payment = europe ? "card" : rand() < 0.88 ? "cod" : "transfer";

      orders.push({
        id: "",
        number: 0,
        customerId: customer.id,
        createdAt,
        status: "delivered",
        payment,
        currency: europe ? "EUR" : "MAD",
        lines,
        shippingFee: freeShipping ? 0 : city.fee,
        note: null,
        history: [],
      });
    }
  }

  // Les plus récentes sont encore en cours. Les anciennes sont livrées, sauf quelques retours et annulations.
  orders.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const n = orders.length;
  orders.forEach((o, i) => {
    o.number = 101 + i;
    o.id = String(o.number);
    const fromEnd = n - 1 - i;
    let status: Status;
    if (fromEnd < 9) status = "received";
    else if (fromEnd < 19) status = fromEnd < 15 ? "confirmed" : "prepared";
    else if (fromEnd < 31) status = "shipped";
    else if (fromEnd === 34 || fromEnd === 41) status = "refused";
    else {
      const r = rand();
      status = r < 0.035 ? "returned" : r < 0.075 ? "cancelled" : "delivered";
    }
    o.status = status;
    o.history = historyFor(o, now, rand, fromEnd === 13 || fromEnd === 14);
    if (status === "received" && rand() < 0.4) o.note = "Préfère être appelée après 18 h. Rappeler ce soir.";
  });

  return { products, customers, orders, now };
}

/** Rejoue le parcours de la commande jusqu'à son statut, avec qui a fait quoi. */
function historyFor(o: Order, now: Date, rand: () => number, urgent: boolean): HistoryEvent[] {
  const path: [Status, Actor][] =
    o.status === "cancelled"
      ? [["received", "site"], ["cancelled", "salma"]]
      : [["received", "site"], ["confirmed", "salma"], ["prepared", "youssef"], ["shipped", "youssef"], ["delivered", "courier"]];
  if (o.status === "refused" || o.status === "returned") {
    path.splice(4, 1, ["refused", "courier"]);
    if (o.status === "returned") path.push(["returned", "youssef"]);
  }
  const events: HistoryEvent[] = [];
  let t = o.createdAt.getTime();
  for (const [kind, actor] of path) {
    if (kind !== "received") t += (kind === "delivered" || kind === "refused" ? 20 + rand() * 30 : 1 + rand() * 6) * HOUR;
    // Les colis à préparer ont été confirmés dans la journée. Les urgents attendent depuis plus de 24 h.
    if (kind === "confirmed" && (o.status === "confirmed" || o.status === "prepared"))
      t = Math.max(o.createdAt.getTime() + HOUR, now.getTime() - (urgent ? 26 + rand() * 6 : 2 + rand() * 18) * HOUR);
    events.push({ at: new Date(Math.min(t, now.getTime() - 60_000)), actor, kind });
    if (kind === o.status) break;
  }
  if (o.status === "received" && rand() < 0.5) {
    events.push({ at: new Date(Math.min(o.createdAt.getTime() + HOUR, now.getTime() - 60_000)), actor: "salma", kind: "callNoAnswer" });
  }
  return events;
}

export const settings = {
  shop: { name: "Nour Argan", whatsapp: "06 61 00 42 17", email: "bonjour@nourargan.ma", city: "Marrakech" },
  shippingZones: [
    { cities: "Marrakech", fee: 2000 },
    { cities: "Casablanca, Rabat, Tanger", fee: 3500 },
    { cities: "others", fee: 4500 },
  ],
  freeShippingFrom: FREE_SHIPPING_MAD as Cents | null,
  payments: { cod: true, transfer: true, card: false } satisfies Record<Payment, boolean>,
  team: [
    { name: "Salma", email: "salma@nourargan.ma", role: "manager" as const },
    { name: "Youssef", email: "youssef@nourargan.ma", role: "preparer" as const },
  ],
  notifications: { newOrder: true, lowStock: true, dailySummary: false },
};

// Régénéré une fois par jour, pour que « aujourd'hui » reste aujourd'hui.
let cache: { day: string; data: ReturnType<typeof generate> } | null = null;

export function demoData(now = new Date()) {
  const day = now.toDateString();
  if (cache?.day !== day) cache = { day, data: generate(now) };
  return cache.data;
}
