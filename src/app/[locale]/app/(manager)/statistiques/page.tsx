import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { BarChart } from "@/components/bar-chart";
import { BigMoney, Card, Delta, PageHeader, SectionTitle, Stat, StatBand, cx } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import { type Period, getStats, periods } from "@/lib/data";
import type { Category, Cents } from "@/lib/domain";
import { formatMoney } from "@/lib/format";

const periodKeys = Object.keys(periods) as Period[];

function BarList({ rows, locale }: { rows: { label: string; total: Cents }[]; locale: string }) {
  const sum = rows.reduce((s, r) => s + r.total, 0) || 1;
  const max = Math.max(1, ...rows.map((r) => r.total));
  const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 });
  return (
    <Card>
      <ul>
        {rows.map((r) => (
          <li key={r.label} className="flex flex-col gap-1.5 border-t border-border px-3.5 py-2.5 first:border-t-0">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span>{r.label}</span>
              <span className="font-mono">
                {formatMoney(r.total, "MAD", locale)}{" "}
                <span className="inline-block w-10 text-right text-xs text-text-2">{percent.format(r.total / sum)}</span>
              </span>
            </div>
            <div aria-hidden className="h-[3px] rounded-full bg-track">
              <div className="h-full rounded-full bg-accent" style={{ width: `${(r.total / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default async function StatsPage({ searchParams }: PageProps<"/[locale]/app/statistiques">) {
  const sp = await searchParams;
  const period = periodKeys.find((p) => p === sp.periode) ?? "30";
  const [s, t, category, common, locale, format] = await Promise.all([
    getStats(period),
    getTranslations("stats"),
    getTranslations("category"),
    getTranslations("common"),
    getLocale(),
    getFormatter(),
  ]);
  const long = period === "365" || period === "90";
  const range = t("range", {
    from: format.dateTime(s.from, { day: "numeric", month: long ? "short" : "long", ...(period === "365" && { year: "numeric" }) }),
    to: format.dateTime(s.now, { day: "numeric", month: long ? "short" : "long", ...(period === "365" && { year: "numeric" }) }),
  });
  const chartTitle = period === "365" ? t("salesByMonth") : period === "90" ? t("salesByWeek") : t("salesByDay");
  const percent = (n: number, digits = 0) => format.number(n, { style: "percent", maximumFractionDigits: digits, minimumFractionDigits: digits });

  const selector = (
    <nav aria-label={t("period")} className="grid grid-cols-4 gap-1 rounded-lg border border-border bg-surface p-1 lg:w-80">
      {periodKeys.map((p) => (
        <Link
          key={p}
          href={`/app/statistiques?periode=${p}`}
          aria-current={p === period ? "page" : undefined}
          className={cx("flex min-h-11 items-center justify-center rounded-md text-sm", p === period ? "bg-accent-soft font-semibold text-accent" : "font-medium text-text-2")}
        >
          {t(`periods.${p}`)}
        </Link>
      ))}
    </nav>
  );

  return (
    <>
      <PageHeader overline={range} title={t("title")} action={<div className="hidden lg:block">{selector}</div>} />
      <div className="px-5 pb-4 lg:hidden">{selector}</div>

      <div className="flex flex-col gap-[22px] pb-8 lg:gap-7 lg:px-10">
        <StatBand>
          <Stat label={t("revenue")} value={<BigMoney cents={s.revenue} />} sub={<Delta value={s.revenueChange} />} />
          <Stat label={t("orders")} value={s.orders} sub={<Delta value={s.ordersChange} />} />
          <Stat label={t("basket")} value={<BigMoney cents={s.basket} />} sub={<Delta value={s.basketChange} />} />
          <Stat label={t("returnRate")} value={percent(s.returnRate, 1)} sub={t("returns", { count: s.returns, total: s.placed })} />
        </StatBand>

        <div className="grid grid-cols-1 gap-[22px] lg:grid-cols-[minmax(0,1fr)_minmax(320px,400px)] lg:gap-7">
          <div className="flex flex-col gap-[22px] lg:gap-7">
            <section className="px-5 lg:px-0">
              <SectionTitle aside={formatMoney(s.revenue, "MAD", locale)}>{chartTitle}</SectionTitle>
              <div className="rounded-lg border border-border bg-surface p-4">
                <BarChart
                  series={s.series}
                  label={t("chartLabel", { total: formatMoney(s.revenue, "MAD", locale) })}
                  lastLabel={common("today")}
                  className="h-[110px] lg:h-[140px]"
                />
              </div>
            </section>
            <section className="px-5 lg:px-0">
              <SectionTitle>{t("customers")}</SectionTitle>
              <Card className="grid grid-cols-3">
                {[
                  [t("active"), s.activeCustomers],
                  [t("newOnes"), s.newCustomers],
                  [t("repeat"), percent(s.repeatRate)],
                ].map(([label, value], i) => (
                  <div key={i} className={cx("px-3.5 py-3", i > 0 && "border-l border-border")}>
                    <div className="text-xs text-text-2">{label}</div>
                    <div className="font-display text-xl font-semibold tabular-nums">{value}</div>
                  </div>
                ))}
              </Card>
            </section>
          </div>

          <div className="flex flex-col gap-[22px] lg:gap-7">
            <section className="px-5 lg:px-0">
              <SectionTitle>{t("byCity")}</SectionTitle>
              <BarList locale={locale} rows={s.byCity.map((c) => ({ label: c.key === "others" ? t("others") : c.key, total: c.total }))} />
            </section>
            <section className="px-5 lg:px-0">
              <SectionTitle>{t("byCategory")}</SectionTitle>
              <BarList locale={locale} rows={s.byCategory.map((c) => ({ label: category(c.key as Category), total: c.total }))} />
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
