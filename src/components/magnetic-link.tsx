"use client";

import Link from "next/link";
import type { ComponentProps, PointerEvent, ReactNode } from "react";
import { m, useMotionValue, useReducedMotion, useSpring } from "framer-motion";

type MagneticLinkProps = Omit<ComponentProps<typeof Link>, "href" | "children"> & {
  href: string;
  children: ReactNode;
};

export function MagneticLink({ href, children, ...props }: MagneticLinkProps) {
  const reduceMotion = useReducedMotion();
  const baseX = useMotionValue(0);
  const baseY = useMotionValue(0);
  const x = useSpring(baseX, { stiffness: 260, damping: 20, mass: 0.25 });
  const y = useSpring(baseY, { stiffness: 260, damping: 20, mass: 0.25 });

  function move(event: PointerEvent<HTMLDivElement>) {
    if (reduceMotion || event.pointerType !== "mouse") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    baseX.set(Math.max(-7, Math.min(7, (event.clientX - bounds.left - bounds.width / 2) * 0.14)));
    baseY.set(Math.max(-5, Math.min(5, (event.clientY - bounds.top - bounds.height / 2) * 0.14)));
  }

  function reset() {
    baseX.set(0);
    baseY.set(0);
  }

  return (
    <m.div
      className="magnetic-link-wrap"
      style={reduceMotion ? undefined : { x, y }}
      onPointerMove={move}
      onPointerLeave={reset}
    >
      <Link href={href} {...props}>
        {children}
      </Link>
    </m.div>
  );
}
