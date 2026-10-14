import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Link, redirect, useRouter… qui ajoutent "/en" tout seuls quand il le faut.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
