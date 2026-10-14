"use client";

import { useId, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CameraIcon, CaretDownIcon, MinusIcon, PlusIcon, TrashIcon, XIcon } from "@phosphor-icons/react/ssr";
import { Link } from "@/i18n/navigation";
import { type Category, type Product, categories } from "@/lib/domain";
import { ActionBar, Swatch, Switch, buttonStyles, cx, inputStyles } from "./ui";

const MAX_PHOTOS = 8;
const toMad = (cents: number) => String(cents / 100);

type Row = { key: string; label: string; price: string; stock: string };

export function Field({ label, hint, error, htmlFor, children }: { label: ReactNode; hint?: string; error?: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-sm font-medium">{label}</label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-xs text-err-fg">{error}</p>
      ) : (
        hint && <p className="text-xs text-text-2">{hint}</p>
      )}
    </div>
  );
}

function MoneyInput({ id, name, defaultValue }: { id: string; name: string; defaultValue?: string }) {
  return (
    <div className="relative">
      <input id={id} name={name} inputMode="decimal" defaultValue={defaultValue} className={cx(inputStyles, "pr-14 font-mono")} />
      <span aria-hidden className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-[13px] text-text-2">MAD</span>
    </div>
  );
}

/** Formulaire produit, en création comme en modification. L'enregistrement arrive à la phase 4. */
export function ProductForm({ product }: { product?: Product }) {
  const t = useTranslations("productForm");
  const common = useTranslations("common");
  const nav = useTranslations("nav");
  const locale = useLocale();
  const cat = useTranslations("category");
  const id = useId();
  const [rows, setRows] = useState<Row[]>(() =>
    product
      ? product.variants.map((v) => ({ key: v.id, label: v.label ?? "", price: toMad(v.price), stock: String(v.stock) }))
      : [{ key: "new-1", label: "", price: "", stock: "" }],
  );
  const [threshold, setThreshold] = useState(product?.threshold ?? 10);
  const [photos, setPhotos] = useState<string[]>([]);
  const existingPhotos = product ? 2 : 0;
  const photoCount = existingPhotos + photos.length;

  const update = (key: string, field: keyof Row, value: string) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, [field]: value } : r)));

  const photoTile = "relative aspect-square w-[88px] flex-none overflow-hidden rounded-lg lg:w-24";

  const photosBlock = (
    <section className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-medium">{t("photos")}</h2>
        <span className="font-mono text-xs text-text-2">{photoCount} / {MAX_PHOTOS}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <label className={cx(photoTile, "flex cursor-pointer flex-col items-center justify-center gap-1.5 border border-dashed border-text-2 bg-surface text-center text-xs font-medium focus-within:outline-2 focus-within:outline-accent")}>
          <CameraIcon aria-hidden size={20} />
          {t("takePhoto")}
          {/* Avec capture, le téléphone ouvre directement l'appareil photo. */}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            className="sr-only"
            onChange={(e) => {
              const files = [...(e.target.files ?? [])].slice(0, MAX_PHOTOS - photoCount);
              setPhotos((p) => [...p, ...files.map((f) => URL.createObjectURL(f))]);
            }}
          />
        </label>
        {product &&
          [0, 1].map((i) => (
            <div key={i} className={photoTile}>
              <Swatch color={product.swatch} label={product.name[locale]} className={cx("size-full", i === 1 && "opacity-80")} />
              {i === 0 && <span className="absolute top-1.5 left-1.5 rounded bg-surface px-1.5 py-0.5 text-[11px] font-semibold">{t("main")}</span>}
            </div>
          ))}
        {photos.map((src, i) => (
          <div key={src} className={photoTile}>
            {/* Aperçu local seulement, l'envoi au serveur arrive à la phase 5. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="size-full object-cover" />
            {i === 0 && existingPhotos === 0 && (
              <span className="absolute top-1.5 left-1.5 rounded bg-surface px-1.5 py-0.5 text-[11px] font-semibold">{t("main")}</span>
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-text-2">{t("photosHint")}</p>
    </section>
  );

  const formats = (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-medium">{t("formats")}</h2>
      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <div className="grid grid-cols-[1fr_1fr_1fr_44px] gap-2 px-3 pt-2.5 pb-1 text-xs text-text-2" aria-hidden>
          <span>{t("format")}</span>
          <span>{t("formatPrice")}</span>
          <span>{t("formatStock")}</span>
        </div>
        {rows.map((r, i) => (
          <div key={r.key} className="grid grid-cols-[1fr_1fr_1fr_44px] items-center gap-2 border-t border-border px-3 py-1.5">
            <input
              aria-label={`${t("format")} ${i + 1}`}
              name={`variants.${i}.label`}
              value={r.label}
              placeholder={t("formatPlaceholder")}
              onChange={(e) => update(r.key, "label", e.target.value)}
              className="min-h-11 w-full min-w-0 rounded-lg px-1 text-[15px] font-medium placeholder:font-normal placeholder:text-text-2"
            />
            <input
              aria-label={`${t("formatPrice")} ${r.label}`}
              name={`variants.${i}.price`}
              inputMode="decimal"
              value={r.price}
              onChange={(e) => update(r.key, "price", e.target.value)}
              className={cx(inputStyles, "min-h-11 px-2.5 font-mono")}
            />
            <input
              aria-label={`${t("formatStock")} ${r.label}`}
              name={`variants.${i}.stock`}
              inputMode="numeric"
              value={r.stock}
              onChange={(e) => update(r.key, "stock", e.target.value)}
              className={cx(inputStyles, "min-h-11 px-2.5 font-mono")}
            />
            <button
              type="button"
              aria-label={t("removeFormat", { label: r.label || i + 1 })}
              disabled={rows.length === 1}
              onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}
              className="flex size-11 items-center justify-center text-text-2 disabled:opacity-30"
            >
              <TrashIcon aria-hidden size={18} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setRows((rs) => [...rs, { key: `new-${Date.now()}`, label: "", price: "", stock: "" }])}
          className="flex min-h-12 w-full items-center gap-2 border-t border-border px-3 text-sm font-medium text-accent"
        >
          <PlusIcon aria-hidden size={16} />
          {t("addFormat")}
        </button>
      </div>
    </section>
  );

  const priceRow = (
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("price")} htmlFor={`${id}-price`}>
          <MoneyInput id={`${id}-price`} name="price" defaultValue={product && toMad(product.price)} />
        </Field>
        <Field
          label={<>{t("compareAt")} <span className="font-normal text-text-2">{t("optional")}</span></>}
          htmlFor={`${id}-compare`}
        >
          <MoneyInput id={`${id}-compare`} name="compareAtPrice" defaultValue={product?.compareAtPrice ? toMad(product.compareAtPrice) : ""} />
        </Field>
      </div>
  );

  const categoryField = (
      <Field label={t("category")} htmlFor={`${id}-category`}>
        <div className="relative">
          <select id={`${id}-category`} name="category" defaultValue={product?.category ?? "oils"} className={cx(inputStyles, "appearance-none pr-10")}>
            {categories.map((c: Category) => (
              <option key={c} value={c}>{cat(c)}</option>
            ))}
          </select>
          <CaretDownIcon aria-hidden size={16} className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-text-2" />
        </div>
      </Field>
  );

  const thresholdField = (
      <Field label={t("threshold")} hint={t("thresholdHint")} htmlFor={`${id}-threshold`}>
        <div className="flex items-center gap-2">
          <button type="button" aria-label={t("less")} onClick={() => setThreshold((v) => Math.max(0, v - 1))} className={cx(buttonStyles.secondary, "size-11 px-0")}>
            <MinusIcon aria-hidden size={18} />
          </button>
          <input
            id={`${id}-threshold`}
            name="threshold"
            inputMode="numeric"
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value.replace(/\D/g, "")) || 0)}
            className={cx(inputStyles, "min-h-11 w-16 text-center font-mono")}
          />
          <button type="button" aria-label={t("more")} onClick={() => setThreshold((v) => v + 1)} className={cx(buttonStyles.secondary, "size-11 px-0")}>
            <PlusIcon aria-hidden size={18} />
          </button>
        </div>
      </Field>
  );

  const onlineSwitch = (
    <div className="rounded-lg border border-border bg-surface">
      <Switch name="online" defaultChecked={product?.online ?? true} label={t("online")} hint={t("onlineHint")} />
    </div>
  );

  const save = (
    <button type="submit" className={cx(buttonStyles.primary, "h-[52px] w-full text-base lg:h-11 lg:w-auto lg:text-[15px]")}>
      {t("save")}
    </button>
  );

  return (
    // Rien n'est encore envoyé au serveur, ça arrive à la phase 4.
    <form onSubmit={(e) => e.preventDefault()} className="flex min-h-full flex-col">
      <header className="flex items-center gap-2 px-3 pt-3 pb-2 lg:items-end lg:justify-between lg:px-10 lg:pt-7 lg:pb-5">
        <div className="flex items-center gap-1">
          <Link href="/app/produits" aria-label={common("close")} className="flex size-11 items-center justify-center lg:hidden">
            <XIcon aria-hidden size={22} />
          </Link>
          <div>
            <p className="hidden text-sm text-text-2 lg:block">
              <Link href="/app/produits" className="text-accent">{nav("products")}</Link>
              {" / "}
              {product ? product.name[locale] : t("breadcrumbNew")}
            </p>
            <h1 className="font-display text-xl font-semibold tracking-[-0.02em] lg:text-[32px]">
              {product ? t("editTitle") : t("newTitle")}
            </h1>
          </div>
        </div>
        <div className="hidden gap-2.5 lg:flex">
          <Link href="/app/produits" className={cx(buttonStyles.secondary, "h-11 text-[15px]")}>{common("cancel")}</Link>
          {save}
        </div>
      </header>

      {/*
        Chaque champ n'existe qu'une fois. Sur mobile, les cadres disparaissent (contents)
        et "order" range les blocs dans l'ordre de la maquette. Sur desktop, deux colonnes.
      */}
      <div className="flex flex-1 flex-col gap-5 px-5 pt-3 pb-6 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:px-10 lg:pb-10">
        <div className="contents lg:flex lg:flex-col lg:gap-5 lg:rounded-lg lg:border lg:border-border lg:bg-surface lg:p-5">
          <div className="order-1 lg:order-none">{photosBlock}</div>
          <div className="order-2 lg:order-none">
            <Field label={t("name")} htmlFor={`${id}-name`}>
              <input id={`${id}-name`} name="nameFr" defaultValue={product?.name.fr} className={inputStyles} />
            </Field>
          </div>
          <div className="order-3 lg:order-none">
            <Field label={t("nameEn")} hint={t("nameEnHint")} htmlFor={`${id}-name-en`}>
              <input id={`${id}-name-en`} name="nameEn" defaultValue={product?.name.en} lang="en" className={inputStyles} />
            </Field>
          </div>
          <div className="order-4 lg:order-none">
            <Field label={t("description")} htmlFor={`${id}-description`}>
              <textarea id={`${id}-description`} name="description" rows={3} defaultValue={product?.description} className={cx(inputStyles, "py-3 leading-relaxed")} />
            </Field>
          </div>
          <div className="order-7 lg:order-none">{formats}</div>
        </div>
        <div className="contents lg:flex lg:flex-col lg:gap-3">
          <div className="order-9 lg:order-none">{onlineSwitch}</div>
          <div className="contents lg:flex lg:flex-col lg:gap-5 lg:rounded-lg lg:border lg:border-border lg:bg-surface lg:p-5">
            <div className="order-5 lg:order-none">{priceRow}</div>
            <div className="order-6 lg:order-none">{categoryField}</div>
            <div className="order-8 lg:order-none">{thresholdField}</div>
          </div>
        </div>
      </div>

      <ActionBar className="lg:hidden">{save}</ActionBar>
    </form>
  );
}
