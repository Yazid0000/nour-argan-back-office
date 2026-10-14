"use client";

import { useTranslations } from "next-intl";
import type { Icon } from "@phosphor-icons/react";
import {
  ChartBarIcon,
  DotsThreeOutlineIcon,
  DropIcon,
  GearIcon,
  PlusIcon,
  ReceiptIcon,
  SunHorizonIcon,
  UsersIcon,
} from "@phosphor-icons/react/ssr";
import { Link, usePathname } from "@/i18n/navigation";
import { cx } from "./ui";

type Item = { href: string; key: "today" | "orders" | "products" | "customers" | "stats" | "settings" | "more"; icon: Icon };

const sidebar: Item[] = [
  { href: "/app", key: "today", icon: SunHorizonIcon },
  { href: "/app/commandes", key: "orders", icon: ReceiptIcon },
  { href: "/app/produits", key: "products", icon: DropIcon },
  { href: "/app/clients", key: "customers", icon: UsersIcon },
  { href: "/app/statistiques", key: "stats", icon: ChartBarIcon },
  { href: "/app/parametres", key: "settings", icon: GearIcon },
];

const tabs: Item[] = [
  sidebar[0],
  sidebar[1],
  sidebar[2],
  { href: "/app/parametres", key: "more", icon: DotsThreeOutlineIcon },
];

function isActive(pathname: string, item: Item) {
  if (item.key === "today") return pathname === "/app";
  // « Plus » regroupe Clients, Statistiques et Paramètres sur mobile.
  if (item.key === "more") return ["/app/parametres", "/app/clients", "/app/statistiques"].some((p) => pathname.startsWith(p));
  return pathname.startsWith(item.href);
}

export function Sidebar({ toConfirm }: { toConfirm: number }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  return (
    <nav aria-label={t("label")} className="flex flex-col gap-0.5">
      {sidebar.map((item) => {
        const active = isActive(pathname, item);
        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cx(
              "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm",
              active ? "bg-accent-soft font-semibold text-accent" : "font-medium hover:bg-bg",
            )}
          >
            <item.icon aria-hidden size={20} weight={active ? "fill" : "regular"} />
            <span className="flex-1">{t(item.key)}</span>
            {item.key === "orders" && toConfirm > 0 && (
              <span className="font-mono text-xs text-text-2">{toConfirm}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

const topLevel = new Set(["/app", ...sidebar.map((i) => i.href)]);

/** Barre d'onglets en bas, seulement sur les pages principales (les fiches ont leur propre barre d'action). */
export function BottomTabs() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  if (!topLevel.has(pathname)) return null;
  const item = (i: Item) => {
    const active = isActive(pathname, i);
    return (
      <Link
        key={i.key}
        href={i.href}
        aria-current={active ? "page" : undefined}
        className={cx(
          "flex min-h-[52px] flex-col items-center justify-center gap-1 text-xs",
          active ? "font-semibold text-accent" : "font-medium text-text-2",
        )}
      >
        <i.icon aria-hidden size={22} weight={active ? "fill" : "regular"} />
        {t(i.key)}
      </Link>
    );
  };
  return (
    <nav
      aria-label={t("label")}
      className="grid flex-none grid-cols-5 border-t border-border bg-surface px-1.5 pt-1.5 pb-[max(12px,env(safe-area-inset-bottom))] lg:hidden"
    >
      {tabs.slice(0, 2).map(item)}
      <div className="flex items-center justify-center">
        <Link
          href="/app/produits/nouveau"
          aria-label={t("newProduct")}
          className="flex size-12 items-center justify-center rounded-lg border border-border bg-bg"
        >
          <PlusIcon aria-hidden size={22} />
        </Link>
      </div>
      {tabs.slice(2).map(item)}
    </nav>
  );
}
