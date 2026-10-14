import { type ReactNode, Suspense } from "react";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { SignOutIcon } from "@phosphor-icons/react/ssr";
import { AccessDenied } from "@/components/access-denied";
import { BottomTabs, Sidebar } from "@/components/app-nav";
import { LogoutButton } from "@/components/logout-button";
import { getNavCounts } from "@/lib/data";
import { getCurrentUser, hasRole } from "@/lib/session";
import Loading from "./loading";

/** Le contrôle serveur. Un préparateur qui tape l'adresse voit « accès refusé », pas la page. */
async function ManagerOnly({ children }: { children: ReactNode }) {
  return (await hasRole("manager")) ? children : <AccessDenied />;
}

async function SidebarWithCount() {
  if (!(await hasRole("manager"))) return null;
  const { toConfirm } = await getNavCounts();
  return <Sidebar toConfirm={toConfirm} />;
}

/** Les onglets de la gérante n'ont pas de sens pour le préparateur. */
async function ManagerTabs() {
  return (await hasRole("manager")) ? <BottomTabs /> : null;
}

async function Account() {
  const [me, t] = await Promise.all([getCurrentUser(), getTranslations("common")]);
  return (
    <div className="flex items-center gap-2.5">
      <span aria-hidden className="flex size-11 items-center justify-center rounded-lg border border-border font-semibold">{me.name[0]}</span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{me.name}</div>
        <div className="text-xs text-text-2">{t(me.role)}</div>
      </div>
      <LogoutButton label={t("logout")} className="flex size-11 items-center justify-center rounded-lg text-text-2 hover:bg-bg">
        <SignOutIcon aria-hidden size={18} />
      </LogoutButton>
    </div>
  );
}

// Écran fixe, seule la zone centrale défile. La barre d'action d'une page reste ainsi au-dessus des onglets.
export default function ManagerLayout({ children }: LayoutProps<"/[locale]/app">) {
  const t = useTranslations("common");
  return (
    <div className="flex h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded-lg focus:bg-surface focus:p-3">
        {t("skip")}
      </a>
      <aside className="hidden w-60 flex-none flex-col border-r border-border bg-surface px-3 py-5 lg:flex">
        <div className="px-3 pt-1 pb-6 font-display text-[19px] font-bold tracking-[-0.02em]">{t("brand")}</div>
        {/* La navigation lit l'adresse et la session, elle arrive donc juste après le reste. */}
        <Suspense fallback={<div className="h-[274px]" />}>
          <SidebarWithCount />
        </Suspense>
        <div className="mt-auto border-t border-border px-3 pt-3">
          <Suspense fallback={<div className="h-11" />}>
            <Account />
          </Suspense>
          <p className="mt-3 text-xs text-text-2">{t("demo")}</p>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <main id="main" className="flex flex-1 flex-col overflow-y-auto">
          <Suspense fallback={<Loading />}>
            <ManagerOnly>{children}</ManagerOnly>
          </Suspense>
        </main>
        <Suspense>
          <ManagerTabs />
        </Suspense>
      </div>
    </div>
  );
}
