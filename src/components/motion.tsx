"use client";

import { AnimatePresence, type HTMLMotionProps, MotionConfig, motion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Les animations de l'interface, toutes ici. Courtes et discrètes, elles montrent ce qui vient de changer.
 * Avec le réglage « réduire les animations » de l'appareil, Motion garde les fondus et coupe les mouvements.
 */
export function MotionRoot({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

/**
 * Une liste dont les éléments s'en vont en glissant, par exemple une commande confirmée qui quitte « À confirmer ».
 * Au premier affichage rien ne bouge. Un changement d'onglet ou de filtre lui donne une autre key,
 * la nouvelle liste s'affiche alors d'un coup. Seules les actions sur une carte sont animées.
 */
export function AnimatedList({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <ul className={className}>
      <AnimatePresence initial={false}>{children}</AnimatePresence>
    </ul>
  );
}

/**
 * Un élément de AnimatedList, et seulement d'elle, car l'animation de départ en dépend.
 * Il apparaît en fondu, glisse vers la gauche en partant, et les autres se resserrent.
 */
export function ListItem(props: HTMLMotionProps<"li">) {
  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -24, transition: { duration: 0.18 } }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      {...props}
    />
  );
}

