import type { ReactNode } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import type { Icon } from "@phosphor-icons/react";
import {
  BellIcon,
  CaretRightIcon,
  ChartBarIcon,
  StorefrontIcon,
  TruckIcon,
  UserCirclePlusIcon,
  UsersIcon,
  WalletIcon,
} from "@phosphor-icons/react/ssr";
import { ResetDemoButton } from "@/components/reset-demo-button";
import { ThemeSelect } from "@/components/theme-select";
import { Card, PageHeader, cx } from "@/components/ui";
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
  // Dans la démo, les réglages de la boutique se lisent sans se modifier. Pas de faux champ ni de faux bouton.
  const field = (label: string, value: string, mono = false) => (
    <div className="flex flex-col gap-1">
      <dt className="text-[13px] text-text-2">{label}</dt>
      <dd className={cx("text-[15px] font-medium", mono && "font-mono")}>{value}</dd>
    </div>
  );
  const setting = (label: string, on: boolean, hint?: string) => (
    <div className="flex min-h-14 items-center justify-between gap-4 px-4 py-2.5">
      <dt>
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="block text-xs text-text-2">{hint}</span>}
      </dt>
      <dd className={cx("flex-none text-sm font-medium", on ? "text-ok-fg" : "text-text-2")}>{t(on ? "on" : "off")}</dd>
    </div>
  );

  return (
    <>
      <PageHeader overline={common("brand")} title={t("title")} />
      <p className="-mt-2 px-5 pb-4 text-sm text-text-2 lg:px-10">{t("readOnly")}</p>

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
            <Card>
              <dl className="grid gap-4 p-4 sm:grid-cols-2">
                {field(t("shopName"), s.shop.name)}
                {field(t("whatsapp"), s.shop.whatsapp, true)}
                {field(t("email"), s.shop.email)}
                {field(t("city"), s.shop.city)}
              </dl>
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
              <dl>{setting(t("freeShipping"), s.freeShippingFrom !== null, t("freeFrom", { amount: money(s.freeShippingFrom ?? 0) }))}</dl>
            </Card>
          </Section>

          <Section id="paiement" title={t("payment")}>
            <Card>
              <dl className="divide-y divide-border">
                {setting(t("cod"), s.payments.cod, t("codHint"))}
                {setting(t("transfer"), s.payments.transfer, t("transferHint"))}
                {setting(t("card"), s.payments.card, t("cardHint"))}
              </dl>
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
            </Card>
          </Section>

          <Section id="notifications" title={t("notifications")}>
            <Card>
              <dl className="divide-y divide-border">
                {setting(t("notifyNewOrder"), s.notifications.newOrder)}
                {setting(t("notifyLowStock"), s.notifications.lowStock)}
                {setting(t("notifyDaily"), s.notifications.dailySummary)}
              </dl>
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
              <ResetDemoButton />
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
