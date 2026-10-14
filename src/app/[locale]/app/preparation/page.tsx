import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { ArrowClockwiseIcon, PackageIcon, SignOutIcon } from "@phosphor-icons/react/ssr";
import { PrepCard } from "@/components/prep-card";
import { Swatch, buttonStyles, cx } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import { getPreparation, teamMember } from "@/lib/data";
import { formatMoney } from "@/lib/format";

// La vue de Youssef. Seulement les colis à préparer, rien d'autre.
export default async function PreparationPage() {
  const [d, t, common, locale, format] = await Promise.all([
    getPreparation(),
    getTranslations("prep"),
    getTranslations("common"),
    getLocale(),
    getFormatter(),
  ]);
  const date = format.dateTime(d.now, { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col">
      <header className="flex items-end justify-between gap-3 px-5 pt-5 pb-4">
        <div>
          <p className="text-[13px] text-text-2">
            {t("overline", { date: date.charAt(0).toUpperCase() + date.slice(1), count: d.orders.length })}
          </p>
          <h1 className="font-display text-[28px] font-semibold tracking-[-0.02em]">{t("hello", { name: teamMember("preparer").name })}</h1>
        </div>
        <Link href="/connexion" aria-label={common("logout")} className={cx(buttonStyles.secondary, "size-11 px-0")}>
          <SignOutIcon aria-hidden size={20} />
        </Link>
      </header>

      <main className="flex flex-1 flex-col px-4 pb-8">
        {d.orders.length === 0 ? (
          <div className="flex flex-1 flex-col justify-center gap-4 px-1">
            <PackageIcon aria-hidden size={28} className="text-text-2" />
            <h2 className="font-display text-[28px] leading-tight font-semibold tracking-[-0.02em] text-balance">{t("emptyTitle")}</h2>
            <p className="text-sm text-text-2">{t("emptyBody")}</p>
            <dl className="flex gap-8 border-t border-border pt-4">
              <div>
                <dt className="text-xs text-text-2">{t("preparedToday")}</dt>
                <dd className="font-display text-2xl font-semibold">{d.preparedToday}</dd>
              </div>
              <div>
                <dt className="text-xs text-text-2">{t("itemsPacked")}</dt>
                <dd className="font-display text-2xl font-semibold">{d.itemsPacked}</dd>
              </div>
            </dl>
            <Link href="/app/preparation" className={cx(buttonStyles.secondary, "h-11 self-start text-sm")}>
              <ArrowClockwiseIcon aria-hidden size={16} />
              {t("refresh")}
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {d.orders.map(({ order, customer, lines, total }, i) => (
              <PrepCard
                key={order.id}
                primary={i === 0}
                prepared={order.status === "prepared"}
                title={
                  <>
                    <span className="font-mono font-semibold">#{order.number}</span> <span className="font-semibold">{customer.city}</span>
                  </>
                }
                subtitle={`${customer.name} · ${
                  order.payment === "cod"
                    ? t("toCollect", { amount: formatMoney(total, order.currency, locale) })
                    : order.payment === "card"
                      ? t("paidByCard")
                      : t("paidByTransfer")
                }`}
                items={lines.map((l) => ({
                  id: l.variantId,
                  name: l.product.name[locale],
                  label: l.variant.label,
                  qty: l.qty,
                  swatch: <Swatch color={l.product.swatch} label={l.product.name[locale]} className="size-10" />,
                }))}
              />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
