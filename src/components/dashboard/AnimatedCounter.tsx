"use client";

import { animate, m, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { useEffect } from "react";

export function AnimatedCounter({ value }: { value: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest).toLocaleString());
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      count.set(value);
      return;
    }
    const controls = animate(count, value, { duration: 0.9, ease: "easeOut" });
    return controls.stop;
  }, [count, reduceMotion, value]);

  return <m.span>{rounded}</m.span>;
}
