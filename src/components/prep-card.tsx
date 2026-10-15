"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { CheckIcon } from "@phosphor-icons/react/ssr";
import { ListItem } from "./motion";
import { OrderActionForm } from "./order-action-form";
import { cx } from "./ui";

type Item = { id: string; name: string; label: string | null; qty: number; swatch: ReactNode };

/** Une commande à préparer. On coche chaque article en le mettant dans le carton. */
export function PrepCard({
  orderId,
  title,
  subtitle,
  items,
  prepared,
  primary,
}: {
  orderId: string;
  title: ReactNode;
  subtitle: string;
  items: Item[];
  prepared: boolean;
  primary: boolean;
}) {
  const t = useTranslations("prep");
  const action = useTranslations("action");
  const [ticked, setTicked] = useState<Set<string>>(() => new Set());
  // Une commande préparée a tout dans le carton, même si la carte vient d'y passer sous nos yeux.
  const checked = prepared ? new Set(items.map((i) => i.id)) : ticked;
  const nextAction = prepared ? "markShipped" : "markPrepared";
  const toggle = (id: string) =>
    setTicked((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  return (
    <ListItem className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex items-start justify-between gap-3 border-b border-border px-3.5 py-3">
        <div>
          <h2 className="text-[15px]">{title}</h2>
          <p className="text-xs text-text-2">{prepared ? t("prepared") : subtitle}</p>
        </div>
        <span className="font-mono text-[13px] text-text-2">{t("packed", { done: checked.size, total: items.length })}</span>
      </div>
      <ul>
        {items.map((item) => {
          const on = checked.has(item.id);
          return (
            <li key={item.id}>
              <label className="flex min-h-14 cursor-pointer items-center gap-3 px-3.5 py-2">
                <input type="checkbox" checked={on} onChange={() => toggle(item.id)} disabled={prepared} className="peer sr-only" />
                <span
                  aria-hidden
                  className={cx(
                    "flex size-6 flex-none items-center justify-center rounded-md border-2 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent",
                    on ? "border-accent bg-accent text-accent-fg" : "border-border",
                  )}
                >
                  {on && <CheckIcon size={14} weight="bold" />}
                </span>
                {item.swatch}
                <span className="min-w-0 flex-1">
                  <span className={cx("block text-[15px] font-medium", on && "text-text-2 line-through")}>{item.name}</span>
                  {item.label && <span className="block text-xs text-text-2">{item.label}</span>}
                </span>
                <span className="font-mono text-lg font-semibold">×{item.qty}</span>
              </label>
            </li>
          );
        })}
      </ul>
      <div className="px-3.5 pt-1 pb-3.5">
        <OrderActionForm
          orderId={orderId}
          buttons={[
            {
              action: nextAction,
              look: primary ? "primary" : "secondary",
              className: "h-12 w-full text-[15px]",
              label: (
                <>
                  <CheckIcon aria-hidden size={18} />
                  {action(nextAction)}
                </>
              ),
            },
          ]}
        />
      </div>
    </ListItem>
  );
}
