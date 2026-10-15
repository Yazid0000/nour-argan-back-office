"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { type NoteState, saveNote } from "@/lib/note-actions";
import { buttonStyles, cx } from "./ui";

/** La note interne d'une commande ou d'un client, enregistrée par saveNote. */
export function NoteForm({
  kind,
  id,
  note,
  label,
  placeholder,
  labelClassName = "sr-only",
}: {
  kind: "order" | "customer";
  id: string;
  note: string | null;
  label: string;
  placeholder: string;
  labelClassName?: string;
}) {
  const t = useTranslations("note");
  const [state, action, pending] = useActionState<NoteState, FormData>(saveNote, null);
  const [value, setValue] = useState(note ?? "");
  // Après l'enregistrement, refresh() renvoie la nouvelle note. Le bouton se rendort tant qu'on n'a rien changé.
  const unchanged = value.trim() === (note ?? "");
  const fieldId = `note-${kind}-${id}`;
  const message = state ? (state.ok ? t("saved") : t(`errors.${state.error}`)) : null;

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={id} />
      <label htmlFor={fieldId} className={labelClassName}>{label}</label>
      <textarea
        id={fieldId}
        name="note"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={500}
        placeholder={placeholder}
        rows={2}
        className="w-full rounded-lg border border-border bg-surface px-3.5 py-3 text-[15px] placeholder:text-text-2"
      />
      <div className="flex items-center justify-between gap-3">
        {/* La zone d'annonce reste en place, chaque nouveau message y est lu. */}
        <p role="status" className={message ? cx("text-[13px]", state?.ok ? "text-ok-fg" : "text-err-fg") : "sr-only"}>
          {message && <span key={message} className="fade-in block">{message}</span>}
        </p>
        <button type="submit" disabled={pending || unchanged} className={cx(buttonStyles.secondary, "ml-auto min-h-11 text-sm disabled:opacity-50")}>
          {t("save")}
        </button>
      </div>
    </form>
  );
}
