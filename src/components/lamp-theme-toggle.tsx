"use client";

import { useEffect, useRef, type PointerEvent, type MouseEvent } from "react";
import { useTheme } from "@/components/theme-provider";

const AX = 60;
const AY = 96;
const LEN = 170;

type CordMotion = {
  x: number; y: number; vx: number; vy: number;
  dragging: boolean; tx: number; ty: number;
};

export function LampThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const lampRef = useRef<HTMLButtonElement>(null);
  const cordRef = useRef<SVGPathElement>(null);
  const hitRef = useRef<SVGPathElement>(null);
  const beadRef = useRef<SVGGElement>(null);
  const flickerTimer = useRef<number | null>(null);
  const motion = useRef<CordMotion>({
    x: 0, y: 0, vx: 0, vy: 0, dragging: false, tx: 0, ty: 0,
  });
  const pointer = useRef<{ startX: number; startY: number; moved: boolean; fired: boolean } | null>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let animationFrame = 0;

    const draw = () => {
      const { x, y } = motion.current;
      const bx = AX + x;
      const by = AY + LEN + y;
      const cx = AX + x * 0.15;
      const cy = (AY + by) / 2;
      const path = `M${AX} ${AY} Q${cx} ${cy} ${bx} ${by}`;
      cordRef.current?.setAttribute("d", path);
      hitRef.current?.setAttribute("d", path);
      beadRef.current?.setAttribute("transform", `translate(${bx} ${by}) rotate(${-x * 0.6})`);
    };

    const frame = (now: number) => {
      const state = motion.current;
      const sway = reduceMotion ? 0 : Math.sin(now / 1100) * 3.5;
      if (state.dragging) {
        state.x += (state.tx - state.x) * 0.35;
        state.y += (state.ty - state.y) * 0.35;
        state.vx = 0;
        state.vy = 0;
      } else {
        state.vx = (state.vx + (sway - state.x) * 0.05) * 0.92;
        state.vy = (state.vy - state.y * 0.09) * 0.9;
        state.x += state.vx;
        state.y += state.vy;
      }
      draw();
      animationFrame = window.requestAnimationFrame(frame);
    };

    draw();
    animationFrame = window.requestAnimationFrame(frame);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      if (flickerTimer.current !== null) window.clearTimeout(flickerTimer.current);
    };
  }, []);

  const switchTheme = () => {
    const bounds = lampRef.current?.getBoundingClientRect();
    toggleTheme(bounds ? { x: bounds.left + bounds.width / 2, y: bounds.top + 105 } : undefined);

    if (theme === "dark" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const lamp = lampRef.current;
      if (lamp) {
        lamp.classList.remove("flicker");
        void lamp.offsetWidth;
        lamp.classList.add("flicker");
        if (flickerTimer.current !== null) window.clearTimeout(flickerTimer.current);
        flickerTimer.current = window.setTimeout(() => lamp.classList.remove("flicker"), 700);
      }
    }
  };

  function handlePointerDown(event: PointerEvent<SVGSVGElement>) {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointer.current = { startX: event.clientX, startY: event.clientY, moved: false, fired: false };
    motion.current.dragging = true;
    lampRef.current?.classList.add("grabbing");
  }

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    const state = pointer.current;
    if (!state) return;
    const dx = event.clientX - state.startX;
    const dy = event.clientY - state.startY;
    motion.current.tx = Math.max(-25, Math.min(25, dx * 0.6));
    motion.current.ty = Math.max(0, Math.min(60, dy));
    if (Math.abs(dx) > 4 || dy > 4) state.moved = true;
    if (motion.current.ty >= 40 && !state.fired) {
      state.fired = true;
      switchTheme();
    }
  }

  function handlePointerUp(event: PointerEvent<SVGSVGElement>) {
    const state = pointer.current;
    if (!state) return;
    pointer.current = null;
    motion.current.dragging = false;
    lampRef.current?.classList.remove("grabbing");
    if (!state.moved) {
      switchTheme();
      motion.current.vy = 9;
    } else if (state.fired) {
      motion.current.vy = -3;
    }
    motion.current.tx = 0;
    motion.current.ty = 0;
    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // The browser may already have released pointer capture.
    }
  }

  function handleKeyboardClick(event: MouseEvent<HTMLButtonElement>) {
    if (event.detail === 0) switchTheme();
  }

  return (
    <button
      ref={lampRef}
      className="lamp"
      id="lamp"
      type="button"
      role="switch"
      aria-label="Dark mode"
      aria-checked={theme === "dark"}
      title={theme === "dark" ? "Pull the cord or press to turn the light on" : "Pull the cord or press to turn the light off"}
      onClick={handleKeyboardClick}
    >
      <svg
        id="lampSvg"
        viewBox="0 0 120 330"
        aria-hidden="true"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <line className="l-wire" x1="60" y1="0" x2="60" y2="42" />
        <path className="l-shade" d="M32 44 Q60 32 88 44 L106 92 H14 Z" />
        <rect className="l-rim" x="14" y="90" width="92" height="7" rx="3.5" />
        <ellipse className="l-bulb" cx="60" cy="102" rx="12" ry="9" />
        <path ref={hitRef} className="l-hit" id="lHit" d="M60 96 L60 266" />
        <path ref={cordRef} className="l-cord" id="lCord" d="M60 96 L60 266" />
        <g ref={beadRef} id="lBead" transform="translate(60 266)">
          <rect className="l-cap" x="-2.5" y="-14" width="5" height="7" rx="2" />
          <circle className="l-bead" r="8" />
        </g>
      </svg>
    </button>
  );
}
