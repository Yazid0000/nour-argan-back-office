import { useLocale } from "next-intl";
import type { Cents } from "@/lib/domain";
import { formatDay, formatMoney } from "@/lib/format";

/**
 * Histogramme en barres CSS, comme dans la maquette. Aucune bibliothèque à charger.
 * La dernière barre (aujourd'hui) est pleine, les autres un peu transparentes.
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
  const max = Math.max(1, ...series.map((s) => s.total));
  const middle = series[Math.floor((series.length - 1) / 2)];
  return (
    <div>
      <div role="img" aria-label={label} className={`flex items-end gap-[3px] ${className}`}>
        {series.map((s, i) => (
          <div
            key={i}
            title={`${formatDay(s.date, locale)} · ${formatMoney(s.total, "MAD", locale)}`}
            className={`flex-1 rounded-t-[2px] bg-accent ${i === series.length - 1 ? "" : "opacity-[0.78]"}`}
            style={{ height: `${Math.max(2, (s.total / max) * 100)}%` }}
          />
        ))}
      </div>
      <div aria-hidden className="mt-2 flex justify-between font-mono text-xs text-text-2">
        <span>{formatDay(series[0].date, locale)}</span>
        <span>{formatDay(middle.date, locale)}</span>
        <span>{lastLabel}</span>
      </div>
    </div>
  );
}
