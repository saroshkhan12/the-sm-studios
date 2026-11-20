"use client";

import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { pageTransition } from "@/animations/variants";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.div
        key={pathname}
        initial="hidden"
        animate="visible"
        exit={reduceMotion ? undefined : "exit"}
        variants={pageTransition}
      >
        {children}
      </m.div>
    </AnimatePresence>
  );
}
