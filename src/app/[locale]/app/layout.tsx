import type { Metadata } from "next";

// Le back-office n'a rien à faire dans un moteur de recherche. Seule la page de connexion peut y figurer.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AppLayout({ children }: LayoutProps<"/[locale]/app">) {
  return children;
}
