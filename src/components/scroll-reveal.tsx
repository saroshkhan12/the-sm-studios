"use client";

import { m, useReducedMotion } from "framer-motion";
import type { AriaRole, ReactNode } from "react";
import {
  fadeDown,
  fadeIn,
  fadeUp,
  scaleIn,
  slideInLeft,
  slideInRight,
  staggerContainer,
  staggerItem,
} from "@/animations/variants";

const revealVariants = {
  fadeIn,
  fadeUp,
  fadeDown,
  slideInLeft,
  slideInRight,
  scaleIn,
} as const;

type RevealVariant = keyof typeof revealVariants;

export function ScrollReveal({
  children,
  className,
  variant = "fadeUp",
  delay = 0,
  role,
  id,
}: {
  children: ReactNode;
  className?: string;
  variant?: RevealVariant;
  delay?: number;
  role?: AriaRole;
  id?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <m.div
      className={className}
      role={role}
      id={id}
      initial={reduceMotion ? false : "hidden"}
      whileInView={reduceMotion ? undefined : "visible"}
      viewport={{ once: true, amount: 0.16 }}
      variants={revealVariants[variant]}
      transition={{ delay }}
    >
      {children}
    </m.div>
  );
}

export function StaggerReveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <m.div
      className={className}
      initial={reduceMotion ? false : "hidden"}
      whileInView={reduceMotion ? undefined : "visible"}
      viewport={{ once: true, amount: 0.12 }}
      variants={staggerContainer}
    >
      {children}
    </m.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <m.div
      className={className}
      variants={reduceMotion ? undefined : staggerItem}
    >
      {children}
    </m.div>
  );
}
