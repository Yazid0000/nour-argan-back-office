import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { BottomTabs, Sidebar } from "@/components/app-nav";
import { getNavCounts, teamMember } from "@/lib/data";

async function SidebarWithCount() {
  const { toConfirm } = await getNavCounts();
  return <Sidebar toConfirm={toConfirm} />;
}

// Écran fixe, seule la zone centrale défile. La barre d'action d'une page reste ainsi au-dessus des onglets.
export default function ManagerLayout({ children }: LayoutProps<"/[locale]/app">) {
  const t = useTranslations("common");
  const me = teamMember("manager");
  return (
    <div className="flex h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded-lg focus:bg-surface focus:p-3">
        {t("skip")}
      </a>
      <aside className="hidden w-60 flex-none flex-col border-r border-border bg-surface px-3 py-5 lg:flex">
        <div className="px-3 pt-1 pb-6 font-display text-[19px] font-bold tracking-[-0.02em]">{t("brand")}</div>
        {/* La navigation lit l'adresse pour surligner la page active, elle arrive donc juste après le reste. */}
        <Suspense fallback={<div className="h-[274px]" />}>
          <SidebarWithCount />
        </Suspense>
        <div className="mt-auto border-t border-border px-3 pt-3">
          <div className="flex items-center gap-2.5">
            <span aria-hidden className="flex size-11 items-center justify-center rounded-lg border border-border font-semibold">{me.name[0]}</span>
            <div>
              <div className="text-sm font-medium">{me.name}</div>
              <div className="text-xs text-text-2">{t("manager")}</div>
            </div>
          </div>
          <p className="mt-3 text-xs text-text-2">{t("demo")}</p>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <main id="main" className="flex flex-1 flex-col overflow-y-auto">
          {children}
        </main>
        <Suspense>
          <BottomTabs />
        </Suspense>
      </div>
    </div>
  );
}
