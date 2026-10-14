"use client";

import type { ComponentProps } from "react";

/** Un <select> qui envoie son formulaire dès qu'on change la valeur (sans JS, le bouton du formulaire suffit). */
export function AutoSubmitSelect(props: ComponentProps<"select">) {
  return <select {...props} onChange={(e) => e.currentTarget.form?.requestSubmit()} />;
}
