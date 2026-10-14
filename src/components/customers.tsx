import { getLocale, getTranslations } from "next-intl/server";
import { CaretLeftIcon, MagnifyingGlassIcon, PhoneIcon, UsersIcon, WhatsappLogoIcon, XIcon } from "@phosphor-icons/react/ssr";
import { Link } from "@/i18n/navigation";
import { type CustomerFilter, getCustomer, listCustomers } from "@/lib/data";
import type { Segment } from "@/lib/domain";
import { formatDay, formatWhen, moneyParts } from "@/lib/format";
import { ActionBar, Chip, EmptyState, Money, Pill, StatusPill, type Tone, buttonStyles, cx, inputStyles } from "./ui";

export const customerFilters: CustomerFilter[] = ["all", "loyal", "new", "dormant"];
const segmentTone: Record<Segment, Tone> = { loyal: "ok", new: "info", dormant: "warn" };

const initials = (name: string) =>
  name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

function Avatar({ name }: { name: string }) {
  return (
    <span aria-hidden className="flex size-10 flex-none items-center justify-center rounded-lg border border-border bg-bg text-[13px] font-semibold">
      {initials(name)}
    </span>
  );
}

/** Liste des clients et fiche. Comme les commandes, l'un ou l'autre sur mobile, les deux sur desktop. */
export async function CustomersScreen({ segment, q = "", selectedId }: { segment: CustomerFilter; q?: string; selectedId?: string }) {
  const [{ now, counts, total: count, rows }, t, seg, common, locale] = await Promise.all([
    listCustomers({ segment, q }),
    getTranslations("customers"),
    getTranslations("segment"),
    getTranslations("common"),
    getLocale(),
  ]);
  const query = (s: CustomerFilter) => new URLSearchParams({ ...(s !== "all" && { segment: s }), ...(q && { q }) }).toString();
  const when = { today: common("today"), yesterday: common("yesterday") };

  return (
    <div className="grid min-h-0 flex-1 auto-rows-[minmax(0,1fr)] grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] lg:overflow-hidden">
      <div className={cx("flex min-w-0 flex-col lg:overflow-y-auto lg:pb-8", selectedId && "max-lg:hidden")}>
        <header className="px-5 pt-5 pb-3.5 lg:px-10 lg:pt-7 lg:pb-5">
          <p className="mb-0.5 text-[13px] text-text-2 lg:text-sm">{t("count", { count })}</p>
          <h1 className="font-display text-[28px] font-semibold tracking-[-0.02em] lg:text-[32px]">{t("title")}</h1>
        </header>
        <form role="search" className="order-1 px-5 pb-3 lg:order-2 lg:px-10">
          {segment !== "all" && <input type="hidden" name="segment" value={segment} />}
          <label className="relative block">
            <span className="sr-only">{t("search")}</span>
            <MagnifyingGlassIcon aria-hidden size={18} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-text-2" />
            <input name="q" type="search" defaultValue={q} placeholder={t("search")} className={cx(inputStyles, "pl-10")} />
          </label>
        </form>
        <nav aria-label={t("title")} className="order-2 flex flex-none gap-2 overflow-x-auto px-5 pb-3 [scrollbar-width:none] lg:order-1 lg:px-10">
          {customerFilters.map((s) => (
            <Link key={s} href={`/app/clients?${query(s)}`} aria-current={s === segment ? "page" : undefined} className="flex-none">
              <Chip active={s === segment}>
                {t(`filters.${s}`)} <span className="font-mono text-xs text-text-2">{counts[s]}</span>
              </Chip>
            </Link>
          ))}
        </nav>

        <div className="order-3 px-4 pb-6 lg:px-10">
          {rows.length === 0 ? (
            <EmptyState icon={q ? <MagnifyingGlassIcon size={28} /> : <UsersIcon size={28} />} title={q ? t("noResult", { q }) : t("empty")} />
          ) : (
            <div className="overflow-hidden rounded-lg border border-border bg-surface">
              <div className="hidden grid-cols-[minmax(0,1fr)_64px_100px_96px] gap-3 2xl:grid-cols-[minmax(0,1fr)_72px_110px_110px_100px] px-4 py-2.5 text-xs text-text-2 lg:grid" aria-hidden>
                <span>{t("colCustomer")}</span>
                <span className="text-right">{t("colOrders")}</span>
                <span className="text-right">{t("colTotal")}</span>
                <span className="hidden 2xl:block">{t("colLast")}</span>
              </div>
              <ul>
                {rows.map((r) => {
                  const active = r.customer.id === selectedId;
                  return (
                    <li
                      key={r.customer.id}
                      className={cx(
                        "relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 border-t border-border px-3.5 py-2.5 first:border-t-0 lg:grid-cols-[minmax(0,1fr)_64px_100px_96px] 2xl:grid-cols-[minmax(0,1fr)_72px_110px_110px_100px] lg:first:border-t",
                        active ? "bg-accent-soft" : "hover:bg-bg",
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar name={r.customer.name} />
                        <div className="min-w-0">
                          <Link
                            href={`/app/clients/${r.customer.id}?${query(segment)}`}
                            aria-current={active ? "true" : undefined}
                            className="block truncate text-[15px] font-medium after:absolute after:inset-0 lg:text-sm"
                          >
                            {r.customer.name}
                          </Link>
                          <p className="truncate font-mono text-xs text-text-2">
                            <span className="font-sans">{r.customer.city}</span>
                            <span className="lg:hidden"> · {t("orders", { count: r.orderCount })}</span>
                          </p>
                        </div>
                      </div>
                      <span className="hidden text-right font-mono text-sm lg:block">{r.orderCount}</span>
                      <div className="flex flex-col items-end gap-1 lg:block lg:text-right">
                        <Money cents={r.total} className="text-sm" />
                        <span className="lg:hidden">
                          {r.segment ? <Pill tone={segmentTone[r.segment]}>{seg(r.segment)}</Pill> : <span className="font-mono text-xs text-text-2">{formatWhen(r.last, now, locale, when, false)}</span>}
                        </span>
                      </div>
                      <span className="hidden font-mono text-xs text-text-2 2xl:block">{formatWhen(r.last, now, locale, when, false)}</span>
                      <span className="hidden lg:block">{r.segment && <Pill tone={segmentTone[r.segment]}>{seg(r.segment)}</Pill>}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>

      <aside className={cx("min-h-0 flex-col bg-surface lg:flex lg:overflow-hidden lg:border-l lg:border-border", selectedId ? "flex" : "hidden")}>
        {selectedId ? (
          <CustomerDetail id={selectedId} backHref={`/app/clients?${query(segment)}`} />
        ) : (
          <p className="p-6 text-sm text-text-2">{t("pickOne")}</p>
        )}
      </aside>
    </div>
  );
}

export async function CustomerDetail({ id, backHref }: { id: string; backHref: string }) {
  const [d, t, order, common, locale] = await Promise.all([
    getCustomer(id),
    getTranslations("customer"),
    getTranslations("order"),
    getTranslations("common"),
    getLocale(),
  ]);
  if (!d) return null;
  const c = d.customer;
  const big = (cents: number) => {
    const { amount, currency } = moneyParts(cents, "MAD", locale);
    return (
      <>
        {amount}
        <span className="ml-1 text-xs font-medium text-text-2">{currency}</span>
      </>
    );
  };
  const tel = `tel:${c.phone.replace(/[^\d+]/g, "")}`;
  const wa = `https://wa.me/${c.phone.replace(/\D/g, "")}`;

  return (
    <article className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-border px-4 py-4 lg:px-5">
        <Link href={backHref} aria-label={common("back")} className="-ml-2 flex size-11 flex-none items-center justify-center lg:hidden">
          <CaretLeftIcon aria-hidden size={22} />
        </Link>
        <Avatar name={c.name} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-display text-xl font-semibold tracking-[-0.02em]">{c.name}</h2>
          <p className="text-xs text-text-2">{t("since", { date: formatDay(d.first, locale, true) })}</p>
        </div>
        <Link href={backHref} aria-label={common("close")} className="hidden size-11 flex-none items-center justify-center text-text-2 lg:flex">
          <XIcon aria-hidden size={20} />
        </Link>
      </header>

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-4 lg:px-5">
        <dl className="grid grid-cols-3 border-y border-border">
          {[
            [t("orders"), d.orders.length],
            [t("total"), big(d.total)],
            [t("basket"), big(d.average)],
          ].map(([label, value], i) => (
            <div key={i} className={cx("px-2 py-2.5", i > 0 && "border-l border-border")}>
              <dt className="text-xs text-text-2">{label}</dt>
              <dd className="font-display text-xl font-semibold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>

        <section>
          <h3 className="mb-1.5 text-[13px] text-text-2">{t("contact")}</h3>
          <p className="font-mono text-[15px]">{c.phone}</p>
          <p className="text-[15px] leading-relaxed">
            {c.address}
            <br />
            {c.city}
          </p>
          <p className={cx("mt-2 text-sm", d.refused > 0 ? "font-medium text-err-fg" : "text-text-2")}>{t("refused", { count: d.refused })}</p>
        </section>

        <section>
          <h3 className="mb-1.5 text-[13px] text-text-2">{t("orders")}</h3>
          <ul className="overflow-hidden rounded-lg border border-border bg-surface">
            {d.orders.slice(0, 10).map((o) => (
              <li key={o.id} className="relative flex items-center gap-3 border-t border-border px-3 py-2.5 first:border-t-0 hover:bg-bg">
                <div className="flex-1">
                  <Link href={`/app/commandes/${o.id}`} className="font-mono text-sm after:absolute after:inset-0">
                    #{o.number}
                  </Link>
                  <p className="font-mono text-xs text-text-2">{formatWhen(o.createdAt, d.now, locale, { today: common("today"), yesterday: common("yesterday") }, false)}</p>
                </div>
                <StatusPill status={o.status} />
                <Money cents={o.total} currency={o.currency} className="w-20 text-right text-sm" />
              </li>
            ))}
          </ul>
        </section>

        <section>
          <label htmlFor={`note-${c.id}`} className="mb-1.5 block text-[13px] text-text-2">{t("note")}</label>
          <textarea
            id={`note-${c.id}`}
            defaultValue={c.note ?? ""}
            placeholder={order("notePlaceholder")}
            rows={2}
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-3 text-[15px] placeholder:text-text-2"
          />
        </section>
      </div>

      <ActionBar className="bg-surface lg:static">
        <a href={tel} className={cx(buttonStyles.secondary, "h-12 text-[15px]")}>
          <PhoneIcon aria-hidden size={18} />
          {t("call")}
        </a>
        <a href={wa} target="_blank" rel="noreferrer" className={cx(buttonStyles.primary, "h-12 flex-1 text-[15px]")}>
          <WhatsappLogoIcon aria-hidden size={18} />
          {t("whatsapp")}
        </a>
      </ActionBar>
    </article>
  );
}
