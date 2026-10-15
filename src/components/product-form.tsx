"use client";

import { type FormEvent, type ReactNode, startTransition, useActionState, useId, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CaretDownIcon, CheckCircleIcon, MinusIcon, PlusIcon, TrashIcon, WarningCircleIcon, XIcon } from "@phosphor-icons/react/ssr";
import { Link } from "@/i18n/navigation";
import { type Category, type Product, categories } from "@/lib/domain";
import { type ProductFormState, saveProduct } from "@/lib/product-actions";
import { PhotoPicker } from "./photo-picker";
import { ActionBar, Switch, buttonStyles, cx, inputStyles } from "./ui";

const toMad = (cents: number) => String(cents / 100);

// id est celui du format en base, vide pour un format ajouté dans le formulaire.
// stockWas est le stock lu au chargement, pour repérer une commande passée pendant la modification.
type Row = { key: string; id: string; label: string; price: string; stock: string; stockWas: string };

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

function MoneyInput({ id, name, defaultValue, invalid }: { id: string; name: string; defaultValue?: string; invalid?: boolean }) {
  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        inputMode="decimal"
        defaultValue={defaultValue}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? `${id}-error` : undefined}
        className={cx(inputStyles, "pr-14 font-mono")}
      />
      <span aria-hidden className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-[13px] text-text-2">MAD</span>
    </div>
  );
}

/** Formulaire produit, en création comme en modification. Enregistré par l'action serveur saveProduct. */
export function ProductForm({ product, saved = false }: { product?: Product; saved?: boolean }) {
  const t = useTranslations("productForm");
  const common = useTranslations("common");
  const nav = useTranslations("nav");
  const locale = useLocale();
  const cat = useTranslations("category");
  const id = useId();
  const [state, action, pending] = useActionState<ProductFormState, FormData>(saveProduct, null);
  const errors = state?.errors ?? {};
  const err = (field: string) => (errors[field] ? t(`errors.${errors[field]}`) : undefined);
  const errorCount = Object.keys(errors).length;

  // On envoie nous-mêmes le formulaire, car React viderait les champs après un envoi par <form action>
  // et Salma perdrait sa saisie à la moindre erreur.
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => action(data));
  }
  const [rows, setRows] = useState<Row[]>(() =>
    product
      ? product.variants.map((v) => ({ key: v.id, id: v.id, label: v.label ?? "", price: toMad(v.price), stock: String(v.stock), stockWas: String(v.stock) }))
      : [{ key: "new-1", id: "", label: "", price: "", stock: "", stockWas: "" }],
  );
  const [threshold, setThreshold] = useState(product?.threshold ?? 10);
  const [uploading, setUploading] = useState(false);

  const update = (key: string, field: keyof Row, value: string) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, [field]: value } : r)));

  // Une adresse refusée arrive sous « photos.2 », on l'affiche sous le bloc photos.
  const photoKey = Object.keys(errors).find((k) => k.startsWith("photos"));
  const photosBlock = <PhotoPicker initial={product?.photos ?? []} error={photoKey && err(photoKey)} onBusyChange={setUploading} />;

  const variantKey = Object.keys(errors).find((k) => k.startsWith("variants"));
  const variantError = variantKey ? errors[variantKey] : undefined;

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
            <input type="hidden" name={`variants.${i}.id`} value={r.id} />
            <input type="hidden" name={`variants.${i}.stockWas`} value={r.stockWas} />
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
              aria-invalid={errors[`variants.${i}.price`] ? true : undefined}
              className={cx(inputStyles, "min-h-11 px-2.5 font-mono")}
            />
            <input
              aria-label={`${t("formatStock")} ${r.label}`}
              name={`variants.${i}.stock`}
              inputMode="numeric"
              value={r.stock}
              onChange={(e) => update(r.key, "stock", e.target.value)}
              aria-invalid={errors[`variants.${i}.stock`] ? true : undefined}
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
          onClick={() => setRows((rs) => [...rs, { key: `new-${Date.now()}`, id: "", label: "", price: "", stock: "", stockWas: "" }])}
          className="flex min-h-12 w-full items-center gap-2 border-t border-border px-3 text-sm font-medium text-accent"
        >
          <PlusIcon aria-hidden size={16} />
          {t("addFormat")}
        </button>
      </div>
      {/* La première erreur des formats suffit, les champs fautifs sont déjà entourés de rouge. */}
      {variantError && <p className="text-xs text-err-fg">{t(`errors.${variantError}`)}</p>}
    </section>
  );

  const priceRow = (
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("price")} htmlFor={`${id}-price`} error={err("price")}>
          <MoneyInput id={`${id}-price`} name="price" defaultValue={product && toMad(product.price)} invalid={!!errors.price} />
        </Field>
        <Field
          label={<>{t("compareAt")} <span className="font-normal text-text-2">{t("optional")}</span></>}
          htmlFor={`${id}-compare`}
          error={err("compareAtPrice")}
        >
          <MoneyInput
            id={`${id}-compare`}
            name="compareAtPrice"
            defaultValue={product?.compareAtPrice ? toMad(product.compareAtPrice) : ""}
            invalid={!!errors.compareAtPrice}
          />
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
      <Field label={t("threshold")} hint={t("thresholdHint")} htmlFor={`${id}-threshold`} error={err("threshold")}>
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
    <button type="submit" disabled={pending || uploading} className={cx(buttonStyles.primary, "h-[52px] w-full text-base lg:h-11 lg:w-auto lg:text-[15px]")}>
      {t("save")}
    </button>
  );

  return (
    // Sans JavaScript, action envoie quand même le formulaire en POST à l'action serveur.
    // Avec JavaScript, onSubmit garde la main pour ne pas vider le formulaire.
    <form action={action} onSubmit={submit} noValidate className="flex min-h-full flex-col">
      <input type="hidden" name="locale" value={locale} />
      {product && <input type="hidden" name="id" value={product.id} />}
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

      {(errorCount > 0 || saved) && (
        <div className="px-5 lg:px-10">
          {errorCount > 0 ? (
            <p role="alert" className="flex items-center gap-2 rounded-lg bg-err-bg px-3.5 py-3 text-sm text-err-fg">
              <WarningCircleIcon aria-hidden size={18} className="flex-none" />
              {errors.form ? t(`errors.${errors.form}`) : t("errorsSummary", { count: errorCount })}
            </p>
          ) : (
            <p role="status" className="flex items-center gap-2 rounded-lg bg-ok-bg px-3.5 py-3 text-sm text-ok-fg">
              <CheckCircleIcon aria-hidden size={18} className="flex-none" />
              {t("saved")}
            </p>
          )}
        </div>
      )}

      {/*
        Chaque champ n'existe qu'une fois. Sur mobile, les cadres disparaissent (contents)
        et "order" range les blocs dans l'ordre de la maquette. Sur desktop, deux colonnes.
      */}
      <div className="flex flex-1 flex-col gap-5 px-5 pt-3 pb-6 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:px-10 lg:pb-10">
        <div className="contents lg:flex lg:flex-col lg:gap-5 lg:rounded-lg lg:border lg:border-border lg:bg-surface lg:p-5">
          <div className="order-1 lg:order-none">{photosBlock}</div>
          <div className="order-2 lg:order-none">
            <Field label={t("name")} htmlFor={`${id}-name`} error={err("nameFr")}>
              <input id={`${id}-name`} name="nameFr" defaultValue={product?.name.fr} aria-invalid={errors.nameFr ? true : undefined} className={inputStyles} />
            </Field>
          </div>
          <div className="order-3 lg:order-none">
            <Field label={t("nameEn")} hint={t("nameEnHint")} htmlFor={`${id}-name-en`} error={err("nameEn")}>
              <input id={`${id}-name-en`} name="nameEn" defaultValue={product?.name.en} lang="en" className={inputStyles} />
            </Field>
          </div>
          <div className="order-4 lg:order-none">
            <Field label={t("description")} htmlFor={`${id}-description`} error={err("description")}>
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
