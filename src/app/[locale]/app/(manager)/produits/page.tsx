import { getLocale, getTranslations } from "next-intl/server";
import { DropIcon, EyeIcon, EyeSlashIcon, MagnifyingGlassIcon, PlusIcon } from "@phosphor-icons/react/ssr";
import { Chip, EmptyState, Gauge, Money, PageHeader, Pill, Swatch, buttonStyles, cx, inputStyles } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import { type ProductFilter, listProducts } from "@/lib/data";
import { gaugeTone, mainVariant, productLevel } from "@/lib/domain";

const filters: ProductFilter[] = ["all", "low", "out", "hidden"];

export default async function ProductsPage({ searchParams }: PageProps<"/[locale]/app/produits">) {
  const sp = await searchParams;
  const filter = filters.find((f) => f === sp.filtre) ?? "all";
  const q = typeof sp.q === "string" ? sp.q.slice(0, 80) : "";
  const [{ counts, total, products }, t, level, category, locale] = await Promise.all([
    listProducts({ filter, q }),
    getTranslations("products"),
    getTranslations("level"),
    getTranslations("category"),
    getLocale(),
  ]);
  const href = (f: ProductFilter) => `/app/produits?${new URLSearchParams({ ...(f !== "all" && { filtre: f }), ...(q && { q }) })}`;

  const search = (
    <form role="search" className="w-full lg:w-80">
      {filter !== "all" && <input type="hidden" name="filtre" value={filter} />}
      <label className="relative block">
        <span className="sr-only">{t("search")}</span>
        <MagnifyingGlassIcon aria-hidden size={18} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-text-2" />
        <input name="q" type="search" defaultValue={q} placeholder={t("search")} className={cx(inputStyles, "pl-10")} />
      </label>
    </form>
  );

  return (
    <>
      <PageHeader
        overline={t("count", { count: total })}
        title={t("title")}
        action={
          <div className="hidden lg:block">
            <Link href="/app/produits/nouveau" className={cx(buttonStyles.primary, "h-11 text-[15px]")}>
              <PlusIcon aria-hidden size={18} />
              {t("new")}
            </Link>
          </div>
        }
      />

      <div className="px-5 pb-3 lg:hidden">{search}</div>
      <div className="flex items-center justify-between gap-4 lg:px-10">
        <nav aria-label={t("title")} className="flex gap-2 overflow-x-auto px-5 pb-3 [scrollbar-width:none] lg:px-0">
          {filters.map((f) => (
            <Link key={f} href={href(f)} aria-current={f === filter ? "page" : undefined} className="flex-none">
              <Chip active={f === filter}>
                {t(`filters.${f}`)} <span className="font-mono text-xs text-text-2">{counts[f]}</span>
              </Chip>
            </Link>
          ))}
        </nav>
        <div className="hidden pb-3 lg:block">{search}</div>
      </div>

      {products.length === 0 ? (
        <EmptyState icon={<DropIcon size={28} />} title={q ? t("noResult", { q }) : t("empty")} />
      ) : (
        <>
          <ul className="grid grid-cols-2 gap-2.5 px-4 pb-6 lg:hidden">
            {products.map((p) => {
              const main = mainVariant(p);
                            const lvl = productLevel(p);
              return (
                <li key={p.id}>
                  <Link href={`/app/produits/${p.id}`} className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface">
                    <Swatch color={p.swatch} label={p.name[locale]} className="aspect-square w-full rounded-none" />
                    <div className="flex flex-1 flex-col gap-1 p-3">
                      <div className="text-sm leading-snug font-medium">
                        {p.name[locale]} {main.label && <span className="font-normal text-text-2">{main.label}</span>}
                      </div>
                      <div className="flex items-baseline gap-2">
                        <Money cents={p.price} className="text-sm font-semibold" />
                        {p.compareAtPrice && <Money cents={p.compareAtPrice} className="text-xs text-text-2 line-through" />}
                      </div>
                      <div className="font-mono text-xs text-text-2">{t("inStock", { count: main.stock })}</div>
                      {lvl !== "ok" && (
                        <div>
                          <Pill tone={lvl === "out" ? "err" : "warn"}>{level(lvl)}</Pill>
                        </div>
                      )}
                      <Gauge stock={main.stock} max={main.restockLevel} tone={gaugeTone(main.stock, p.threshold)} className="mt-auto" />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mx-10 mb-8 hidden overflow-hidden rounded-lg border border-border bg-surface lg:block">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-text-2">
                <tr className="[&>th]:px-3 [&>th]:py-2.5 [&>th]:font-medium">
                  <th>{t("colProduct")}</th>
                  <th>{t("colCategory")}</th>
                  <th className="text-right">{t("colPrice")}</th>
                  <th>{t("colStock")}</th>
                  <th>{t("colState")}</th>
                  <th>{t("colShop")}</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const main = mainVariant(p);
                                    const lvl = productLevel(p);
                  return (
                    <tr key={p.id} className="relative border-t border-border hover:bg-bg [&>td]:px-3 [&>td]:py-2.5">
                      <td>
                        <div className="flex items-center gap-3">
                          <Swatch color={p.swatch} label={p.name[locale]} className="size-9" />
                          <div>
                            <Link href={`/app/produits/${p.id}`} className="font-medium after:absolute after:inset-0">
                              {p.name[locale]}
                            </Link>
                            <div className="text-xs text-text-2">
                              {[main.label, t("formats", { count: p.variants.length })].filter(Boolean).join(" · ")}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="text-text-2">{category(p.category)}</td>
                      <td className="text-right">
                        <Money cents={p.price} className="block" />
                        {p.compareAtPrice && <Money cents={p.compareAtPrice} className="block text-xs text-text-2 line-through" />}
                      </td>
                      <td className="w-36">
                        <div className="font-mono text-[13px]">
                          {main.stock} <span className="text-text-2">/ {main.restockLevel}</span>
                        </div>
                        <Gauge stock={main.stock} max={main.restockLevel} tone={gaugeTone(main.stock, p.threshold)} className="mt-1.5" />
                      </td>
                      <td>{lvl === "ok" ? <span className="text-xs text-text-2">{level("ok")}</span> : <Pill tone={lvl === "out" ? "err" : "warn"}>{level(lvl)}</Pill>}</td>
                      <td className="text-xs">
                        <span className="inline-flex items-center gap-1.5">
                          {p.online ? <EyeIcon aria-hidden size={16} /> : <EyeSlashIcon aria-hidden size={16} />}
                          {p.online ? t("online") : t("hidden")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
