"use client";

import {
  m,
  useMotionValue,
  useSpring,
  type HTMLMotionProps,
} from "framer-motion";
import type { PointerEvent } from "react";
import { quickTransition } from "@/animations/variants";

type MotionButtonProps = HTMLMotionProps<"button"> & {
  magnetic?: boolean;
};

function StaticMotionButton({
  disabled,
  ...props
}: Omit<MotionButtonProps, "magnetic">) {
  const interactive = !disabled;

  return (
    <m.button
      {...props}
      disabled={disabled}
      whileHover={interactive ? { scale: 1.015 } : undefined}
      whileTap={interactive ? { scale: 0.98 } : undefined}
      transition={quickTransition}
    />
  );
}

function MagneticMotionButton({
  children,
  disabled,
  style,
  onPointerMove,
  onPointerLeave,
  ...props
}: Omit<MotionButtonProps, "magnetic">) {
  const interactive = !disabled;
  const offsetX = useMotionValue(0);
  const offsetY = useMotionValue(0);
  const x = useSpring(offsetX, { stiffness: 260, damping: 20, mass: 0.25 });
  const y = useSpring(offsetY, { stiffness: 260, damping: 20, mass: 0.25 });

  function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
    onPointerMove?.(event);
    if (!interactive || event.pointerType !== "mouse") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    offsetX.set(
      Math.max(-6, Math.min(6, (event.clientX - bounds.left - bounds.width / 2) * 0.12)),
    );
    offsetY.set(
      Math.max(-5, Math.min(5, (event.clientY - bounds.top - bounds.height / 2) * 0.12)),
    );
  }

  function handlePointerLeave(event: PointerEvent<HTMLButtonElement>) {
    onPointerLeave?.(event);
    offsetX.set(0);
    offsetY.set(0);
  }

  return (
    <m.button
      {...props}
      disabled={disabled}
      style={interactive ? { ...style, x, y } : style}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      whileHover={interactive ? { scale: 1.015 } : undefined}
      whileTap={interactive ? { scale: 0.98 } : undefined}
      transition={quickTransition}
    >
      {children}
    </m.button>
  );
}

export function MotionButton({ magnetic = false, ...props }: MotionButtonProps) {
  return magnetic ? (
    <MagneticMotionButton {...props} />
  ) : (
    <StaticMotionButton {...props} />
  );
}
