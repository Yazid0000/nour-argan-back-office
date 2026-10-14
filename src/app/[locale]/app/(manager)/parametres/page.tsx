import type { ReactNode } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import type { Icon } from "@phosphor-icons/react";
import {
  ArrowClockwiseIcon,
  BellIcon,
  CaretRightIcon,
  ChartBarIcon,
  StorefrontIcon,
  TruckIcon,
  UserCirclePlusIcon,
  UsersIcon,
  WalletIcon,
} from "@phosphor-icons/react/ssr";
import { ThemeSelect } from "@/components/theme-select";
import { Card, PageHeader, Switch, buttonStyles, cx, inputStyles } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import { LogoutButton } from "@/components/logout-button";
import { getCustomerCount, getSettings, getStats } from "@/lib/data";
import { getCurrentUser } from "@/lib/session";
import { formatMoney } from "@/lib/format";

function Row({ href, icon: Icon, title, hint }: { href: string; icon: Icon; title: string; hint: string }) {
  return (
    <Link href={href} className="flex min-h-14 items-center gap-3 border-t border-border px-4 py-2.5 first:border-t-0 hover:bg-bg">
      <Icon aria-hidden size={20} className="text-text-2" />
      <span className="flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-text-2">{hint}</span>
      </span>
      <CaretRightIcon aria-hidden size={16} className="text-text-2" />
    </Link>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-4">
      <h2 id={`${id}-title`} className="mb-2.5 font-display text-[17px] font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default async function SettingsPage() {
  const [s, me, customers, stats, t, common, nav, locale] = await Promise.all([
    getSettings(),
    getCurrentUser(),
    getCustomerCount(),
    getStats("30"),
    getTranslations("settings"),
    getTranslations("common"),
    getTranslations("nav"),
    getLocale(),
  ]);
  const money = (cents: number) => formatMoney(cents, "MAD", locale);
  const sections = [
    { id: "boutique", icon: StorefrontIcon, title: t("shop"), hint: t("shopHint") },
    { id: "livraison", icon: TruckIcon, title: t("shipping"), hint: t("shippingHint") },
    { id: "paiement", icon: WalletIcon, title: t("payment"), hint: t("paymentHint") },
    { id: "equipe", icon: UserCirclePlusIcon, title: t("team"), hint: t("teamHint") },
    { id: "notifications", icon: BellIcon, title: t("notifications"), hint: t("notificationsHint") },
  ];
  const field = (id: string, label: string, value: string, mono = false) => (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      <input id={id} name={id} defaultValue={value} className={cx(inputStyles, mono && "font-mono")} />
    </div>
  );

  return (
    <>
      <PageHeader
        overline={common("brand")}
        title={t("title")}
        action={
          // L'enregistrement des réglages n'est dans aucune phase prévue, le bouton reste décoratif.
          <div className="hidden lg:block">
            <button type="button" className={cx(buttonStyles.primary, "h-11 text-[15px]")}>{common("save")}</button>
          </div>
        }
      />

      <div className="flex flex-col gap-[18px] px-4 pb-8 lg:grid lg:grid-cols-[200px_minmax(0,720px)] lg:gap-8 lg:px-10">
        {/* Sur mobile, cette page sert aussi d'onglet « Plus » vers Clients et Statistiques. */}
        <div className="flex flex-col gap-[18px] lg:hidden">
          <div className="flex items-center gap-3 px-1">
            <span aria-hidden className="flex size-12 items-center justify-center rounded-lg border border-border bg-bg text-base font-semibold">{me.name[0]}</span>
            <div>
              <div className="font-semibold">{me.name}</div>
              <div className="text-[13px] text-text-2">{common("manager")} · {common("brand")}</div>
            </div>
          </div>
          <Card>
            <Row href="/app/clients" icon={UsersIcon} title={nav("customers")} hint={t("customersLink", { count: customers })} />
            <Row href="/app/statistiques" icon={ChartBarIcon} title={nav("stats")} hint={`${money(stats.revenue)} · ${t("statsLink")}`} />
          </Card>
          <Card>
            {sections.map((sec) => (
              <Row key={sec.id} href={`#${sec.id}`} icon={sec.icon} title={sec.title} hint={sec.hint} />
            ))}
          </Card>
        </div>

        <nav aria-label={t("title")} className="sticky top-4 hidden flex-col gap-0.5 self-start lg:flex">
          {[...sections, { id: "preferences", title: t("preferences") }].map((sec) => (
            <a key={sec.id} href={`#${sec.id}`} className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium hover:bg-surface">
              {sec.title}
            </a>
          ))}
        </nav>

        <div className="flex flex-col gap-7">
          <Section id="boutique" title={t("shop")}>
            <Card className="grid gap-4 p-4 sm:grid-cols-2">
              {field("shopName", t("shopName"), s.shop.name)}
              {field("whatsapp", t("whatsapp"), s.shop.whatsapp, true)}
              {field("email", t("email"), s.shop.email)}
              {field("city", t("city"), s.shop.city)}
            </Card>
          </Section>

          <Section id="livraison" title={t("shipping")}>
            <Card>
              <ul>
                {s.shippingZones.map((z) => (
                  <li key={z.cities} className="flex min-h-12 items-center justify-between border-b border-border px-4 text-sm">
                    <span>{z.cities === "others" ? t("others") : z.cities}</span>
                    <span className="font-mono">{money(z.fee)}</span>
                  </li>
                ))}
              </ul>
              <Switch
                name="freeShipping"
                defaultChecked={s.freeShippingFrom !== null}
                label={t("freeShipping")}
                hint={t("freeFrom", { amount: money(s.freeShippingFrom ?? 0) })}
              />
            </Card>
          </Section>

          <Section id="paiement" title={t("payment")}>
            <Card className="divide-y divide-border">
              <Switch name="cod" defaultChecked={s.payments.cod} label={t("cod")} hint={t("codHint")} />
              <Switch name="transfer" defaultChecked={s.payments.transfer} label={t("transfer")} hint={t("transferHint")} />
              <Switch name="card" defaultChecked={s.payments.card} label={t("card")} hint={t("cardHint")} />
            </Card>
          </Section>

          <Section id="equipe" title={t("team")}>
            <Card>
              <ul>
                {s.team.map((m) => (
                  <li key={m.email} className="flex min-h-14 items-center gap-3 border-b border-border px-4 py-2.5">
                    <span aria-hidden className="flex size-10 items-center justify-center rounded-lg border border-border bg-bg text-sm font-semibold">{m.name[0]}</span>
                    <span className="flex-1">
                      <span className="block text-sm font-semibold">{m.name}</span>
                      <span className="block text-xs text-text-2">{m.email}</span>
                    </span>
                    <span className="text-xs text-text-2">{common(m.role)}</span>
                  </li>
                ))}
              </ul>
              <button type="button" className="flex min-h-12 w-full items-center gap-2 px-4 text-sm font-medium text-accent">
                <UserCirclePlusIcon aria-hidden size={18} />
                {t("invite")}
              </button>
            </Card>
          </Section>

          <Section id="notifications" title={t("notifications")}>
            <Card className="divide-y divide-border">
              <Switch name="newOrder" defaultChecked={s.notifications.newOrder} label={t("notifyNewOrder")} />
              <Switch name="lowStock" defaultChecked={s.notifications.lowStock} label={t("notifyLowStock")} />
              <Switch name="dailySummary" defaultChecked={s.notifications.dailySummary} label={t("notifyDaily")} />
            </Card>
          </Section>

          <Section id="preferences" title={t("preferences")}>
            <Card className="flex flex-col gap-4 p-4">
              <div className="flex flex-col gap-2">
                <span id="language-label" className="text-sm font-medium">{t("language")}</span>
                <nav aria-labelledby="language-label" className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-surface p-1 sm:w-64">
                  {(["fr", "en"] as const).map((l) => (
                    <Link
                      key={l}
                      href="/app/parametres"
                      locale={l}
                      aria-current={l === locale ? "true" : undefined}
                      className={cx("flex min-h-11 items-center justify-center rounded-md text-sm", l === locale ? "bg-accent-soft font-semibold text-accent" : "font-medium text-text-2")}
                    >
                      {t(`languageNames.${l}`)}
                    </Link>
                  ))}
                </nav>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">{t("theme")}</span>
                <div className="sm:w-80"><ThemeSelect /></div>
              </div>
            </Card>
          </Section>

          <Section id="demo" title={t("demo")}>
            <Card className="flex flex-col items-start gap-3 p-4">
              <p className="text-sm text-text-2">{t("resetHint")}</p>
              {/* Branché à la phase 6, avec la remise à zéro de chaque nuit. */}
              <button type="button" className={cx(buttonStyles.secondary, "h-11 text-sm")}>
                <ArrowClockwiseIcon aria-hidden size={16} />
                {t("reset")}
              </button>
            </Card>
          </Section>

          <LogoutButton className="flex min-h-12 w-full items-center justify-center text-sm font-semibold text-err-fg lg:justify-start">
            {common("logout")}
          </LogoutButton>
        </div>
      </div>
    </>
  );
}
