"use client";

import { m, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { useEffect, useState } from "react";

export function CustomCursor() {
  const reduceMotion = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [pressed, setPressed] = useState(false);
  const pointerX = useMotionValue(-100);
  const pointerY = useMotionValue(-100);
  const ringX = useSpring(pointerX, { stiffness: 420, damping: 34, mass: 0.22 });
  const ringY = useSpring(pointerY, { stiffness: 420, damping: 34, mass: 0.22 });

  useEffect(() => {
    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setEnabled(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!enabled || reduceMotion) return;

    const updateTarget = (target: EventTarget | null) => {
      const element =
        target instanceof Element
          ? target.closest<HTMLElement>("a, button, [data-cursor]")
          : null;
      setHovering(Boolean(element));
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      pointerX.set(event.clientX);
      pointerY.set(event.clientY);
    };
    const over = (event: PointerEvent) => updateTarget(event.target);
    const out = (event: PointerEvent) => updateTarget(event.relatedTarget);
    const down = (event: PointerEvent) => {
      if (event.pointerType === "mouse") setPressed(true);
    };
    const up = () => setPressed(false);

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerover", over, { passive: true });
    window.addEventListener("pointerout", out, { passive: true });
    window.addEventListener("pointerdown", down, { passive: true });
    window.addEventListener("pointerup", up, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      window.removeEventListener("pointerout", out);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
    };
  }, [enabled, pointerX, pointerY, reduceMotion]);

  if (!enabled || reduceMotion) return null;

  return (
    <div className="custom-cursor-layer" aria-hidden="true">
      <m.div className="custom-cursor-position" style={{ x: ringX, y: ringY }}>
        <div className="custom-cursor-ring" data-hover={hovering} data-pressed={pressed}>
        </div>
      </m.div>
      <m.div className="custom-cursor-position" style={{ x: pointerX, y: pointerY }}>
        <span className="custom-cursor-dot" data-pressed={pressed} />
      </m.div>
    </div>
  );
}
