"use server";

import { randomBytes } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db, pgCode } from "@/db";
import { products, variants } from "@/db/schema";
import { redirect } from "@/i18n/navigation";
import { categories } from "./domain";
import { formLocale } from "./form-locale";
import { ForbiddenError, requireRole } from "./session";

/** Les messages d'erreur sont des codes, traduits dans l'interface (productForm.errors.*). */
const productErrors = ["required", "money", "compareAtLow", "tooLong", "stock", "threshold", "variantInUse", "stockChanged", "notFound", "forbidden", "invalid"] as const;
export type ProductError = (typeof productErrors)[number];
/** Un message Zod qui n'est pas un de nos codes (catégorie inconnue, trop de formats…) devient « invalid ». */
const toError = (message: string): ProductError => productErrors.find((e) => e === message) ?? "invalid";
export type ProductFormState = { errors: Record<string, ProductError> } | null;

// Un prix tapé en dirhams (« 180 », « 74,50 »), converti en centimes.
const money = z
  .string()
  .trim()
  .regex(/^\d{1,6}([.,]\d{1,2})?$/, "money")
  .transform((s) => Math.round(Number(s.replace(",", ".")) * 100))
  .refine((cents) => cents > 0, "money");

const variant = z.object({
  id: z.string().max(80).optional(),
  label: z.string().trim().max(40, "tooLong"),
  price: money,
  stock: z.string().trim().regex(/^\d{1,5}$/, "stock").transform(Number),
  stockWas: z.string().regex(/^\d{1,5}$/).transform(Number).optional(),
});

const product = z
  .object({
    id: z.string().max(80).optional(),
    nameFr: z.string().trim().min(1, "required").max(120, "tooLong"),
    nameEn: z.string().trim().max(120, "tooLong"),
    description: z.string().trim().max(1000, "tooLong"),
    price: z.string().trim().min(1, "required").pipe(money),
    compareAtPrice: z.union([z.literal(""), money]),
    category: z.enum(categories),
    threshold: z.string().trim().regex(/^\d{1,3}$/, "threshold").transform(Number),
    online: z.boolean(),
    variants: z.array(variant).min(1, "required").max(10),
  })
  .refine((p) => p.compareAtPrice === "" || p.compareAtPrice > p.price, { path: ["compareAtPrice"], message: "compareAtLow" });

/** Les champs « variants.0.price »… du formulaire, rangés en liste. */
function readVariants(form: FormData) {
  const rows: Record<string, Record<string, string>> = {};
  for (const [key, value] of form) {
    const m = /^variants\.(\d{1,2})\.(id|label|price|stock|stockWas)$/.exec(key);
    if (m && typeof value === "string") (rows[m[1]] ??= {})[m[2]] = value;
  }
  return Object.keys(rows)
    .sort((a, b) => Number(a) - Number(b))
    .map((i) => rows[i]);
}

const text = (form: FormData, key: string) => {
  const v = form.get(key);
  return typeof v === "string" ? v : "";
};

const randomId = () => randomBytes(4).toString("hex");
const slug = (s: string) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

/**
 * Le stock tapé n'est écrit que s'il a changé, et seulement si la base a toujours le stock lu au chargement.
 * Sinon on écrit -1, la règle stock >= 0 refuse, et tout le batch est annulé.
 * Une commande confirmée pendant la modification n'est donc jamais effacée.
 */
function stockUpdate(stock: number, stockWas: number | undefined) {
  if (stock === stockWas) return {};
  return {
    stock: sql<number>`case when ${variants.stock} = ${stockWas ?? -1} then ${stock} else -1 end`,
    // Le 100 % de la jauge suit le stock quand on réapprovisionne au-delà.
    restockLevel: sql<number>`greatest(${variants.restockLevel}, ${stock})`,
  };
}

/** Crée ou modifie un produit et ses formats. Réservé à la gérante. */
export async function saveProduct(_previous: ProductFormState, form: FormData): Promise<ProductFormState> {
  try {
    await requireRole("manager");
  } catch (e) {
    if (e instanceof ForbiddenError) return { errors: { form: "forbidden" } };
    throw e;
  }

  const parsed = product.safeParse({
    id: text(form, "id") || undefined,
    nameFr: text(form, "nameFr"),
    nameEn: text(form, "nameEn"),
    description: text(form, "description"),
    price: text(form, "price"),
    compareAtPrice: text(form, "compareAtPrice").trim(),
    category: text(form, "category"),
    threshold: text(form, "threshold"),
    online: form.get("online") === "on",
    variants: readVariants(form).map((v) => ({ ...v, id: v.id || undefined, stockWas: v.stockWas || undefined })),
  });
  if (!parsed.success) {
    // Une erreur par champ, nommée comme le champ (« price », « variants.1.stock »).
    const errors: Record<string, ProductError> = {};
    for (const issue of parsed.error.issues) errors[issue.path.join(".")] ??= toError(issue.message);
    return { errors };
  }
  const p = parsed.data;
  const id = p.id ?? `${slug(p.nameFr) || "produit"}-${randomId()}`;

  // En modification, on ne touche qu'aux formats de CE produit. Un id venu d'ailleurs est ignoré.
  const existing = p.id ? await db.select({ id: variants.id }).from(variants).where(eq(variants.productId, p.id)) : [];
  if (p.id && existing.length === 0) return { errors: { form: "notFound" } };
  const owned = new Set(existing.map((v) => v.id));
  const kept = new Set(p.variants.flatMap((v) => (v.id && owned.has(v.id) ? [v.id] : [])));
  const removed = [...owned].filter((v) => !kept.has(v));

  const values = {
    nameFr: p.nameFr,
    nameEn: p.nameEn || p.nameFr,
    description: p.description,
    category: p.category,
    price: p.price,
    compareAtPrice: p.compareAtPrice === "" ? null : p.compareAtPrice,
    threshold: p.threshold,
    online: p.online,
  };

  try {
    // Un seul batch, donc une seule transaction. Le produit et tous ses formats changent ensemble.
    await db.batch([
      p.id ? db.update(products).set(values).where(eq(products.id, id)) : db.insert(products).values({ id, ...values, swatch: "#D9C3A5" }),
      ...p.variants.map((v, position) =>
        v.id && owned.has(v.id)
          ? db
              .update(variants)
              .set({ label: v.label || null, price: v.price, position, ...stockUpdate(v.stock, v.stockWas) })
              .where(eq(variants.id, v.id))
          : db.insert(variants).values({ id: `${id}-${randomId()}`, productId: id, label: v.label || null, price: v.price, stock: v.stock, restockLevel: v.stock, position }),
      ),
      ...removed.map((vid) => db.delete(variants).where(eq(variants.id, vid))),
    ]);
  } catch (e) {
    // 23503, clé étrangère. Un format déjà vendu ne peut pas disparaître, les commandes pointent vers lui.
    if (pgCode(e) === "23503") return { errors: { variants: "variantInUse" } };
    // 23514, la règle stock >= 0. Seul stockUpdate peut l'enfreindre, quand le stock a bougé entre-temps.
    if (pgCode(e) === "23514") return { errors: { variants: "stockChanged" } };
    throw e;
  }

  return redirect({ href: `/app/produits/${id}?enregistre=1`, locale: formLocale(form) });
}
