import { getLocale, getTranslations } from "next-intl/server";
import { BarChart } from "@/components/bar-chart";
import {
  ActionBar,
  BigMoney,
  Card,
  Delta,
  Money,
  PageHeader,
  Pill,
  SectionTitle,
  Stat,
  StatBand,
  Swatch,
  buttonStyles,
  cx,
} from "@/components/ui";
import { Link } from "@/i18n/navigation";
import type { Locale } from "next-intl";
import { type TodoItem, getToday } from "@/lib/data";
import { getCurrentUser } from "@/lib/session";
import { dayKey, formatMoney, TIME_ZONE } from "@/lib/format";

/** "Khadija Benali" devient "Khadija B.". */
const shortName = (name: string) => {
  const parts = name.split(" ");
  return parts.length > 1 ? `${parts.slice(0, -1).join(" ")} ${parts.at(-1)![0]}.` : name;
};

export default async function TodayPage() {
  const [d, me, t, common, locale] = await Promise.all([
    getToday(),
    getCurrentUser(),
    getTranslations("today"),
    getTranslations("common"),
    getLocale(),
  ]);
  const date = d.now.toLocaleDateString(locale, { timeZone: TIME_ZONE, weekday: "long", day: "numeric", month: "long" });
  const yesterday = new Date(d.now.getTime() - 86_400_000);
  const oldest = !d.oldestToConfirm
    ? t("nothingToConfirm")
    : dayKey(d.oldestToConfirm) === dayKey(d.now)
      ? t("oldestToday")
      : dayKey(d.oldestToConfirm) === dayKey(yesterday)
        ? t("oldestYesterday")
        : t("oldest", { when: d.oldestToConfirm.toLocaleDateString(locale, { timeZone: TIME_ZONE, day: "numeric", month: "long" }) });
  const salesTotal = d.daily.reduce((s, x) => s + x.total, 0);

  const handle = d.toConfirm > 0 && (
    <Link href="/app/commandes" className={cx(buttonStyles.primary, "min-h-[52px] w-full text-base lg:min-h-11 lg:w-auto lg:text-[15px]")}>
      {t("handle", { count: d.toConfirm })}
    </Link>
  );

  return (
    <>
      <PageHeader
        overline={date.charAt(0).toUpperCase() + date.slice(1)}
        title={t("hello", { name: me.name })}
        action={
          <>
            <div className="hidden lg:block">{handle}</div>
            <Link
              href="/app/parametres"
              aria-label={common("account")}
              className="flex size-11 flex-none items-center justify-center rounded-lg border border-border bg-surface font-semibold lg:hidden"
            >
              {me.name[0]}
            </Link>
          </>
        }
      />

      <div className="flex flex-col gap-[22px] pb-6 lg:gap-7 lg:px-10 lg:pb-8">
        <StatBand>
          <Stat
            label={t("salesToday")}
            value={<BigMoney cents={d.salesToday} />}
            sub={<Delta value={d.salesChange} suffix={t("vsYesterday")} />}
          />
          <Stat label={t("toConfirm")} value={d.toConfirm} sub={oldest} />
          <Stat label={t("toPrepare")} value={d.toPrepare} sub={t("urgent", { count: d.urgent })} />
          <Stat
            label={t("basket")}
            value={<BigMoney cents={d.basket} />}
            sub={<Delta value={d.basketChange} suffix={t("vsLastWeek")} />}
          />
        </StatBand>

        <div className="grid grid-cols-1 gap-[22px] lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] lg:gap-7">
          <section className="px-5 lg:order-2 lg:px-0">
            <SectionTitle aside={d.todo.length}>{t("todo")}</SectionTitle>
            {d.todo.length ? (
              <Card>
                {d.todo.map((item, i) => (
                  <TodoRow key={i} item={item} locale={locale} />
                ))}
              </Card>
            ) : (
              <p className="text-sm text-text-2">{t("allDone")}</p>
            )}
          </section>

          <div className="flex flex-col gap-[22px] lg:order-1 lg:gap-7">
            <section className="px-5 lg:px-0">
              <SectionTitle aside={formatMoney(salesTotal, "MAD", locale)}>{t("sales30")}</SectionTitle>
              <div className="lg:rounded-lg lg:border lg:border-border lg:bg-surface lg:p-4">
                <BarChart
                  series={d.daily}
                  label={t("salesChart", { total: formatMoney(salesTotal, "MAD", locale) })}
                  lastLabel={common("today")}
                  className="h-[84px] lg:h-[140px]"
                />
              </div>
            </section>

            <section className="px-5 lg:px-0">
              <SectionTitle>{t("top5")}</SectionTitle>
              <Card>
                {d.top.map((p, i) => (
                  <Link
                    key={p.product.id}
                    href={`/app/produits/${p.product.id}`}
                    className="flex items-center gap-3 border-border px-3.5 py-2.5 not-first:border-t hover:bg-bg"
                  >
                    <span className="w-3.5 font-mono text-[13px] text-text-2">{i + 1}</span>
                    <Swatch color={p.product.swatch} photo={p.product.photos[0]} label={p.product.name[locale]} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{p.product.name[locale]}</div>
                      <div className="font-mono text-xs text-text-2">
                        {[p.label, `×${p.qty}`].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                    <Money cents={p.revenue} className="text-sm" />
                  </Link>
                ))}
              </Card>
            </section>
          </div>
        </div>
      </div>

      {handle && <ActionBar className="lg:hidden">{handle}</ActionBar>}
    </>
  );
}

async function TodoRow({ item, locale }: { item: TodoItem; locale: Locale }) {
  const t = await getTranslations("today");
  const level = await getTranslations("level");
  const status = await getTranslations("status");
  const row = "flex min-h-16 items-center gap-3 border-border px-3.5 py-3 not-first:border-t hover:bg-bg";
  const body = (title: string, sub: string, pill: React.ReactNode) => (
    <>
      <div className="min-w-0 flex-1">
        <div className="text-[15px] leading-[1.3] font-medium">{title}</div>
        <div className="mt-0.5 text-[13px] text-text-2">{sub}</div>
      </div>
      {pill}
    </>
  );

  switch (item.kind) {
    case "call": {
      const [a, b] = item.names.map(shortName);
      const names = item.count === 1 ? a : item.count === 2 ? `${a}, ${b}` : t("names", { first: a, second: b, rest: item.count - 2 });
      return (
        <Link href="/app/commandes" className={row}>
          {body(t("todoCall", { count: item.count }), names, <Pill tone="warn">{status("received")}</Pill>)}
        </Link>
      );
    }
    case "low":
    case "out":
      return (
        <Link href={`/app/produits/${item.product.id}`} className={row}>
          {body(
            [item.product.name[locale], item.label].filter(Boolean).join(" "),
            item.kind === "out" ? t("outOfStock") : t("lowLeft", { count: item.stock, threshold: item.threshold }),
            <Pill tone={item.kind === "out" ? "err" : "warn"}>{level(item.kind)}</Pill>,
          )}
        </Link>
      );
    case "refused":
      return (
        <Link href={`/app/commandes/${item.orderId}`} className={row}>
          {body(t("refusedTitle", { number: item.number, city: item.city }), t("refusedBody"), <Pill tone="err">{status("refused")}</Pill>)}
        </Link>
      );
  }
}
