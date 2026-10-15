"use client";

import { useLocale, useTranslations } from "next-intl";
import { Bar, BarChart as Chart, Rectangle, Tooltip } from "recharts";
import type { Cents } from "@/lib/domain";
import { formatDay, formatMoney } from "@/lib/format";

/**
 * Histogramme des ventes par jour, dessiné avec Recharts.
 * La dernière barre (aujourd'hui) est pleine, les autres un peu transparentes, comme dans la maquette.
 * Au survol ou au toucher, une bulle donne le jour et le montant. Au clavier, les flèches passent d'un jour à l'autre.
 * Pas d'animation au chargement, le graphique est là tout de suite.
 */
export function BarChart({
  series,
  label,
  lastLabel,
  className = "h-[84px]",
}: {
  series: { date: Date; total: Cents }[];
  label: string;
  lastLabel: string;
  className?: string;
}) {
  const locale = useLocale();
  const t = useTranslations("common");
  const data = series.map((s) => ({ day: formatDay(s.date, locale), total: s.total }));
  const middle = data[Math.floor((data.length - 1) / 2)];
  const last = data.length - 1;

  return (
    <div>
      <div className={className}>
        <Chart responsive title={label} desc={t("chartKeys")} data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }} barCategoryGap="12%" style={{ width: "100%", height: "100%" }}>
          <Tooltip
            cursor={{ fill: "var(--accent-soft)" }}
            isAnimationActive={false}
            content={({ active, payload }) => {
              const point = payload?.[0]?.payload as (typeof data)[number] | undefined;
              if (!active || !point) return null;
              return (
                <div className="rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs shadow-sm">
                  <div className="text-text-2">{point.day}</div>
                  <div className="font-mono font-semibold">{formatMoney(point.total, "MAD", locale)}</div>
                </div>
              );
            }}
          />
          <Bar
            dataKey="total"
            fill="var(--accent)"
            radius={[2, 2, 0, 0]}
            minPointSize={2}
            isAnimationActive={false}
            shape={(props) => <Rectangle {...props} fillOpacity={props.index === last ? 1 : 0.78} />}
          />
        </Chart>
      </div>
      <div aria-hidden className="mt-2 flex justify-between font-mono text-xs text-text-2">
        <span>{data[0].day}</span>
        <span>{middle.day}</span>
        <span>{lastLabel}</span>
      </div>
    </div>
  );
}
