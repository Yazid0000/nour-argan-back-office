import { useTranslations } from "next-intl";
import { StatBand } from "@/components/ui";

const bar = "rounded bg-skeleton motion-safe:animate-pulse";

export default function Loading() {
  const t = useTranslations("states");
  return (
    <div role="status" aria-label={t("loading")} className="flex flex-col gap-6 pb-6">
      <div className="flex items-end justify-between px-5 pt-6 lg:px-10 lg:pt-8">
        <div className="flex flex-col gap-2">
          <div className={`${bar} h-3 w-28`} />
          <div className={`${bar} h-7 w-44`} />
        </div>
        <div className={`${bar} size-11 rounded-lg`} />
      </div>
      <StatBand className="lg:mx-10">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col gap-2 px-4 py-4">
            <div className={`${bar} h-3 w-20`} />
            <div className={`${bar} h-7 w-16`} />
            <div className={`${bar} h-2.5 w-24`} />
          </div>
        ))}
      </StatBand>
      <div className="px-5 lg:px-10">
        <div className={`${bar} mb-3 h-3.5 w-32`} />
        <div className="flex h-20 items-end gap-[3px]">
          {Array.from({ length: 24 }, (_, i) => (
            <div key={i} className={`${bar} flex-1 rounded-b-none`} style={{ height: `${35 + ((i * 37) % 55)}%` }} />
          ))}
        </div>
      </div>
      <div className="mx-5 overflow-hidden rounded-lg border border-border bg-surface lg:mx-10">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 border-border px-4 py-4 not-first:border-t">
            <div className="flex flex-1 flex-col gap-2">
              <div className={`${bar} h-3.5 w-3/5`} />
              <div className={`${bar} h-2.5 w-2/5`} />
            </div>
            <div className={`${bar} h-6 w-20 rounded-full`} />
          </div>
        ))}
      </div>
    </div>
  );
}
