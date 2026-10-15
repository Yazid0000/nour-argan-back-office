import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { ArrowClockwiseIcon, PackageIcon, SignOutIcon, TruckIcon } from "@phosphor-icons/react/ssr";
import { LogoutButton } from "@/components/logout-button";
import { AnimatedList, ListItem } from "@/components/motion";
import { OrderActionForm } from "@/components/order-action-form";
import { paymentIcons } from "@/components/orders";
import { PrepCard } from "@/components/prep-card";
import { EmptyState, Swatch, buttonStyles, cx } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import { getPreparation, getShipped } from "@/lib/data";
import { formatMoney, formatWhen } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";

// La vue de Youssef. Les colis à préparer, et ceux déjà partis chez le livreur.
export default async function PreparationPage({ searchParams }: PageProps<"/[locale]/app/preparation">) {
  const shipped = (await searchParams).vue === "expediees";
  const [me, t, common, action, locale, format] = await Promise.all([
    getCurrentUser(),
    getTranslations("prep"),
    getTranslations("common"),
    getTranslations("action"),
    getLocale(),
    getFormatter(),
  ]);
  const toPack = shipped ? null : await getPreparation();
  const sent = shipped ? await getShipped() : null;
  const now = (toPack ?? sent)!.now;
  const date = format.dateTime(now, { weekday: "long", day: "numeric", month: "long" });
  const paymentLine = (payment: "cod" | "card" | "transfer", total: number, currency: "MAD" | "EUR") =>
    payment === "cod"
      ? t("toCollect", { amount: formatMoney(total, currency, locale) })
      : payment === "card"
        ? t("paidByCard")
        : t("paidByTransfer");

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col">
      <header className="flex items-end justify-between gap-3 px-5 pt-5 pb-4">
        <div>
          <p className="text-[13px] text-text-2">
            {toPack ? t("overline", { date: date.charAt(0).toUpperCase() + date.slice(1), count: toPack.orders.length }) : date.charAt(0).toUpperCase() + date.slice(1)}
          </p>
          <h1 className="font-display text-[28px] font-semibold tracking-[-0.02em]">{t("hello", { name: me.name })}</h1>
        </div>
        <LogoutButton label={common("logout")} className={cx(buttonStyles.secondary, "size-11 px-0")}>
          <SignOutIcon aria-hidden size={20} />
        </LogoutButton>
      </header>

      <nav aria-label={t("views")} className="mx-4 mb-3 grid grid-cols-2 gap-1 rounded-lg border border-border bg-surface p-1">
        {([["toPack", "/app/preparation"], ["shipped", "/app/preparation?vue=expediees"]] as const).map(([key, href]) => {
          const active = (key === "shipped") === shipped;
          return (
            <Link
              key={key}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cx("flex min-h-11 items-center justify-center rounded-md text-sm", active ? "bg-accent-soft font-semibold text-accent" : "font-medium text-text-2")}
            >
              {t(key === "toPack" ? "tabToPack" : "tabShipped")}
            </Link>
          );
        })}
      </nav>

      <main className="flex flex-1 flex-col px-4 pb-8">
        {sent ? (
          sent.orders.length === 0 ? (
            <EmptyState icon={<TruckIcon size={28} />} title={t("emptyShipped")} />
          ) : (
            <AnimatedList key="shipped" className="flex flex-col gap-2.5">
              {sent.orders.map((o) => {
                const Icon = paymentIcons[o.payment];
                return (
                  <ListItem key={o.id} className="rounded-lg border border-border bg-surface px-3.5 py-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <h2 className="text-[15px]">
                        <span className="font-mono font-semibold">#{o.number}</span> <span className="font-semibold">{o.city}</span>
                      </h2>
                      <span className="font-mono text-xs text-text-2">{t("items", { count: o.items })}</span>
                    </div>
                    <p className="mt-0.5 text-[13px] text-text-2">{o.name}</p>
                    <div className="mt-1.5 flex items-center justify-between gap-3 text-xs text-text-2">
                      <span className="inline-flex items-center gap-1.5">
                        <Icon aria-hidden size={14} />
                        {paymentLine(o.payment, o.total, o.currency)}
                      </span>
                      {o.shippedAt && (
                        <span className="font-mono">
                          {t("shippedWhen", { when: formatWhen(o.shippedAt, now, locale, { today: common("today"), yesterday: common("yesterday") }) })}
                        </span>
                      )}
                    </div>
                    <OrderActionForm
                      orderId={o.id}
                      className="mt-2.5"
                      buttons={[{ action: "markDelivered", label: action("markDelivered"), look: "outline", className: "h-11 w-full text-sm" }]}
                    />
                  </ListItem>
                );
              })}
            </AnimatedList>
          )
        ) : toPack!.orders.length === 0 ? (
          <div className="flex flex-1 flex-col justify-center gap-4 px-1">
            <PackageIcon aria-hidden size={28} className="text-text-2" />
            <h2 className="font-display text-[28px] leading-tight font-semibold tracking-[-0.02em] text-balance">{t("emptyTitle")}</h2>
            <p className="text-sm text-text-2">{t("emptyBody")}</p>
            <dl className="flex gap-8 border-t border-border pt-4">
              <div>
                <dt className="text-xs text-text-2">{t("preparedToday")}</dt>
                <dd className="font-display text-2xl font-semibold">{toPack!.preparedToday}</dd>
              </div>
              <div>
                <dt className="text-xs text-text-2">{t("itemsPacked")}</dt>
                <dd className="font-display text-2xl font-semibold">{toPack!.itemsPacked}</dd>
              </div>
            </dl>
            <Link href="/app/preparation" className={cx(buttonStyles.secondary, "h-11 self-start text-sm")}>
              <ArrowClockwiseIcon aria-hidden size={16} />
              {t("refresh")}
            </Link>
          </div>
        ) : (
          <AnimatedList key="toPack" className="flex flex-col gap-3">
            {toPack!.orders.map(({ order, customer, lines, total }, i) => (
              <PrepCard
                key={order.id}
                orderId={order.id}
                primary={i === 0}
                prepared={order.status === "prepared"}
                title={
                  <>
                    <span className="font-mono font-semibold">#{order.number}</span> <span className="font-semibold">{customer.city}</span>
                  </>
                }
                subtitle={`${customer.name} · ${paymentLine(order.payment, total, order.currency)}`}
                items={lines.map((l) => ({
                  id: l.variantId,
                  name: l.product.name[locale],
                  label: l.variant.label,
                  qty: l.qty,
                  swatch: <Swatch color={l.product.swatch} photo={l.product.photo} label={l.product.name[locale]} className="size-10" />,
                }))}
              />
            ))}
          </AnimatedList>
        )}
      </main>
    </div>
  );
}
