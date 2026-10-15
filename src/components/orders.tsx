import type { ReactNode } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import {
  BankIcon,
  CaretLeftIcon,
  CheckIcon,
  CreditCardIcon,
  MagnifyingGlassIcon,
  MoneyIcon,
  PhoneIcon,
  ReceiptIcon,
  WhatsappLogoIcon,
} from "@phosphor-icons/react/ssr";
import { Link } from "@/i18n/navigation";
import { ORDERS_LIMIT, getOrder, listOrders, oldestFirst } from "@/lib/data";
import { type OrderTab, type Payment, isIrreversible, orderTabs, payments, railSteps, subtotal, transitions } from "@/lib/domain";
import { dayKey, formatMoney, formatTime, formatWhen } from "@/lib/format";
import { AutoSubmitSelect } from "./auto-submit-select";
import { OrderActionForm } from "./order-action-form";
import { ActionBar, EmptyState, Money, StatusPill, Swatch, buttonStyles, cx, inputStyles } from "./ui";

export const paymentIcons: Record<Payment, typeof MoneyIcon> = { cod: MoneyIcon, card: CreditCardIcon, transfer: BankIcon };
const tabKeys = Object.keys(orderTabs) as OrderTab[];

const phoneHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;
const whatsappHref = (phone: string) => `https://wa.me/${phone.replace(/\D/g, "")}`;

/**
 * Liste des commandes + détail. Sur mobile, l'un OU l'autre selon l'adresse.
 * Sur desktop, les deux côte à côte (sans sélection, on montre la première commande).
 */
export async function OrdersScreen({
  tab,
  q = "",
  payment,
  selectedId,
}: {
  tab: OrderTab;
  q?: string;
  payment?: Payment;
  selectedId?: string;
}) {
  const [{ now, counts, rows }, t, pay, action, common, locale] = await Promise.all([
    listOrders({ tab, q, payment }),
    getTranslations("orders"),
    getTranslations("payment"),
    getTranslations("action"),
    getTranslations("common"),
    getLocale(),
  ]);
  const params = (next: Partial<Record<"tab" | "q" | "payment", string>>) => {
    const p = new URLSearchParams({ tab, ...(q && { q }), ...(payment && { payment }), ...next });
    return `?${p}`;
  };
  const shown = selectedId ?? rows[0]?.id;
  const when = { today: common("today"), yesterday: common("yesterday") };

  const search = (
    <form role="search" className="flex flex-1 gap-2 lg:max-w-md">
      <input type="hidden" name="tab" value={tab} />
      <label className="relative flex-1">
        <span className="sr-only">{t("search")}</span>
        <MagnifyingGlassIcon aria-hidden size={18} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-text-2" />
        <input name="q" type="search" defaultValue={q} placeholder={t("search")} className={cx(inputStyles, "pl-10")} />
      </label>
      <label className="sr-only" htmlFor="payment">{t("paymentFilter")}</label>
      <AutoSubmitSelect id="payment" name="payment" defaultValue={payment ?? ""} className={cx(inputStyles, "w-auto max-w-36 pr-2 text-sm")}>
        <option value="">{t("allPayments")}</option>
        {payments.map((p) => (
          <option key={p} value={p}>{pay(p)}</option>
        ))}
      </AutoSubmitSelect>
    </form>
  );


  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between lg:gap-6 lg:px-10 lg:pt-7 lg:pb-5">
        <h1 className={cx("px-5 pt-5 pb-3.5 font-display text-[28px] font-semibold tracking-[-0.02em] lg:p-0 lg:text-[32px]", selectedId && "max-lg:sr-only")}>
          {t("title")}
        </h1>
        <div className={cx("flex px-5 pb-3 lg:w-[420px] lg:p-0", selectedId && "max-lg:hidden")}>{search}</div>
      </div>

      <div className="grid min-h-0 flex-1 auto-rows-[minmax(0,1fr)] grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px] lg:overflow-hidden">
        <div className={cx("flex min-w-0 flex-col lg:overflow-y-auto lg:pr-6 lg:pb-8 lg:pl-10", selectedId && "max-lg:hidden")}>
          <nav aria-label={t("title")} className="flex flex-none gap-1 overflow-x-auto overflow-y-hidden border-b border-border px-3 [scrollbar-width:none] lg:px-0">
            {tabKeys.map((k) => (
              <Link
                key={k}
                href={`/app/commandes${params({ tab: k })}`}
                aria-current={k === tab ? "page" : undefined}
                className={cx(
                  "-mb-px flex min-h-11 flex-none items-center gap-1.5 border-b-2 px-2 text-sm whitespace-nowrap",
                  k === tab ? "border-accent font-semibold text-accent" : "border-transparent font-medium text-text-2",
                )}
              >
                {t(`tabs.${k}`)}
                {counts[k] > 0 && k !== "delivered" && <span className="font-mono text-xs">{counts[k]}</span>}
              </Link>
            ))}
          </nav>

          {rows.length === 0 ? (
            q ? (
              <EmptyState icon={<MagnifyingGlassIcon size={28} />} title={t("noResult", { q })}>
                {t("noResultHint")}
              </EmptyState>
            ) : (
              <EmptyState icon={<ReceiptIcon size={28} />} title={t(`empty.${tab}`)} />
            )
          ) : (
            <>
              <p className="px-5 pt-3 pb-2 text-xs text-text-2 lg:hidden">{oldestFirst(tab) ? t("oldestFirst") : t("newestFirst")}</p>

              <ul className="flex flex-col gap-2.5 px-4 pb-6 lg:hidden">
                {rows.map((o) => {
                  const next = transitions[o.status].next;
                  const Icon = paymentIcons[o.payment];
                  return (
                    <li key={o.id} className="relative rounded-lg border border-border bg-surface px-3.5 py-3">
                      <div className="flex justify-between font-mono text-xs text-text-2">
                        <span>#{o.number}</span>
                        <span>{formatWhen(o.createdAt, now, locale, when)}</span>
                      </div>
                      <div className="mt-1.5 flex items-baseline justify-between gap-3">
                        <Link href={`/app/commandes/${o.id}`} className="truncate text-[15px] font-semibold after:absolute after:inset-0">
                          {o.name}
                        </Link>
                        <Money cents={o.total} currency={o.currency} className="text-[15px] font-semibold" />
                      </div>
                      <div className="mt-1 flex items-end justify-between gap-3">
                        <div className="text-[13px] text-text-2">
                          <div>{o.city}</div>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <Icon aria-hidden size={14} />
                            {pay(o.payment)}
                          </div>
                        </div>
                        {next && (
                          <OrderActionForm
                            orderId={o.id}
                            className="relative z-10 justify-end"
                            buttons={[{ action: next, label: action(next), look: "outline", className: "h-11 text-sm" }]}
                          />
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-4 hidden overflow-hidden rounded-lg border border-border bg-surface lg:block">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-text-2">
                    <tr className="[&>th]:px-3 [&>th]:py-2.5 [&>th]:font-medium">
                      <th>{t("colNumber")}</th>
                      <th>{t("colCustomer")}</th>
                      <th className="hidden 2xl:table-cell">{t("colCity")}</th>
                      <th className="hidden xl:table-cell">{t("colPayment")}</th>
                      <th className="text-right">{t("colAmount")}</th>
                      <th className="hidden text-right xl:table-cell">{t("colReceived")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((o) => {
                      const Icon = paymentIcons[o.payment];
                      const active = o.id === shown;
                      return (
                        <tr key={o.id} className={cx("relative border-t border-border [&>td]:px-3 [&>td]:py-3.5", active ? "bg-accent-soft" : "hover:bg-bg")}>
                          <td className={cx("font-mono", active ? "font-semibold text-accent" : "text-text-2")}>
                            <Link href={`/app/commandes/${o.id}${params({})}`} aria-current={active ? "true" : undefined} className="after:absolute after:inset-0">
                              #{o.number}
                            </Link>
                          </td>
                          <td className="w-full max-w-0 truncate font-medium">{o.name}</td>
                          <td className="hidden whitespace-nowrap 2xl:table-cell">{o.city}</td>
                          <td className="hidden text-xs text-text-2 xl:table-cell">
                            <span className="inline-flex items-center gap-1.5 whitespace-nowrap"><Icon aria-hidden size={14} />{pay(o.payment)}</span>
                          </td>
                          <td className="text-right whitespace-nowrap"><Money cents={o.total} currency={o.currency} /></td>
                          <td className="hidden text-right font-mono text-xs whitespace-nowrap text-text-2 xl:table-cell">{formatWhen(o.createdAt, now, locale, when)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {rows.length === ORDERS_LIMIT && <p className="px-5 pb-6 text-xs text-text-2 lg:px-0 lg:pt-3">{t("limited")}</p>}
            </>
          )}
        </div>

        <aside className={cx("min-h-0 flex-col bg-surface lg:flex lg:overflow-hidden lg:border-t lg:border-l lg:border-border", selectedId ? "flex flex-1" : "hidden")}>
          {shown ? <OrderDetail id={shown} backHref={`/app/commandes${params({})}`} /> : <p className="p-6 text-sm text-text-2">{t("pickOne")}</p>}
        </aside>
      </div>
    </div>
  );
}

function Section({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={className}>
      <h2 className="mb-1.5 text-[13px] text-text-2">{title}</h2>
      {children}
    </section>
  );
}

export async function OrderDetail({ id, backHref }: { id: string; backHref: string }) {
  const [data, t, rail, history, actor, payLong, actionLong, action, common, locale] = await Promise.all([
    getOrder(id),
    getTranslations("order"),
    getTranslations("rail"),
    getTranslations("history"),
    getTranslations("actor"),
    getTranslations("paymentLong"),
    getTranslations("actionLong"),
    getTranslations("action"),
    getTranslations("common"),
    getLocale(),
  ]);
  if (!data) return null;
  const { order, customer, lines, total, now } = data;
  const { next, others } = transitions[order.status];
  const reached = Math.max(...order.history.map((h) => railSteps.indexOf(h.kind as (typeof railSteps)[number])));
  const ended = order.status === "cancelled";
  const when = (d: Date) =>
    dayKey(d) === dayKey(now) ? formatTime(d, locale) : formatWhen(d, now, locale, { today: common("today"), yesterday: common("yesterday") });
  const receivedWhen =
    dayKey(order.createdAt) === dayKey(now)
      ? `${common("today")} ${formatTime(order.createdAt, locale)}`
      : formatWhen(order.createdAt, now, locale, { today: common("today"), yesterday: common("yesterday") });

  const callButtons = (
    <>
      <a href={phoneHref(customer.phone)} aria-label={`${t("call")} ${customer.name}`} className={cx(buttonStyles.secondary, "size-[52px] flex-none px-0")}>
        <PhoneIcon aria-hidden size={22} />
      </a>
      <a href={whatsappHref(customer.phone)} target="_blank" rel="noreferrer" aria-label={`${t("whatsapp")} ${customer.name}`} className={cx(buttonStyles.secondary, "size-[52px] flex-none px-0")}>
        <WhatsappLogoIcon aria-hidden size={22} />
      </a>
    </>
  );

  return (
    <article className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-start gap-2 border-b border-border px-4 pt-4 pb-3.5 lg:px-6 lg:pt-5">
        <Link href={backHref} aria-label={common("back")} className="-ml-2 flex size-11 flex-none items-center justify-center lg:hidden">
          <CaretLeftIcon aria-hidden size={22} />
        </Link>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-[22px] leading-tight font-semibold tracking-[-0.02em]">{t("title", { number: order.number })}</h2>
          <p className="text-xs text-text-2">{t("receivedAt", { when: receivedWhen })}</p>
        </div>
        <StatusPill status={order.status} />
      </header>

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-4 lg:px-6">
        {!ended && (
          <ol aria-label={rail("label")} className="flex">
            {railSteps.map((step, i) => {
              const done = i < reached;
              const current = i === reached;
              return (
                <li key={step} aria-current={current ? "step" : undefined} className="relative flex flex-1 flex-col items-center gap-1.5">
                  {i > 0 && <span aria-hidden className={cx("absolute top-[10px] right-1/2 h-0.5 w-full", i <= reached ? "bg-accent" : "bg-border")} />}
                  <span
                    aria-hidden
                    className={cx(
                      "relative flex size-[22px] items-center justify-center rounded-full border-2",
                      done ? "border-accent bg-accent text-accent-fg" : current ? "border-accent bg-surface" : "border-border bg-surface",
                    )}
                  >
                    {done && <CheckIcon size={12} weight="bold" />}
                    {current && <span className="size-2 rounded-full bg-accent" />}
                  </span>
                  <span className={cx("text-[11px]", current ? "font-semibold" : "text-text-2")}>{rail(step)}</span>
                </li>
              );
            })}
          </ol>
        )}

        <Section title={t("customer")}>
          <p className="text-base font-semibold">{customer.name}</p>
          <p className="font-mono text-[15px]">{customer.phone}</p>
          <div className="mt-2.5 hidden grid-cols-2 gap-2 lg:grid">
            <a href={phoneHref(customer.phone)} className={cx(buttonStyles.secondary, "h-11 text-sm")}>
              <PhoneIcon aria-hidden size={18} />{t("call")}
            </a>
            <a href={whatsappHref(customer.phone)} target="_blank" rel="noreferrer" className={cx(buttonStyles.secondary, "h-11 text-sm")}>
              <WhatsappLogoIcon aria-hidden size={18} />{t("whatsapp")}
            </a>
          </div>
        </Section>

        <Section title={t("address")}>
          <p className="text-[15px] leading-relaxed">
            {customer.address}
            <br />
            {customer.city} <span className="font-mono">{customer.postalCode}</span>
          </p>
        </Section>

        <Section title={t("items")}>
          <div className="overflow-hidden rounded-lg border border-border bg-surface">
            {lines.map((l) => (
              <div key={l.variantId} className="flex items-center gap-3 border-b border-border px-3 py-2.5">
                <Swatch color={l.product.swatch} label={l.product.name[locale]} className="size-10" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{l.product.name[locale]}</div>
                  <div className="font-mono text-xs text-text-2">
                    {[l.variant.label, t("qtyPrice", { qty: l.qty, price: formatMoney(l.unitPrice, order.currency, locale) })].filter(Boolean).join(" · ")}
                  </div>
                </div>
                <Money cents={l.qty * l.unitPrice} currency={order.currency} className="text-sm" />
              </div>
            ))}
            <dl className="flex flex-col gap-1 px-3 py-2.5 text-[13px] text-text-2 [&>div]:flex [&>div]:justify-between">
              <div><dt>{t("subtotal")}</dt><dd><Money cents={subtotal(order)} currency={order.currency} /></dd></div>
              <div>
                <dt>{t("shipping")}</dt>
                <dd>{order.shippingFee ? <Money cents={order.shippingFee} currency={order.currency} /> : t("free")}</dd>
              </div>
              <div className="mt-1 items-baseline text-text">
                <dt className="text-sm font-semibold">{t("total")}</dt>
                <dd className="font-display text-[22px] font-semibold tabular-nums">{formatMoney(total, order.currency, locale)}</dd>
              </div>
            </dl>
          </div>
        </Section>

        <div className="flex justify-between text-sm">
          <span>{payLong(order.payment)}</span>
          <span className="text-text-2">{order.payment === "cod" ? t("toCollect") : t("paid")}</span>
        </div>

        <Section title={t("history")}>
          <ol className="flex flex-col gap-1.5 text-sm">
            {[...order.history].sort((a, b) => b.at.getTime() - a.at.getTime()).map((h, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="w-[5.5rem] flex-none font-mono text-[13px] text-text-2">{when(h.at)}</span>
                <span>
                  {history(h.kind)}
                  {(h.userName || (h.actor && h.actor !== "site")) && (
                    <span className="text-text-2"> · {h.userName ?? actor(h.actor!)}</span>
                  )}
                </span>
              </li>
            ))}
          </ol>
        </Section>

        <Section title={t("note")}>
          <label className="sr-only" htmlFor={`note-${order.id}`}>{t("note")}</label>
          <textarea
            id={`note-${order.id}`}
            defaultValue={order.note ?? ""}
            placeholder={t("notePlaceholder")}
            rows={2}
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-3 text-[15px] placeholder:text-text-2"
          />
        </Section>

        {others.length > 0 && (
          <OrderActionForm
            orderId={order.id}
            className="gap-x-4"
            buttons={others.map((a) => ({ action: a, label: action(a), look: isIrreversible(a) ? "danger" : "link" }))}
          />
        )}
      </div>

      <ActionBar className="bg-surface lg:static lg:px-6">
        <div className="contents lg:hidden">{callButtons}</div>
        {next && (
          <OrderActionForm
            orderId={order.id}
            className="flex-1"
            buttons={[
              {
                action: next,
                look: "primary",
                className: "h-[52px] w-full text-base lg:h-12",
                label: (
                  <>
                    <CheckIcon aria-hidden size={18} weight="bold" />
                    {actionLong(next)}
                  </>
                ),
              },
            ]}
          />
        )}
      </ActionBar>
    </article>
  );
}

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Lit l'adresse sans lui faire confiance. Un onglet inconnu redevient « À confirmer ». */
export function parseOrderParams(sp: Record<string, string | string[] | undefined>) {
  const tab = first(sp.tab);
  const payment = first(sp.payment);
  return {
    tab: tabKeys.includes(tab as OrderTab) ? (tab as OrderTab) : undefined,
    q: first(sp.q)?.slice(0, 80) ?? "",
    payment: payments.includes(payment as Payment) ? (payment as Payment) : undefined,
  };
}
