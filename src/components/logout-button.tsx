import type { ReactNode } from "react";
import { useLocale } from "next-intl";
import { signOut } from "@/lib/auth-actions";

/** Un vrai formulaire. La déconnexion est une action serveur, elle marche même sans JavaScript. */
export function LogoutButton({ className, children, label }: { className?: string; children: ReactNode; label?: string }) {
  return (
    <form action={signOut}>
      <input type="hidden" name="locale" value={useLocale()} />
      <button type="submit" aria-label={label} className={className}>
        {children}
      </button>
    </form>
  );
}
