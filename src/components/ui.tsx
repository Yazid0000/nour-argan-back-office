import type { ReactNode } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { ArrowDownRightIcon, ArrowUpRightIcon } from "@phosphor-icons/react/ssr";
import type { Cents, Currency, GaugeTone, Status } from "@/lib/domain";
import { formatMoney, moneyParts } from "@/lib/format";

/** Les petites briques réutilisées par tous les écrans. */

export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export const buttonStyles = {
  primary:
    "inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-[18px] py-2 text-center leading-snug font-semibold text-accent-fg active:scale-[0.98] disabled:opacity-50",
  secondary:
    "inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-center leading-snug font-medium active:scale-[0.98]",
  outline:
    "inline-flex items-center justify-center gap-2 rounded-lg border border-accent px-4 py-2 text-center leading-snug font-semibold text-accent active:scale-[0.98]",
};

export type Tone = "ok" | "warn" | "err" | "neutral" | "info";

const toneStyles: Record<Tone, string> = {
  ok: "bg-ok-bg text-ok-fg",
  warn: "bg-warn-bg text-warn-fg",
  err: "bg-err-bg text-err-fg",
  neutral: "bg-neutral-bg text-neutral-fg",
  info: "bg-accent-soft text-accent",
};

/** Pastille d'état. Une couleur ET un mot, lisible sans la couleur. */
export function Pill({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span
      className={cx(
        "inline-flex h-[22px] flex-none items-center gap-1.5 whitespace-nowrap rounded-full px-[9px] text-xs font-medium",
        toneStyles[tone],
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

export const statusTone: Record<Status, Tone> = {
  received: "warn",
  confirmed: "info",
  prepared: "info",
  shipped: "info",
  delivered: "ok",
  refused: "err",
  returned: "err",
  cancelled: "neutral",
};

export function StatusPill({ status }: { status: Status }) {
  const t = useTranslations("status");
  return <Pill tone={statusTone[status]}>{t(status)}</Pill>;
}

/**
 * La photo principale du produit, ou un bloc rayé de sa couleur s'il n'a pas encore de photo.
 * sizes dit au navigateur la largeur affichée, Next envoie alors une image à la bonne taille.
 */
export function Swatch({ color, photo, label, className, sizes = "64px" }: { color: string; photo?: string; label: string; className?: string; sizes?: string }) {
  if (photo) {
    return (
      <div className={cx("relative flex-none overflow-hidden rounded-lg bg-bg", className ?? "size-11")}>
        <Image src={photo} alt={label} fill sizes={sizes} className="object-cover" />
      </div>
    );
  }
  return (
    <div
      role="img"
      aria-label={label}
      className={cx("flex-none rounded-lg", className ?? "size-11")}
      style={{
        background: `repeating-linear-gradient(135deg, rgba(255,255,255,.14) 0 5px, rgba(255,255,255,0) 5px 10px), ${color}`,
      }}
    />
  );
}

/** La jauge de stock, signature de l'interface. */
export function Gauge({ stock, max, tone, className }: { stock: number; max: number; tone: GaugeTone; className?: string }) {
  const pct = max ? Math.min(100, (stock / max) * 100) : 0;
  return (
    <div
      aria-hidden
      className={cx("h-[3px] overflow-hidden rounded-full", stock === 0 ? "bg-err-bg" : "bg-track", className)}
    >
      <div
        className={cx(
          "h-full rounded-full",
          tone === "accent" ? "bg-accent" : tone === "amber" ? "bg-gauge-amber" : "bg-gauge-red",
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function Money({ cents, currency = "MAD", className }: { cents: Cents; currency?: Currency; className?: string }) {
  const locale = useLocale();
  return <span className={cx("font-mono whitespace-nowrap", className)}>{formatMoney(cents, currency, locale)}</span>;
}

/** Grand chiffre en Schibsted, devise en petit à côté. */
export function BigMoney({ cents, currency = "MAD" }: { cents: Cents; currency?: Currency }) {
  const locale = useLocale();
  const { amount, currency: code } = moneyParts(cents, currency, locale);
  return (
    <>
      {amount}
      <span className="ml-[5px] text-[13px] font-medium text-text-2 lg:text-base">{code}</span>
    </>
  );
}

/** "+12 % vs hier", en vert si ça monte, en rouge si ça baisse. */
export function Delta({ value, suffix }: { value: number | null; suffix?: string }) {
  const locale = useLocale();
  if (value === null) return null;
  const up = value >= 0;
  const Icon = up ? ArrowUpRightIcon : ArrowDownRightIcon;
  const text = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0, signDisplay: "always" }).format(value);
  return (
    <span className={cx("inline-flex items-center gap-1", up ? "text-ok-fg" : "text-err-fg")}>
      <Icon aria-hidden size={12} />
      {text}
      {suffix && ` ${suffix}`}
    </span>
  );
}

/** Une case de la bande de chiffres du jour (séparées par des filets, pas des cartes). */
export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3.5 lg:px-6 lg:py-[18px]">
      <div className="text-[13px] text-text-2">{label}</div>
      <div className="font-display text-[28px] leading-[1.1] font-semibold tracking-[-0.02em] tabular-nums lg:text-[40px]">
        {value}
      </div>
      {sub && <div className="text-xs text-text-2">{sub}</div>}
    </div>
  );
}

export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-2.5 flex items-baseline justify-between gap-3">
      <h2 className="font-display text-[17px] font-semibold">{children}</h2>
      {aside && <span className="font-mono text-[13px] text-text-2">{aside}</span>}
    </div>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx("overflow-hidden rounded-lg border border-border bg-surface", className)}>{children}</div>
  );
}

/** En-tête de page, avec une petite ligne de contexte et une action à droite. */
export function PageHeader({ overline, title, action }: { overline?: ReactNode; title: ReactNode; action?: ReactNode }) {
  return (
    <header className="flex items-end justify-between gap-3 px-5 pt-5 pb-3.5 lg:px-10 lg:pt-7 lg:pb-5">
      <div className="min-w-0">
        {overline && <div className="mb-0.5 text-[13px] text-text-2 lg:mb-1 lg:text-sm">{overline}</div>}
        <h1 className="font-display text-[28px] font-semibold tracking-[-0.02em] lg:text-[32px]">{title}</h1>
      </div>
      {action}
    </header>
  );
}

export function EmptyState({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 px-5 py-12 lg:px-0">
      <span aria-hidden className="text-text-2">{icon}</span>
      <h2 className="font-display text-2xl font-semibold tracking-[-0.02em] text-balance">{title}</h2>
      {children && <div className="text-sm text-text-2">{children}</div>}
    </div>
  );
}

/** Barre fixée en bas de l'écran sur mobile, pour l'action principale à portée de pouce. */
export function ActionBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cx(
        "sticky bottom-0 z-10 flex gap-2.5 border-t border-border bg-bg px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Onglets de filtre en pastilles (Produits, Clients). */
export function Chip({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <span
      className={cx(
        "inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-lg border px-3.5 text-sm font-medium",
        active ? "border-accent bg-accent-soft text-accent" : "border-border bg-surface",
      )}
    >
      {children}
    </span>
  );
}

export const inputStyles =
  "min-h-12 w-full rounded-lg border border-border bg-surface px-3.5 text-[15px] placeholder:text-text-2 focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-accent/30 aria-invalid:border-err-fg";

/** Bande de chiffres séparés par des filets, 2 × 2 sur mobile et 4 en ligne sur desktop. */
export function StatBand({ children, className }: { children: ReactNode[]; className?: string }) {
  return (
    <div className={cx("grid grid-cols-2 border-y border-border lg:grid-cols-4", className)}>
      {children.map((child, i) => (
        <div
          key={i}
          className={cx(
            "border-border lg:border-r-0 lg:border-b-0",
            i % 2 === 0 && "border-r",
            i < 2 && "border-b",
            i > 0 && "lg:border-l",
          )}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

/** Interrupteur on/off. Une vraie case à cocher, stylée en glissière. */
export function Switch({ name, defaultChecked, label, hint }: { name: string; defaultChecked?: boolean; label: string; hint?: string }) {
  return (
    <label className="flex min-h-14 cursor-pointer items-center justify-between gap-4 px-4 py-2.5">
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        {hint && <span className="block text-xs text-text-2">{hint}</span>}
      </span>
      <input type="checkbox" role="switch" name={name} defaultChecked={defaultChecked} className="peer sr-only" />
      <span
        aria-hidden
        className="relative h-7 w-12 flex-none rounded-full bg-neutral-fg transition-colors peer-checked:bg-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent after:absolute after:top-1 after:left-1 after:size-5 after:rounded-full after:bg-surface after:transition-[left] peer-checked:after:left-6"
      />
    </label>
  );
}
