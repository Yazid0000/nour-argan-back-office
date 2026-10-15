"use client";

import { type ReactNode, useActionState } from "react";
import { useTranslations } from "next-intl";
import { type Action, isIrreversible } from "@/lib/domain";
import { type OrderActionState, runOrderAction } from "@/lib/order-actions";
import { buttonStyles, cx } from "./ui";

export type ActionButton = {
  action: Action;
  label: ReactNode;
  look: "primary" | "outline" | "secondary" | "link" | "danger";
  className?: string;
};

const looks: Record<ActionButton["look"], string> = {
  primary: buttonStyles.primary,
  outline: buttonStyles.outline,
  secondary: buttonStyles.secondary,
  link: "min-h-11 text-sm font-medium text-accent",
  danger: "min-h-11 text-sm font-medium text-err-fg",
};

/** Un ou plusieurs boutons qui font avancer une commande, avec l'état d'envoi et le message de retour. */
export function OrderActionForm({ orderId, buttons, className }: { orderId: string; buttons: ActionButton[]; className?: string }) {
  const t = useTranslations("orderAction");
  const [state, action, pending] = useActionState<OrderActionState, FormData>(runOrderAction, null);
  const message = state ? (state.ok ? t(`done.${state.action}`) : t(`errors.${state.error}`)) : null;

  return (
    <form action={action} className={cx("flex flex-wrap items-center gap-2.5", className)}>
      <input type="hidden" name="orderId" value={orderId} />
      {/* La zone d'annonce reste en place pour que les lecteurs d'écran lisent chaque nouveau message. La clé relance le fondu. */}
      <p role="status" className={message ? cx("order-first basis-full text-[13px]", state?.ok ? "text-ok-fg" : "text-err-fg") : "sr-only"}>
        {message && <span key={message} className="fade-in block">{message}</span>}
      </p>
      {buttons.map((b) => (
        <button
          key={b.action}
          type="submit"
          name="action"
          value={b.action}
          disabled={pending}
          onClick={(e) => {
            // On ne peut pas défaire ces actions d'un clic, on demande d'abord.
            if (isIrreversible(b.action) && !window.confirm(t(`confirm.${b.action}`))) e.preventDefault();
          }}
          className={cx(looks[b.look], "disabled:opacity-50", b.className)}
        >
          {b.label}
        </button>
      ))}
    </form>
  );
}
